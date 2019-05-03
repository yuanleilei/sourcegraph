import H from 'history'
import React from 'react'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ErrorLike } from '../../../../../../shared/src/util/errors'
import { ThreadSettings } from '../../settings'
import { ThreadSourceItemsList } from './ThreadSourceItemsList'

interface Props extends ExtensionsControllerProps {
    thread: GQL.IDiscussionThread
    onThreadUpdate: (thread: GQL.IDiscussionThread | ErrorLike) => void
    threadSettings: ThreadSettings

    history: H.History
    location: H.Location
    isLightTheme: boolean
}

/** The default thread source items query. */
const DEFAULT_QUERY = 'is:active'

/**
 * The sources page for a single thread.
 */
export const ThreadSourcesPage: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    threadSettings,
    ...props
}) => {
    const q = new URLSearchParams(location.search).get('q')
    const query = q === null ? DEFAULT_QUERY : q
    const onQueryChange = (query: string) => {
        const params = new URLSearchParams(location.search)
        params.set('q', query)
        props.history.push({ search: `${params}` })
    }

    return (
        <div className="thread-sources-page">
            <ThreadSourceItemsList
                {...props}
                thread={thread}
                threadSettings={threadSettings}
                query={query}
                onQueryChange={onQueryChange}
            />
        </div>
    )
}
