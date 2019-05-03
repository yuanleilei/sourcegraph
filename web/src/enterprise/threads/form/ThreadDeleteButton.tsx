import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import DeleteIcon from 'mdi-react/DeleteIcon'
import React, { useCallback, useState } from 'react'
import { NotificationType } from '../../../../../shared/src/api/client/services/notifications'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { updateThread } from '../../../discussions/backend'

interface Props {
    thread: Pick<GQL.IDiscussionThread, 'id'>
    history: H.History
    className?: string
    extensionsController: {
        services: {
            notifications: {
                showMessages: Pick<
                    ExtensionsControllerProps<
                        'services'
                    >['extensionsController']['services']['notifications']['showMessages'],
                    'next'
                >
            }
        }
    }
}

/**
 * A button that permanently deletes a thread.
 */
export const ThreadDeleteButton: React.FunctionComponent<Props> = ({
    thread: { id: threadID },
    history,
    className = '',
    extensionsController,
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const onClick = useCallback<React.FormEventHandler>(
        async e => {
            e.preventDefault()
            if (!confirm(`Are you sure you want to delete this thread?`)) {
                return
            }
            setIsLoading(true)
            try {
                await updateThread({ ThreadID: threadID, Delete: true })
                history.push('/threads')
            } catch (err) {
                extensionsController.services.notifications.showMessages.next({
                    message: `Error deleting thread: ${err.message}`,
                    type: NotificationType.Error,
                })
            } finally {
                setIsLoading(false)
            }
        },
        [isLoading]
    )
    return (
        <button type="submit" disabled={isLoading} className={`btn btn-danger ${className}`} onClick={onClick}>
            {isLoading ? <LoadingSpinner className="icon-inline" /> : <DeleteIcon className="icon-inline" />} Delete
            thread
        </button>
    )
}
