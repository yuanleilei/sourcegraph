package repoupdater

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/kylelemons/godebug/pretty"
	"github.com/opentracing/opentracing-go"
	"github.com/sourcegraph/sourcegraph/cmd/repo-updater/repos"
	"github.com/sourcegraph/sourcegraph/pkg/api"
	"github.com/sourcegraph/sourcegraph/pkg/extsvc/awscodecommit"
	"github.com/sourcegraph/sourcegraph/pkg/extsvc/bitbucketserver"
	"github.com/sourcegraph/sourcegraph/pkg/extsvc/github"
	"github.com/sourcegraph/sourcegraph/pkg/extsvc/gitlab"
	"github.com/sourcegraph/sourcegraph/pkg/gitserver"
	"github.com/sourcegraph/sourcegraph/pkg/jsonc"
	"github.com/sourcegraph/sourcegraph/pkg/repoupdater"
	"github.com/sourcegraph/sourcegraph/pkg/repoupdater/protocol"
	log15 "gopkg.in/inconshreveable/log15.v2"
)

func TestServer_handleRepoLookup(t *testing.T) {
	s := &Server{
		InternalAPI: &internalAPIFake{},
	}

	h := ObservedHandler(
		log15.Root(),
		NewHandlerMetrics(),
		opentracing.GlobalTracer(),
	)(s.Handler())

	repoLookup := func(t *testing.T, repo api.RepoName) (resp *protocol.RepoLookupResult, statusCode int) {
		t.Helper()
		rr := httptest.NewRecorder()
		body, err := json.Marshal(protocol.RepoLookupArgs{Repo: repo})
		if err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequest("GET", "/repo-lookup", bytes.NewReader(body))
		h.ServeHTTP(rr, req)
		if rr.Code == http.StatusOK {
			if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
				t.Fatal(err)
			}
		}
		return resp, rr.Code
	}
	repoLookupResult := func(t *testing.T, repo api.RepoName) protocol.RepoLookupResult {
		t.Helper()
		resp, statusCode := repoLookup(t, repo)
		if statusCode != http.StatusOK {
			t.Fatalf("http non-200 status %d", statusCode)
		}
		return *resp
	}

	t.Run("args", func(t *testing.T) {
		called := false
		mockRepoLookup = func(args protocol.RepoLookupArgs) (*protocol.RepoLookupResult, error) {
			called = true
			if want := api.RepoName("github.com/a/b"); args.Repo != want {
				t.Errorf("got owner %q, want %q", args.Repo, want)
			}
			return &protocol.RepoLookupResult{Repo: nil}, nil
		}
		defer func() { mockRepoLookup = nil }()

		repoLookupResult(t, "github.com/a/b")
		if !called {
			t.Error("!called")
		}
	})

	t.Run("not found", func(t *testing.T) {
		mockRepoLookup = func(protocol.RepoLookupArgs) (*protocol.RepoLookupResult, error) {
			return &protocol.RepoLookupResult{Repo: nil}, nil
		}
		defer func() { mockRepoLookup = nil }()

		if got, want := repoLookupResult(t, "github.com/a/b"), (protocol.RepoLookupResult{}); !reflect.DeepEqual(got, want) {
			t.Errorf("got %+v, want %+v", got, want)
		}
	})

	t.Run("unexpected error", func(t *testing.T) {
		mockRepoLookup = func(protocol.RepoLookupArgs) (*protocol.RepoLookupResult, error) {
			return nil, errors.New("x")
		}
		defer func() { mockRepoLookup = nil }()

		result, statusCode := repoLookup(t, "github.com/a/b")
		if result != nil {
			t.Errorf("got result %+v, want nil", result)
		}
		if want := http.StatusInternalServerError; statusCode != want {
			t.Errorf("got HTTP status code %d, want %d", statusCode, want)
		}
	})

	t.Run("found", func(t *testing.T) {
		want := protocol.RepoLookupResult{
			Repo: &protocol.RepoInfo{
				ExternalRepo: &api.ExternalRepoSpec{
					ID:          "a",
					ServiceType: github.ServiceType,
					ServiceID:   "https://github.com/",
				},
				Name:        "github.com/c/d",
				Description: "b",
				Fork:        true,
			},
		}
		mockRepoLookup = func(protocol.RepoLookupArgs) (*protocol.RepoLookupResult, error) {
			return &want, nil
		}
		defer func() { mockRepoLookup = nil }()
		if got := repoLookupResult(t, "github.com/c/d"); !reflect.DeepEqual(got, want) {
			t.Errorf("got %+v, want %+v", got, want)
		}
	})
}

func TestRepoLookup(t *testing.T) {
	s := Server{
		Store:       new(repos.FakeStore),
		InternalAPI: &internalAPIFake{},
	}

	t.Run("no args", func(t *testing.T) {
		if _, err := s.repoLookup(context.Background(), protocol.RepoLookupArgs{}); err == nil {
			t.Error()
		}
	})

	t.Run("github", func(t *testing.T) {
		t.Run("not authoritative", func(t *testing.T) {
			orig := repos.GetGitHubRepositoryMock
			repos.GetGitHubRepositoryMock = func(args protocol.RepoLookupArgs) (repo *protocol.RepoInfo, authoritative bool, err error) {
				return nil, false, errors.New("x")
			}
			defer func() { repos.GetGitHubRepositoryMock = orig }()

			result, err := s.repoLookup(context.Background(), protocol.RepoLookupArgs{Repo: "example.com/a/b"})
			if err != nil {
				t.Fatal(err)
			}
			if want := (&protocol.RepoLookupResult{ErrorNotFound: true}); !reflect.DeepEqual(result, want) {
				t.Errorf("got result %+v, want nil", result)
			}
		})

		t.Run("not found", func(t *testing.T) {
			orig := repos.GetGitHubRepositoryMock
			repos.GetGitHubRepositoryMock = func(args protocol.RepoLookupArgs) (repo *protocol.RepoInfo, authoritative bool, err error) {
				return nil, true, github.ErrNotFound
			}
			defer func() { repos.GetGitHubRepositoryMock = orig }()

			result, err := s.repoLookup(context.Background(), protocol.RepoLookupArgs{Repo: "github.com/a/b"})
			if err != nil {
				t.Fatal(err)
			}
			if want := (&protocol.RepoLookupResult{ErrorNotFound: true}); !reflect.DeepEqual(result, want) {
				t.Errorf("got result %+v, want nil", result)
			}
		})

		t.Run("unexpected error", func(t *testing.T) {
			wantErr := errors.New("x")

			orig := repos.GetGitHubRepositoryMock
			repos.GetGitHubRepositoryMock = func(args protocol.RepoLookupArgs) (repo *protocol.RepoInfo, authoritative bool, err error) {
				return nil, true, wantErr
			}
			defer func() { repos.GetGitHubRepositoryMock = orig }()

			result, err := s.repoLookup(context.Background(), protocol.RepoLookupArgs{Repo: "github.com/a/b"})
			if err != wantErr {
				t.Fatal(err)
			}
			if result != nil {
				t.Errorf("got result %+v, want nil", result)
			}
		})
	})
}

func TestRepoLookup_found(t *testing.T) {
	fa := &internalAPIFake{
		metadataUpdate: make(chan *api.ReposUpdateMetadataRequest, 1),
	}
	s := Server{
		Store:       new(repos.FakeStore),
		InternalAPI: fa,
	}

	want := &protocol.RepoLookupResult{
		Repo: &protocol.RepoInfo{
			ExternalRepo: &api.ExternalRepoSpec{
				ID:          "a",
				ServiceType: github.ServiceType,
				ServiceID:   "https://github.com/",
			},
			Name:        "github.com/c/d",
			Description: "b",
			Fork:        true,
		},
	}

	orig := repos.GetGitHubRepositoryMock
	repos.GetGitHubRepositoryMock = func(args protocol.RepoLookupArgs) (repo *protocol.RepoInfo, authoritative bool, err error) {
		return want.Repo, true, nil
	}
	defer func() { repos.GetGitHubRepositoryMock = orig }()

	result, err := s.repoLookup(context.Background(), protocol.RepoLookupArgs{Repo: "github.com/c/d"})
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(result, want) {
		t.Errorf("got %+v, want %+v", result, want)
	}

	select {
	case got := <-fa.metadataUpdate:
		want2 := &api.ReposUpdateMetadataRequest{
			RepoName:    want.Repo.Name,
			Description: want.Repo.Description,
			Fork:        want.Repo.Fork,
			Archived:    want.Repo.Archived,
		}
		if !reflect.DeepEqual(got, want2) {
			t.Errorf("got %+v, want %+v", got, want2)
		}
	case <-time.After(5 * time.Second):
		t.Error("ReposUpdateMetadata was not called")
	}
}

func TestServer_SetRepoEnabled(t *testing.T) {
	githubService := &repos.ExternalService{
		ID:          1,
		Kind:        "GITHUB",
		DisplayName: "github.com - test",
		Config: formatJSON(`
		{
			// Some comment
			"url": "https://github.com",
			"repositoryQuery": ["none"],
			"token": "secret"
		}`),
	}

	githubRepo := (&repos.Repo{
		Name:    "github.com/foo/bar",
		Enabled: false,
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "bar",
			ServiceType: "github",
			ServiceID:   "http://github.com",
		},
		Sources: map[string]*repos.SourceInfo{},
		Metadata: &github.Repository{
			ID:            "bar",
			NameWithOwner: "foo/bar",
		},
	}).With(repos.Opt.RepoSources(githubService.URN()))

	gitlabService := &repos.ExternalService{
		ID:          1,
		Kind:        "GITLAB",
		DisplayName: "gitlab.com - test",
		Config: formatJSON(`
		{
			// Some comment
			"url": "https://gitlab.com",
			"projectQuery": ["none"],
			"token": "secret"
		}`),
	}

	gitlabRepo := (&repos.Repo{
		Name:    "gitlab.com/foo/bar",
		Enabled: false,
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "1",
			ServiceType: "gitlab",
			ServiceID:   "http://gitlab.com",
		},
		Sources: map[string]*repos.SourceInfo{},
		Metadata: &gitlab.Project{
			ProjectCommon: gitlab.ProjectCommon{
				ID:                1,
				PathWithNamespace: "foo/bar",
			},
		},
	}).With(repos.Opt.RepoSources(gitlabService.URN()))

	bitbucketServerService := &repos.ExternalService{
		ID:          1,
		Kind:        "BITBUCKETSERVER",
		DisplayName: "Bitbucket Server - Test",
		Config: formatJSON(`
		{
			// Some comment
			"url": "https://bitbucketserver.mycorp.com",
			"token": "secret",
			"username": "alice",
			"repositoryQuery": ["none"]
		}`),
	}

	bitbucketServerRepo := (&repos.Repo{
		Name:    "bitbucketserver.mycorp.com/foo/bar",
		Enabled: false,
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "1",
			ServiceType: "bitbucketServer",
			ServiceID:   "http://bitbucketserver.mycorp.com",
		},
		Sources: map[string]*repos.SourceInfo{},
		Metadata: &bitbucketserver.Repo{
			ID:   1,
			Slug: "bar",
			Project: &bitbucketserver.Project{
				Key: "foo",
			},
		},
	}).With(repos.Opt.RepoSources(bitbucketServerService.URN()))

	type testCase struct {
		name string
		// which kinds of external services the new syncer manages
		kinds []string
		svcs  repos.ExternalServices // stored services
		repos repos.Repos            // stored repos
		kind  string
		res   *protocol.ExcludeRepoResponse
		err   string
	}

	var testCases []testCase

	testCases = append(testCases, testCase{
		name:  "only new syncer enabled repos are updated",
		kinds: []string{"GITLAB", "BITBUCKETSERVER"},
		svcs: repos.ExternalServices{
			githubService,
			gitlabService,
			bitbucketServerService,
		},
		repos: repos.Repos{githubRepo, gitlabRepo, bitbucketServerRepo},
		kind:  "GITHUB",
		res:   &protocol.ExcludeRepoResponse{},
	})

	testCases = append(testCases, testCase{
		name:  "ignores requests when new syncer is disabled for all kinds",
		kinds: []string{},
		svcs: repos.ExternalServices{
			githubService,
			gitlabService,
			bitbucketServerService,
		},
		repos: repos.Repos{githubRepo, gitlabRepo, bitbucketServerRepo},
		kind:  "BITBUCKETSERVER",
		res:   &protocol.ExcludeRepoResponse{},
	})

	for _, k := range []struct {
		svc  *repos.ExternalService
		repo *repos.Repo
	}{
		{githubService, githubRepo},
		{bitbucketServerService, bitbucketServerRepo},
		{gitlabService, gitlabRepo},
	} {
		svcs := repos.ExternalServices{
			k.svc,
			k.svc.With(func(e *repos.ExternalService) {
				e.ID++
				e.DisplayName += " - Duplicate"
			}),
		}

		testCases = append(testCases, testCase{
			name:  "excluded from every external service of the same kind/" + k.svc.Kind,
			kinds: svcs.Kinds(),
			svcs:  svcs,
			repos: repos.Repos{k.repo}.With(repos.Opt.RepoSources()),
			kind:  k.svc.Kind,
			res: &protocol.ExcludeRepoResponse{
				ExternalServices: apiExternalServices(svcs.With(func(e *repos.ExternalService) {
					if err := e.Exclude(k.repo); err != nil {
						panic(err)
					}
				})...),
			},
		})
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()

			store := new(repos.FakeStore)
			storedSvcs := tc.svcs.Clone()
			err := store.UpsertExternalServices(ctx, storedSvcs...)
			if err != nil {
				t.Fatalf("failed to prepare store: %v", err)
			}

			storedRepos := tc.repos.Clone()
			err = store.UpsertRepos(ctx, storedRepos...)
			if err != nil {
				t.Fatalf("failed to prepare store: %v", err)
			}

			srv := httptest.NewServer((&Server{Kinds: tc.kinds, Store: store}).Handler())
			defer srv.Close()
			cli := repoupdater.Client{URL: srv.URL}

			if tc.err == "" {
				tc.err = "<nil>"
			}

			exclude := storedRepos.Filter(func(r *repos.Repo) bool {
				return strings.EqualFold(r.ExternalRepo.ServiceType, tc.kind)
			})

			if len(exclude) != 1 {
				t.Fatalf("no stored repo of kind %q", tc.kind)
			}

			res, err := cli.ExcludeRepo(ctx, exclude[0].ID)
			if have, want := fmt.Sprint(err), tc.err; have != want {
				t.Errorf("have err: %q, want: %q", have, want)
			}

			if have, want := res, tc.res; !reflect.DeepEqual(have, want) {
				// t.Logf("have: %s\nwant: %s\n", pp.Sprint(have), pp.Sprint(want))
				t.Errorf("response:\n%s", cmp.Diff(have, want))
			}

			if res == nil || len(res.ExternalServices) == 0 {
				return
			}

			ids := make([]int64, 0, len(res.ExternalServices))
			for _, s := range res.ExternalServices {
				ids = append(ids, s.ID)
			}

			svcs, err := store.ListExternalServices(ctx, repos.StoreListExternalServicesArgs{
				IDs: ids,
			})

			if err != nil {
				t.Fatalf("failed to read from store: %v", err)
			}

			have, want := apiExternalServices(svcs...), res.ExternalServices
			if !reflect.DeepEqual(have, want) {
				t.Errorf("stored external services:\n%s", cmp.Diff(have, want))
			}
		})
	}
}

func TestServer_EnqueueRepoUpdate(t *testing.T) {
	repo := repos.Repo{
		Name: "github.com/foo/bar",
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "bar",
			ServiceType: "github",
			ServiceID:   "http://github.com",
		},
		Metadata: new(github.Repository),
		Sources: map[string]*repos.SourceInfo{
			"extsvc:123": {
				ID:       "extsvc:123",
				CloneURL: "https://secret-token@github.com/foo/bar",
			},
		},
	}

	ctx := context.Background()

	type testCase struct {
		name  string
		store repos.Store
		repo  gitserver.Repo
		res   *protocol.RepoUpdateResponse
		err   string
	}

	var testCases []testCase
	testCases = append(testCases,
		func() testCase {
			err := errors.New("boom")
			return testCase{
				name:  "returns an error on store failure",
				store: &repos.FakeStore{ListReposError: err},
				err:   `store.list-repos: boom`,
			}
		}(),
		testCase{
			name:  "missing repo",
			store: new(repos.FakeStore), // empty store
			repo:  gitserver.Repo{Name: "foo"},
			err:   `repo "foo" not found in store`,
		},
		func() testCase {
			repo := repo.Clone()
			repo.Sources = nil

			store := new(repos.FakeStore)
			must(store.UpsertRepos(ctx, repo))

			return testCase{
				name:  "missing clone URL",
				store: store,
				repo:  gitserver.Repo{Name: api.RepoName(repo.Name)},
				res: &protocol.RepoUpdateResponse{
					ID:   repo.ID,
					Name: repo.Name,
				},
			}
		}(),
		func() testCase {
			store := new(repos.FakeStore)
			repo := repo.Clone()
			must(store.UpsertRepos(ctx, repo))
			cloneURL := "https://user:password@github.com/foo/bar"
			return testCase{
				name:  "given clone URL is preferred",
				store: store,
				repo:  gitserver.Repo{Name: api.RepoName(repo.Name), URL: cloneURL},
				res: &protocol.RepoUpdateResponse{
					ID:   repo.ID,
					Name: repo.Name,
					URL:  cloneURL,
				},
			}
		}(),
		func() testCase {
			store := new(repos.FakeStore)
			repo := repo.Clone()
			must(store.UpsertRepos(ctx, repo))
			return testCase{
				name:  "if missing, clone URL is set when stored",
				store: store,
				repo:  gitserver.Repo{Name: api.RepoName(repo.Name)},
				res: &protocol.RepoUpdateResponse{
					ID:   repo.ID,
					Name: repo.Name,
					URL:  repo.CloneURLs()[0],
				},
			}
		}(),
	)

	for _, tc := range testCases {
		tc := tc
		ctx := context.Background()

		t.Run(tc.name, func(t *testing.T) {
			srv := httptest.NewServer((&Server{Store: tc.store}).Handler())
			defer srv.Close()
			cli := repoupdater.Client{URL: srv.URL}

			if tc.err == "" {
				tc.err = "<nil>"
			}

			res, err := cli.EnqueueRepoUpdate(ctx, tc.repo)
			if have, want := fmt.Sprint(err), tc.err; have != want {
				t.Errorf("have err: %q, want: %q", have, want)
			}

			if have, want := res, tc.res; !reflect.DeepEqual(have, want) {
				t.Errorf("response: %s", cmp.Diff(have, want))
			}
		})
	}
}
func TestServer_RepoExternalServices(t *testing.T) {
	service1 := &repos.ExternalService{
		ID:          1,
		Kind:        "GITHUB",
		DisplayName: "github.com - test",
		Config: formatJSON(`
		{
			// Some comment
			"url": "https://github.com",
			"token": "secret"
		}`),
	}
	service2 := &repos.ExternalService{
		ID:          2,
		Kind:        "GITHUB",
		DisplayName: "github.com - test2",
		Config: formatJSON(`
		{
			// Some comment
			"url": "https://github.com",
			"token": "secret"
		}`),
	}

	// No sources are repos that are not managed by the syncer
	repoNoSources := &repos.Repo{
		Name: "gitolite.example.com/oldschool",
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "nosources",
			ServiceType: "gitolite",
			ServiceID:   "http://gitolite.my.corp",
		},
	}

	repoSources := (&repos.Repo{
		Name: "github.com/foo/sources",
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "sources",
			ServiceType: "github",
			ServiceID:   "http://github.com",
		},
		Metadata: new(github.Repository),
	}).With(repos.Opt.RepoSources(service1.URN(), service2.URN()))

	// We share the store across test cases. Initialize now so we have IDs
	// set for test cases.
	ctx := context.Background()
	store := new(repos.FakeStore)
	must(store.UpsertExternalServices(ctx, service1, service2))
	must(store.UpsertRepos(ctx, repoNoSources, repoSources))

	testCases := []struct {
		name   string
		repoID uint32
		svcs   []api.ExternalService
		err    string
	}{{
		name:   "repo no sources",
		repoID: repoNoSources.ID,
		svcs:   nil,
		err:    "<nil>",
	}, {
		name:   "repo sources",
		repoID: repoSources.ID,
		svcs:   apiExternalServices(service1, service2),
		err:    "<nil>",
	}, {
		name:   "repo not in store",
		repoID: 42,
		svcs:   nil,
		err:    "repository with ID 42 does not exist",
	}}

	srv := httptest.NewServer((&Server{Store: store}).Handler())
	defer srv.Close()
	cli := repoupdater.Client{URL: srv.URL}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			res, err := cli.RepoExternalServices(ctx, tc.repoID)
			if have, want := fmt.Sprint(err), tc.err; have != want {
				t.Errorf("have err: %q, want: %q", have, want)
			}

			if have, want := res, tc.svcs; !reflect.DeepEqual(have, want) {
				t.Errorf("response:\n%s", cmp.Diff(have, want))
			}
		})
	}
}

func apiExternalServices(es ...*repos.ExternalService) []api.ExternalService {
	if len(es) == 0 {
		return nil
	}

	svcs := make([]api.ExternalService, 0, len(es))
	for _, e := range es {
		svc := api.ExternalService{
			ID:          e.ID,
			Kind:        e.Kind,
			DisplayName: e.DisplayName,
			Config:      e.Config,
			CreatedAt:   e.CreatedAt,
			UpdatedAt:   e.UpdatedAt,
		}

		if e.IsDeleted() {
			svc.DeletedAt = &e.DeletedAt
		}

		svcs = append(svcs, svc)
	}

	return svcs
}

func TestRepoLookup_syncer(t *testing.T) {
	now := time.Now().UTC()
	ctx := context.Background()

	store := new(repos.FakeStore)
	_ = store.UpsertRepos(ctx, &repos.Repo{
		Name:        "github.com/foo/bar",
		Description: "The description",
		Language:    "barlang",
		Enabled:     true,
		Archived:    false,
		Fork:        false,
		CreatedAt:   now,
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
			ServiceType: "github",
			ServiceID:   "https://github.com/",
		},
		Sources: map[string]*repos.SourceInfo{
			"extsvc:123": {
				ID:       "extsvc:123",
				CloneURL: "git@github.com:foo/bar.git",
			},
		},
		Metadata: &github.Repository{
			ID:            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
			URL:           "github.com/foo/bar",
			DatabaseID:    1234,
			Description:   "The description",
			NameWithOwner: "foo/bar",
		},
	})

	_ = store.UpsertRepos(ctx, &repos.Repo{
		Name:        "git-codecommit.us-west-1.amazonaws.com/stripe-go",
		Description: "The stripe-go lib",
		Language:    "barlang",
		Enabled:     true,
		Archived:    false,
		Fork:        false,
		CreatedAt:   now,
		ExternalRepo: api.ExternalRepoSpec{
			ID:          "f001337a-3450-46fd-b7d2-650c0EXAMPLE",
			ServiceType: awscodecommit.ServiceType,
			ServiceID:   "arn:aws:codecommit:us-west-1:999999999999:",
		},
		Sources: map[string]*repos.SourceInfo{
			"extsvc:456": {
				ID:       "extsvc:456",
				CloneURL: "git@git-codecommit.us-west-1.amazonaws.com/v1/repos/stripe-go",
			},
		},
		Metadata: &awscodecommit.Repository{
			ARN:          "arn:aws:codecommit:us-west-1:999999999999:stripe-go",
			AccountID:    "999999999999",
			ID:           "f001337a-3450-46fd-b7d2-650c0EXAMPLE",
			Name:         "stripe-go",
			Description:  "The stripe-go lib",
			HTTPCloneURL: "https://git-codecommit.us-west-1.amazonaws.com/v1/repos/stripe-go",
			LastModified: &now,
		},
	})

	s := Server{
		Syncer:      &repos.Syncer{},
		Store:       store,
		InternalAPI: &internalAPIFake{},
	}

	t.Run("not found", func(t *testing.T) {
		have, err := s.repoLookup(ctx, protocol.RepoLookupArgs{Repo: "github.com/a/b"})
		if err != nil {
			t.Fatal(err)
		}
		want := &protocol.RepoLookupResult{ErrorNotFound: true}
		if !reflect.DeepEqual(have, want) {
			t.Error(cmp.Diff(have, want))
		}
	})

	testCases := []struct {
		name         string
		repoName     string
		wantRepoInfo *protocol.RepoInfo
	}{
		{
			name:     "found - GitHub",
			repoName: "github.com/foo/bar",
			wantRepoInfo: &protocol.RepoInfo{
				ExternalRepo: &api.ExternalRepoSpec{
					ID:          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
					ServiceType: github.ServiceType,
					ServiceID:   "https://github.com/",
				},
				Name:        "github.com/foo/bar",
				Description: "The description",
				VCS:         protocol.VCSInfo{URL: "git@github.com:foo/bar.git"},
				Links: &protocol.RepoLinks{
					Root:   "github.com/foo/bar",
					Tree:   "github.com/foo/bar/tree/{rev}/{path}",
					Blob:   "github.com/foo/bar/blob/{rev}/{path}",
					Commit: "github.com/foo/bar/commit/{commit}",
				},
			},
		},
		{
			name:     "found - AWS CodeCommit",
			repoName: "git-codecommit.us-west-1.amazonaws.com/stripe-go",
			wantRepoInfo: &protocol.RepoInfo{
				ExternalRepo: &api.ExternalRepoSpec{
					ID:          "f001337a-3450-46fd-b7d2-650c0EXAMPLE",
					ServiceType: awscodecommit.ServiceType,
					ServiceID:   "arn:aws:codecommit:us-west-1:999999999999:",
				},
				Name:        "git-codecommit.us-west-1.amazonaws.com/stripe-go",
				Description: "The stripe-go lib",
				VCS:         protocol.VCSInfo{URL: "git@git-codecommit.us-west-1.amazonaws.com/v1/repos/stripe-go"},
				Links: &protocol.RepoLinks{
					Root:   "https://us-west-1.console.aws.amazon.com/codecommit/home#/repository/stripe-go",
					Tree:   "https://us-west-1.console.aws.amazon.com/codecommit/home#/repository/stripe-go/browse/{rev}/--/{path}",
					Blob:   "https://us-west-1.console.aws.amazon.com/codecommit/home#/repository/stripe-go/browse/{rev}/--/{path}",
					Commit: "https://us-west-1.console.aws.amazon.com/codecommit/home#/repository/stripe-go/commit/{commit}",
				},
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			want := &protocol.RepoLookupResult{Repo: tc.wantRepoInfo}
			result, err := s.repoLookup(ctx, protocol.RepoLookupArgs{Repo: api.RepoName(tc.repoName)})
			if err != nil {
				t.Fatal(err)
			}
			if diff := pretty.Compare(result, want); diff != "" {
				t.Fatalf("ListRepos:\n%s", diff)
			}
		})
	}
}

type internalAPIFake struct {
	metadataUpdate chan *api.ReposUpdateMetadataRequest
}

func (a *internalAPIFake) ReposUpdateMetadata(ctx context.Context, repo api.RepoName, description string, fork, archived bool) error {
	if a.metadataUpdate != nil {
		a.metadataUpdate <- &api.ReposUpdateMetadataRequest{
			RepoName:    repo,
			Description: description,
			Fork:        fork,
			Archived:    archived,
		}
	}
	return nil
}

func formatJSON(s string) string {
	formatted, err := jsonc.Format(s, true, 2)
	if err != nil {
		panic(err)
	}
	return formatted
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}

func init() {
	if !testing.Verbose() {
		log15.Root().SetHandler(log15.LvlFilterHandler(log15.LvlError, log15.Root().GetHandler()))
	}
}
