import React from 'react'
import { eventLogger } from '../../tracking/eventLogger'
import { asyncComponent } from '../../util/asyncComponent'
import { ExtensionAreaRoute } from './ExtensionArea'

const RegistryExtensionOverviewPage = asyncComponent(
    () => import('./RegistryExtensionOverviewPage'),
    'RegistryExtensionOverviewPage',
    require.resolveWeak('./RegistryExtensionOverviewPage')
)

export const extensionAreaRoutes: ReadonlyArray<ExtensionAreaRoute> = [
    {
        path: '',
        exact: true,
        // tslint:disable-next-line:jsx-no-lambda
        render: props => <RegistryExtensionOverviewPage eventLogger={eventLogger} {...props} />,
    },
    {
        path: `/-/manifest`,
        exact: true,
        render: asyncComponent(
            () => import('./RegistryExtensionManifestPage'),
            'RegistryExtensionManifestPage',
            require.resolveWeak('./RegistryExtensionManifestPage')
        ),
    },
    {
        path: `/-/contributions`,
        exact: true,
        render: asyncComponent(
            () => import('./RegistryExtensionContributionsPage'),
            'RegistryExtensionContributionsPage',
            require.resolveWeak('./RegistryExtensionContributionsPage')
        ),
    },
]
