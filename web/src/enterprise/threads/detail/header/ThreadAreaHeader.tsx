import CodeTagsCheckIcon from 'mdi-react/CodeTagsCheckIcon'
import SettingsIcon from 'mdi-react/SettingsIcon'
import SourcePullIcon from 'mdi-react/SourcePullIcon'
import ViewListIcon from 'mdi-react/ViewListIcon'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { ChatIcon } from '../../../../../../shared/src/components/icons'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ThreadsAreaContext } from '../../global/ThreadsArea'
import { ThreadSettings } from '../../settings'
import { ThreadHeaderEditableTitle } from './ThreadHeaderEditableTitle'

interface Props extends Pick<ThreadsAreaContext, 'kindIcon'>, ExtensionsControllerProps {
    thread: GQL.IDiscussionThread
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
    threadSettings: ThreadSettings
    areaURL: string
}

/**
 * The header for the thread area (for a single thread).
 */
export const ThreadAreaHeader: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    threadSettings,
    areaURL,
    kindIcon,
    ...props
}) => (
    <div className="thread-area-header border-top-0 border-bottom simple-area-header">
        <div className="container">
            <ThreadHeaderEditableTitle
                {...props}
                thread={thread}
                onThreadUpdate={onThreadUpdate}
                kindIcon={kindIcon}
                className="thread-area-header__thread-title mt-4"
            />
            <div className="area-header__nav mt-4">
                <div className="area-header__nav-links">
                    <NavLink
                        to={areaURL}
                        className="btn area-header__nav-link"
                        activeClassName="area-header__nav-link--active"
                        exact={true}
                    >
                        <ChatIcon className="icon-inline" /> Conversation
                    </NavLink>
                    <NavLink
                        to={`${areaURL}/sources`}
                        className="btn area-header__nav-link"
                        activeClassName="area-header__nav-link--active"
                        exact={true}
                    >
                        <ViewListIcon className="icon-inline" /> Sources{' '}
                        <span className="badge badge-secondary">19</span>
                    </NavLink>
                    <NavLink
                        to={`${areaURL}/activity`}
                        className="btn area-header__nav-link"
                        activeClassName="area-header__nav-link--active"
                        exact={true}
                    >
                        <SourcePullIcon className="icon-inline" /> Changes{' '}
                        {threadSettings.createPullRequests && <span className="badge badge-secondary">50%</span>}
                    </NavLink>
                    <NavLink
                        to={`${areaURL}/manage`}
                        className="btn area-header__nav-link"
                        activeClassName="area-header__nav-link--active"
                        exact={true}
                    >
                        <SettingsIcon className="icon-inline" /> Manage
                    </NavLink>
                </div>
            </div>
        </div>
    </div>
)
