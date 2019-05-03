import H from 'history'
import React from 'react'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ErrorLike } from '../../../../../../shared/src/util/errors'
import { ThreadDeleteButton } from '../../form/ThreadDeleteButton'
import { ThreadStatusButton } from '../../form/ThreadStatusButton'
import { ThreadSettings } from '../../settings'
import { ThreadPullRequestTemplateEditForm } from './ThreadPullRequestTemplateEditForm'
import { ThreadSettingsEditForm } from './ThreadSettingsEditForm'

interface Props extends ExtensionsControllerProps {
    thread: GQL.IDiscussionThread
    threadSettings: ThreadSettings
    onThreadUpdate: (thread: GQL.IDiscussionThread | ErrorLike) => void
    isLightTheme: boolean
    history: H.History
}

/**
 * The manage page for a single thread.
 */
export const ThreadManagePage: React.FunctionComponent<Props> = ({ thread, ...props }) => (
    <div className="thread-manage-page">
        <div className="card d-block">
            <h4 className="card-header">Pull request template</h4>
            <div className="card-body">
                <ThreadPullRequestTemplateEditForm {...props} thread={thread} />
            </div>
        </div>
        <div className="card mt-3 d-block">
            <h4 className="card-header">Settings</h4>
            <div className="card-body">
                <ThreadSettingsEditForm {...props} thread={thread} />
            </div>
        </div>
        <div className="card my-5 d-inline-block">
            <h4 className="card-header">Actions</h4>
            <div className="card-body">
                <ThreadStatusButton {...props} thread={thread} className="mr-2" />
                <ThreadDeleteButton {...props} thread={thread} className="mr-2" />
            </div>
        </div>
    </div>
)
