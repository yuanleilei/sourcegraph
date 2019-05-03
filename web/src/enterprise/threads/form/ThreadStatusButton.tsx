import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import CheckIcon from 'mdi-react/CheckIcon'
import DeleteIcon from 'mdi-react/DeleteIcon'
import React, { useCallback, useState } from 'react'
import { NotificationType } from '../../../../../shared/src/api/client/services/notifications'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { updateThread } from '../../../discussions/backend'

interface Props {
    thread: Pick<GQL.IDiscussionThread, 'id' | 'status'>
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
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
 * A button that changes the status of a thread.
 *
 * TODO!(sqs): currently it only sets it archived ("closed")
 * TODO!(sqs): add tests like for ThreadHeaderEditableTitle
 */
export const ThreadStatusButton: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    className = '',
    extensionsController,
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const onClick = useCallback<React.FormEventHandler>(
        async e => {
            e.preventDefault()
            setIsLoading(true)
            try {
                const updatedThread = await updateThread({ ThreadID: thread.id, Archive: true })
                onThreadUpdate(updatedThread)
            } catch (err) {
                extensionsController.services.notifications.showMessages.next({
                    message: `Error archiving thread: ${err.message}`,
                    type: NotificationType.Error,
                })
            } finally {
                setIsLoading(false)
            }
        },
        [isLoading]
    )
    const isOpen = thread.status === GQL.DiscussionThreadStatus.OPEN
    return (
        <button
            type="submit"
            disabled={isLoading || !isOpen}
            className={`btn btn-secondary ${className}`}
            onClick={onClick}
            data-tooltip={!isOpen && 'This thread is already closed.'}
        >
            {isLoading ? <LoadingSpinner className="icon-inline" /> : <CheckIcon className="icon-inline" />}{' '}
            {isOpen ? 'Close thread' : 'Thread is closed'}
        </button>
    )
}
