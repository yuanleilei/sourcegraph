import H from 'history'
import PencilIcon from 'mdi-react/PencilIcon'
import React, { useState } from 'react'
import { ChatIcon } from '../../../../../../shared/src/components/icons'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import { DiscussionsCreate } from '../../../../repo/blob/discussions/DiscussionsCreate'

interface Props extends ExtensionsControllerProps {
    className?: string
    history: H.History
    location: H.Location
}

/**
 * The discussion about a source item.
 */
// tslint:disable: jsx-no-lambda
export const SourceItemDiscussion: React.FunctionComponent<Props> = ({
    className,
    history,
    location,
    extensionsController,
}) => {
    const [isCreating, setIsCreating] = useState(false)

    return (
        <div className={className}>
            {isCreating ? (
                <DiscussionsCreate
                    repoID={'123'}
                    repoName={'repo'}
                    commitID="master" // TODO!(sqs)
                    rev="master"
                    filePath="abc"
                    className="border-top"
                    onDiscard={() => setIsCreating(false)}
                    extensionsController={extensionsController}
                    history={history}
                    location={location}
                />
            ) : (
                <>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn btn-link text-right text-decoration-none"
                    >
                        <ChatIcon className="icon-inline" /> Add comment
                    </button>
                    <button
                        onClick={() => alert('not implemented')}
                        className="btn btn-link text-right text-decoration-none"
                    >
                        <PencilIcon className="icon-inline" /> Edit
                    </button>
                </>
            )}
        </div>
    )
}
