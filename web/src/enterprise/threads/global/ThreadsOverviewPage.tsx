import H from 'history'
import { upperFirst } from 'lodash'
import React from 'react'
import { PageTitle } from '../../../components/PageTitle'
import { ThreadsList } from '../list/ThreadsList'
import { threadsQueryWithValues } from '../url'
import { ThreadsAreaContext } from './ThreadsArea'

interface Props extends ThreadsAreaContext {
    history: H.History
    location: H.Location
}

/**
 * The threads overview page.
 */
export const ThreadsOverviewPage: React.FunctionComponent<Props> = props => {
    const q = new URLSearchParams(location.search).get('q')
    const query = q === null ? threadsQueryWithValues('', { is: [props.kind, 'open'] }) : q
    const onQueryChange = (query: string) => {
        const params = new URLSearchParams(location.search)
        params.set('q', query)
        props.history.push({ search: `${params}` })
    }

    return (
        <div className="threads-overview-page mt-3 container">
            <PageTitle title={upperFirst(props.kind)} />
            <ThreadsList {...props} query={query} onQueryChange={onQueryChange} />
        </div>
    )
}
