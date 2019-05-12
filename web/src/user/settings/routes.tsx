import React from 'react'
import { SiteAdminAlert } from '../../site-admin/SiteAdminAlert'
import { asyncComponent } from '../../util/asyncComponent'
import { UserSettingsAreaRoute } from './UserSettingsArea'

const SettingsArea = asyncComponent(
    () => import('../../settings/SettingsArea'),
    'SettingsArea',
    require.resolveWeak('../../settings/SettingsArea')
)

export const userSettingsAreaRoutes: ReadonlyArray<UserSettingsAreaRoute> = [
    {
        path: '',
        exact: true,
        // tslint:disable-next-line:jsx-no-lambda
        render: props => (
            <SettingsArea
                {...props}
                subject={props.user}
                isLightTheme={props.isLightTheme}
                extraHeader={
                    <>
                        {props.authenticatedUser && props.user.id !== props.authenticatedUser.id && (
                            <SiteAdminAlert className="sidebar__alert">
                                Viewing settings for <strong>{props.user.username}</strong>
                            </SiteAdminAlert>
                        )}
                        <p>User settings override global and organization settings.</p>
                    </>
                }
            />
        ),
    },
    {
        path: '/profile',
        exact: true,
        render: asyncComponent(
            () => import('./profile/UserSettingsProfilePage'),
            'UserSettingsProfilePage',
            require.resolveWeak('./profile/UserSettingsProfilePage')
        ),
    },
    {
        path: '/password',
        exact: true,
        render: asyncComponent(
            () => import('./auth/UserSettingsPasswordPage'),
            'UserSettingsPasswordPage',
            require.resolveWeak('./auth/UserSettingsPasswordPage')
        ),
    },
    {
        path: '/emails',
        exact: true,
        render: asyncComponent(
            () => import('./emails/UserSettingsEmailsPage'),
            'UserSettingsEmailsPage',
            require.resolveWeak('./emails/UserSettingsEmailsPage')
        ),
    },
    {
        path: '/tokens',
        exact: true,
        render: asyncComponent(
            () => import('./accessTokens/UserSettingsTokensPage'),
            'UserSettingsTokensPage',
            require.resolveWeak('./accessTokens/UserSettingsTokensPage')
        ),
        condition: () => window.context.accessTokensAllow !== 'none',
    },
    {
        path: '/tokens/new',
        exact: true,
        render: asyncComponent(
            () => import('./accessTokens/UserSettingsCreateAccessTokenPage'),
            'UserSettingsCreateAccessTokenPage',
            require.resolveWeak('./accessTokens/UserSettingsCreateAccessTokenPage')
        ),
        condition: () => window.context.accessTokensAllow !== 'none',
    },
]
