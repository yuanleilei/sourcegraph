import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import React, { useMemo, useState } from 'react'
import { of } from 'rxjs'
import { WithStickyTop } from '../../../../../../shared/src/components/withStickyTop/WithStickyTop'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { asError, ErrorLike, isErrorLike } from '../../../../../../shared/src/util/errors'
import { ThreadsAreaContext } from '../../global/ThreadsArea'
import { ThreadSettings } from '../../settings'
import { TextDocumentLocationSourceItem, ThreadSourceItem } from './TextDocumentLocationSourceItem'
import { ThreadSourceItemsNavbar } from './ThreadSourceItemsNavbar'

const DATA: ThreadSourceItem[] = [
    {
        repo: 'github.com/sourcegraph/go-diff',
        path: 'diff/diff.go',
        line: 34,
        status: 'open',
        updatedAt: new Date(Date.now() - 10000000).toISOString(),
        updatedBy: 'alice',
        commentsCount: 1,
    },
    {
        repo: 'github.com/sourcegraph/codeintellify',
        path: 'src/hoverifier.ts',
        line: 448,
        status: 'open',
        updatedAt: new Date(Date.now() - 5000000).toISOString(),
        updatedBy: 'lguychard',
        commentsCount: 7,
    },
    {
        repo: 'github.com/sourcegraph/codeintellify',
        path: 'src/helpers.ts',
        line: 27,
        status: 'open',
        updatedAt: new Date(Date.now() - 2300000).toISOString(),
        updatedBy: 'felixfbecker',
        commentsCount: 2,
    },
    {
        repo: 'github.com/theupdateframework/notary',
        path: 'server/storage/tuf_store.go',
        line: 24,
        status: 'open',
        updatedAt: new Date(Date.now() - 5300000).toISOString(),
        updatedBy: 'jwhitaker',
        commentsCount: 3,
    },
    {
        repo: 'github.com/sourcegraph/csp',
        path: 'csp.go',
        line: 40,
        status: 'closed',
        updatedAt: new Date(Date.now() - 9300000).toISOString(),
        updatedBy: 'peter91',
        commentsCount: 5,
    },
    {
        repo: 'github.com/sourcegraph/sitemap',
        path: 'sitemap.go',
        line: 81,
        status: 'closed',
        updatedAt: new Date(Date.now() - 4100000).toISOString(),
        updatedBy: 'carol',
        commentsCount: 0,
    },
    {
        repo: 'github.com/sourcegraph/sourcegraph-lightstep',
        path: 'src/extension.ts',
        line: 37,
        status: 'closed',
        updatedAt: new Date(Date.now() - 7100000).toISOString(),
        updatedBy: 'tsenart',
        commentsCount: 1,
    },
    {
        repo: 'github.com/sourcegraph/docsite',
        path: 'markdown/html.go',
        line: 50,
        status: 'closed',
        updatedAt: new Date(Date.now() - 5500000).toISOString(),
        updatedBy: 'felixfbecker',
        commentsCount: 5,
    },
    {
        repo: 'github.com/sourcegraph/docsite',
        path: 'markdown/tree.go',
        line: 27,
        status: 'closed',
        updatedAt: new Date(Date.now() - 3500000).toISOString(),
        updatedBy: 'ryan-blunden',
        commentsCount: 2,
    },
    {
        repo: 'github.com/sourcegraph/thyme',
        path: 'linux.go',
        line: 55,
        status: 'ignored',
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        updatedBy: 'beyang',
        commentsCount: 21,
    },
    {
        repo: 'github.com/sourcegraph/sourcegraph-git-extras',
        path: 'src/blame.ts',
        line: 132,
        status: 'ignored',
        updatedAt: new Date(Date.now() - 6200000).toISOString(),
        updatedBy: 'xyzhao',
        commentsCount: 2,
    },
]

const querySourceItems = (_threadID: string) =>
    of({
        nodes: DATA,
        totalCount: DATA.length,
    })

interface Props extends Pick<ThreadsAreaContext, 'kindIcon'>, ExtensionsControllerProps {
    thread: Pick<GQL.IDiscussionThread, 'id' | 'title'>
    threadSettings: ThreadSettings

    /** The thread source items query. */
    query: string

    /** Called when the thread source items query changes. */
    onQueryChange: (query: string) => void

    history: H.History
    location: H.Location
    isLightTheme: boolean
}

const LOADING: 'loading' = 'loading'

/**
 * The list of thread source items.
 */
export const ThreadSourceItemsList: React.FunctionComponent<Props> = ({
    thread,
    kindIcon,
    query,
    onQueryChange,
    history,
    location,
    isLightTheme,
    extensionsController,
}) => {
    const [itemsOrError, setItemsOrError] = useState<
        typeof LOADING | { nodes: typeof DATA; totalCount: number } | ErrorLike
    >(LOADING)

    // tslint:disable-next-line: no-floating-promises because querySourceItems never throws
    useMemo(async () => {
        try {
            setItemsOrError(await querySourceItems(thread.id).toPromise())
        } catch (err) {
            setItemsOrError(asError(err))
        }
    }, [thread.id])

    return (
        <div className="thread-source-items-list position-relative">
            {isErrorLike(itemsOrError) ? (
                <div className="alert alert-danger mt-2">{itemsOrError.message}</div>
            ) : (
                <>
                    {itemsOrError !== LOADING && !isErrorLike(itemsOrError) && (
                        <WithStickyTop scrollContainerSelector=".thread-area">
                            {({ isStuck }) => (
                                <ThreadSourceItemsNavbar
                                    thread={thread}
                                    kindIcon={kindIcon}
                                    items={itemsOrError}
                                    query={query}
                                    onQueryChange={onQueryChange}
                                    includeThreadInfo={isStuck}
                                    className={`sticky-top position-sticky row bg-body thread-source-items-list__navbar py-2 px-3 ${
                                        isStuck ? 'border-top border-bottom shadow' : ''
                                    }`}
                                    location={location}
                                />
                            )}
                        </WithStickyTop>
                    )}
                    {itemsOrError === LOADING ? (
                        <LoadingSpinner className="mt-2" />
                    ) : itemsOrError.nodes.length === 0 ? (
                        <p className="p-2 mb-0 text-muted">No source items found.</p>
                    ) : (
                        <ul className="list-unstyled">
                            {itemsOrError.nodes.map((data, i) => (
                                <li key={i}>
                                    <TextDocumentLocationSourceItem
                                        key={i}
                                        {...data}
                                        className="my-3"
                                        isLightTheme={isLightTheme}
                                        history={history}
                                        location={location}
                                        extensionsController={extensionsController}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    )
}
