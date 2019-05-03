import classNames from 'classnames'
import formatDistance from 'date-fns/formatDistance'
import H from 'history'
import { upperFirst } from 'lodash'
import AlertDecagramIcon from 'mdi-react/AlertDecagramIcon'
import CancelIcon from 'mdi-react/CancelIcon'
import CloseCircleIcon from 'mdi-react/CloseCircleIcon'
import MessageOutlineIcon from 'mdi-react/MessageOutlineIcon'
import React from 'react'
import { CodeExcerpt } from '../../../../../../shared/src/components/CodeExcerpt'
import { displayRepoName } from '../../../../../../shared/src/components/RepoFileLink'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import { fetchHighlightedFileLines } from '../../../../repo/backend'
import { SourceItemDiscussion } from './SourceItemDiscussion'

export interface ThreadSourceItem {
    repo: string
    path: string
    line: number
    status: 'open' | 'closed' | 'ignored'
    updatedAt: string
    updatedBy: string
    commentsCount: number
}

interface Props extends ThreadSourceItem, ExtensionsControllerProps {
    className?: string
    isLightTheme: boolean
    history: H.History
    location: H.Location
}

const STATUS_ICONS: Record<ThreadSourceItem['status'], React.ComponentType<{ className?: string }>> = {
    open: AlertDecagramIcon,
    closed: CloseCircleIcon,
    ignored: CancelIcon,
}

/**
 * A source item in a thread that refers to a text document location.
 */
export const TextDocumentLocationSourceItem: React.FunctionComponent<Props> = ({
    repo,
    path = '',
    line,
    status,
    updatedAt,
    updatedBy,
    commentsCount,
    className = '',
    isLightTheme,
    ...props
}) => {
    const Icon = STATUS_ICONS[status]
    return (
        <div className={`card border ${className}`}>
            <div className="card-header d-flex align-items-start">
                <Icon
                    className={classNames('icon-inline', 'mr-2', 'h5', 'mb-0', {
                        'text-info': status === 'open',
                        'text-danger': status === 'closed',
                        'text-muted': status === 'ignored',
                    })}
                    data-tooltip={upperFirst(status)}
                />
                <div className="flex-1">
                    <h3 className="d-flex align-items-center mb-0">
                        <a
                            href={`https://${repo}/pull/${line}`}
                            target="_blank"
                            // tslint:disable-next-line:jsx-ban-props
                            style={{ color: 'var(--body-color)' }}
                        >
                            {path ? (
                                <>
                                    <span className="font-weight-normal">{displayRepoName(repo)}</span> &mdash;{' '}
                                    <code>{path}</code>
                                </>
                            ) : (
                                displayRepoName(repo)
                            )}
                        </a>
                    </h3>
                    <small className="text-muted">
                        #{line} updated {formatDistance(Date.parse(updatedAt), Date.now())} ago by{' '}
                        <strong>{updatedBy}</strong>
                    </small>
                </div>
                <div>
                    {commentsCount > 0 && (
                        <ul className="list-inline d-flex align-items-center">
                            <li className="list-inline-item">
                                <small className="text-muted">
                                    <MessageOutlineIcon className="icon-inline" /> {commentsCount}
                                </small>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
            <CodeExcerpt
                repoName={repo}
                commitID="master" // TODO!(sqs)
                filePath={path}
                context={3}
                highlightRanges={[{ line, character: 0, highlightLength: 25 }]}
                className="p-1"
                isLightTheme={isLightTheme}
                fetchHighlightedFileLines={fetchHighlightedFileLines}
            />
            <SourceItemDiscussion {...props} className="border-top" />
        </div>
    )
}
