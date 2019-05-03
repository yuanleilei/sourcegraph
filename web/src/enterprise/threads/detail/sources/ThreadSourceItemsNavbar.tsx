import H from 'history'
import AlertDecagramIcon from 'mdi-react/AlertDecagramIcon'
import CancelIcon from 'mdi-react/CancelIcon'
import CheckIcon from 'mdi-react/CheckIcon'
import FilterIcon from 'mdi-react/FilterIcon'
import React, { useState } from 'react'
import { MultilineTextField } from '../../../../../../shared/src/components/multilineTextField/MultilineTextField'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ListHeaderQueryLinks } from '../../components/ListHeaderQueryLinks'
import { ThreadsAreaContext } from '../../global/ThreadsArea'
import { ThreadSourceItem } from './TextDocumentLocationSourceItem'
import { ThreadSourceItemsListFilter } from './ThreadSourceItemsListFilter'
import { ThreadSourceItemsListHeaderFilterButtonDropdown } from './ThreadSourceItemsListHeaderFilterButtonDropdown'

interface Props extends Pick<ThreadsAreaContext, 'kindIcon'> {
    thread: Pick<GQL.IDiscussionThread, 'title' | 'id'>
    items: { nodes: ThreadSourceItem[] }

    /** The thread source items query. */
    query: string

    /** Called when the thread source items query changes. */
    onQueryChange: (query: string) => void

    includeThreadInfo: boolean
    className?: string
    location: H.Location
}

/**
 * The navbar for the list of thread source items.
 */
// tslint:disable: jsx-no-lambda
export const ThreadSourceItemsNavbar: React.FunctionComponent<Props> = ({
    thread,
    kindIcon: KindIcon,
    items,
    query,
    onQueryChange,
    includeThreadInfo,
    className = '',
    location,
}) => {
    const [showQuery, setShowQuery] = useState(true)
    const [showFilter, setShowFilter] = useState(false)

    return (
        <nav className={`d-block ${className}`}>
            {includeThreadInfo && (
                <div className="d-flex mt-2">
                    <h2 className="font-weight-normal">
                        <KindIcon className="icon-inline text-muted small" /> {thread.title}
                    </h2>
                </div>
            )}
            {showFilter && (
                <div className="d-flex flex-wrap">
                    <div className={`input-group align-items-start mt-2 ${showQuery ? '' : 'w-auto mr-2'}`}>
                        <label
                            htmlFor="thread-source-items-navbar__query"
                            className="input-group-prepend"
                            // style={{ marginTop: '0.35rem' }}
                        >
                            <span className="input-group-text text-body">Query</span>
                        </label>
                        {showQuery ? (
                            <MultilineTextField
                                id="thread-source-items-navbar__query"
                                type="text"
                                className="form-control flex-1"
                                // readOnly={true} // TODO!(sqs): make editable but require confirmation
                                defaultValue={'repo:sourcegraph$ TODO|FIXME'}
                            />
                        ) : (
                            <button
                                type="button"
                                className="btn btn-link border rounded-top-right rounded-bottom-right"
                                onClick={() => setShowQuery(true)}
                            >
                                Show
                            </button>
                        )}
                    </div>
                    <ThreadSourceItemsListFilter value={query} onChange={onQueryChange} className="flex-1 mt-2" />
                </div>
            )}
            <div className="row justify-content-between mt-1">
                {showFilter && (
                    <div className="col-md-6 d-flex align-items-center">
                        <span className="ml-md-5 pl-md-4" />
                        <ThreadSourceItemsListHeaderFilterButtonDropdown
                            header="Filter by repository"
                            items={[
                                'sourcegraph/sourcegraph',
                                'sourcegraph/go-diff',
                                'sourcegraph/codeintellify',
                                'theupdateframework/notary',
                                'sourcegraph/csp',
                            ]}
                        >
                            Repository
                        </ThreadSourceItemsListHeaderFilterButtonDropdown>
                        <ThreadSourceItemsListHeaderFilterButtonDropdown
                            header="Filter by who's assigned"
                            items={['sqs (you)', 'ekonev', 'jleiner', 'ziyang', 'kting7', 'ffranksena']}
                        >
                            Assignee
                        </ThreadSourceItemsListHeaderFilterButtonDropdown>
                        <ThreadSourceItemsListHeaderFilterButtonDropdown
                            header="Sort by"
                            items={['Priority', 'Most recently updated', 'Least recently updated']}
                        >
                            Sort
                        </ThreadSourceItemsListHeaderFilterButtonDropdown>
                    </div>
                )}
                <div className="col-md-6 d-flex align-items-center">
                    <span className="mr-1">Show:</span>
                    <ListHeaderQueryLinks
                        activeQuery={'TODO!(sqs)'}
                        links={[
                            {
                                label: 'open',
                                queryField: 'is',
                                queryValues: ['open'],
                                count: items.nodes.filter(({ status }) => status === 'open').length,
                                icon: AlertDecagramIcon,
                            },
                            {
                                label: 'closed',
                                queryField: 'is',
                                queryValues: ['closed'],
                                count: items.nodes.filter(({ status }) => status === 'closed').length,
                                icon: CheckIcon,
                            },
                            {
                                label: 'ignored',
                                queryField: 'is',
                                queryValues: ['ignored'],
                                count: items.nodes.filter(({ status }) => status === 'ignored').length,
                                icon: CancelIcon,
                            },
                        ]}
                        location={location}
                    />
                </div>
                {!showFilter && (
                    <div className="col-md-6 d-flex justify-content-end">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowFilter(true)}>
                            <FilterIcon /> Filter...
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}
