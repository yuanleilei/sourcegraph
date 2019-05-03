import H from 'history'
import React from 'react'
import { Link } from '../../../../../shared/src/components/Link'
import { threadsQueryMatches, threadsQueryWithValues } from '../url'

/** A link in {@link ListHeaderQueryLinks}. */
export interface QueryLink {
    label: string
    queryField: string
    queryValues: string[]
    count: number
    icon?: React.ComponentType<{ className?: string }>
}

interface Props {
    /** The active query. */
    activeQuery: string

    /** The links to display. */
    links: QueryLink[]

    location: H.Location
    className?: string
}

/**
 * A component with links that interact with the query that determines the contents of a list, such
 * as showing "4 open" and "3 closed".
 */
export const ListHeaderQueryLinks: React.FunctionComponent<Props> = ({
    activeQuery,
    links,
    location,
    className = '',
}) => (
    <ul className={`nav ${className}`}>
        {links.map(({ label, queryField, queryValues, count, icon: Icon }, i) => (
            <li key={i} className="nav-item d-flex align-items-center">
                <Link
                    to={urlForThreadsQuery(
                        location,
                        threadsQueryWithValues(activeQuery, { [queryField]: queryValues })
                    )}
                    className={`nav-link text-body p-1 ${
                        queryValues.every(queryValue => threadsQueryMatches(activeQuery, { [queryField]: queryValue }))
                            ? 'active'
                            : 'text-muted'
                    }`}
                >
                    {Icon && <Icon className="icon-inline mr-1" />}
                    {count} {label}
                </Link>
            </li>
        ))}
    </ul>
)

function urlForThreadsQuery(location: Pick<H.Location, 'search'>, threadsQuery: string): H.LocationDescriptor {
    const params = new URLSearchParams(location.search)
    params.set('q', threadsQuery)
    return { ...location, search: `${params}` }
}
