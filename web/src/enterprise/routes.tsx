import React from 'react'
import { Redirect } from 'react-router'
import { LayoutRouteProps, routes } from '../routes'
import { asyncComponent } from '../util/asyncComponent'
import { welcomeAreaRoutes } from './dotcom/welcome/routes'
import { CodemodIcon } from './threads/icons'

const WelcomeArea = asyncComponent(
    () => import('./dotcom/welcome/WelcomeArea'),
    'WelcomeArea',
    require.resolveWeak('./dotcom/welcome/WelcomeArea')
)

const ThreadsArea = React.lazy(async () => ({
    default: (await import('./threads/global/ThreadsArea')).ThreadsArea,
}))

export const enterpriseRoutes: ReadonlyArray<LayoutRouteProps> = [
    {
        // Allow unauthenticated viewers to view the "new subscription" page to price out a subscription (instead
        // of just dumping them on a sign-in page).
        path: '/subscriptions/new',
        exact: true,
        render: asyncComponent(
            () => import('./user/productSubscriptions/NewProductSubscriptionPageOrRedirectUser'),
            'NewProductSubscriptionPageOrRedirectUser',
            require.resolveWeak('./user/productSubscriptions/NewProductSubscriptionPageOrRedirectUser')
        ),
    },
    {
        // Redirect from old /user/subscriptions/new -> /subscriptions/new.
        path: '/user/subscriptions/new',
        exact: true,
        render: () => <Redirect to="/subscriptions/new" />,
    },

    {
        path: '/start',
        render: () => <Redirect to="/welcome" />,
        exact: true,
    },
    {
        path: '/welcome',
        render: props => <WelcomeArea {...props} routes={welcomeAreaRoutes} />,
    },
    {
        path: '/threads',
        render: ThreadsArea,
    },
    {
        path: '/checks',
        render: asyncComponent(
            () => import('./checks/global/ChecksArea'),
            'ChecksArea',
            require.resolveWeak('./checks/global/ChecksArea')
        ),
    },
    {
        path: '/codemods',
        render: props => <ThreadsArea {...props} kind="codemod" kindIcon={CodemodIcon} />,
    },
    ...routes,
]
