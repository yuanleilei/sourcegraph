package backend

import (
	"context"

	"sourcegraph.com/sourcegraph/sourcegraph/api/sourcegraph"
	"sourcegraph.com/sourcegraph/sourcegraph/services/backend/internal/localstore"
)

var Pkgs = &pkgs{}

type pkgs struct{}

func (p *pkgs) UnsafeRefreshIndex(ctx context.Context, op *sourcegraph.DefsRefreshIndexOp) (err error) {
	if Mocks.Pkgs.UnsafeRefreshIndex != nil {
		return Mocks.Pkgs.UnsafeRefreshIndex(ctx, op)
	}

	ctx, done := trace(ctx, "Pkgs", "UnsafeRefreshIndex", op, &err)
	defer done()

	inv, err := Repos.GetInventory(ctx, &sourcegraph.RepoRevSpec{op.RepoID, op.CommitID})
	if err != nil {
		return err
	}
	return localstore.Pkgs.UnsafeRefreshIndex(ctx, op, inv.Languages)
}

func (p *pkgs) ListPackages(ctx context.Context, op *sourcegraph.ListPackagesOp) (pkgs []sourcegraph.PackageInfo, err error) {
	if Mocks.Pkgs.ListPackages != nil {
		return Mocks.Pkgs.ListPackages(ctx, op)
	}
	return localstore.Pkgs.ListPackages(ctx, op)
}

type MockPkgs struct {
	UnsafeRefreshIndex func(ctx context.Context, op *sourcegraph.DefsRefreshIndexOp) error
	ListPackages       func(ctx context.Context, op *sourcegraph.ListPackagesOp) (pkgs []sourcegraph.PackageInfo, err error)
}
