import { siteAdminAreaRoutes } from '../../site-admin/routes'
import { SiteAdminAreaRoute } from '../../site-admin/SiteAdminArea'
import { asyncComponent } from '../../util/asyncComponent'

export const enterpriseSiteAdminAreaRoutes: ReadonlyArray<SiteAdminAreaRoute> = [
    ...siteAdminAreaRoutes,
    {
        path: '/license',
        render: asyncComponent(
            () => import('./productSubscription/SiteAdminProductSubscriptionPage'),
            'SiteAdminProductSubscriptionPage',
            require.resolveWeak('./productSubscription/SiteAdminProductSubscriptionPage')
        ),
        exact: true,
    },
    {
        path: '/dotcom/customers',
        render: asyncComponent(
            () => import('./dotcom/customers/SiteAdminCustomersPage'),
            'SiteAdminProductCustomersPage',
            require.resolveWeak('./dotcom/customers/SiteAdminCustomersPage')
        ),
        exact: true,
    },
    {
        path: '/dotcom/product/subscriptions/new',
        render: asyncComponent(
            () => import('./dotcom/productSubscriptions/SiteAdminCreateProductSubscriptionPage'),
            'SiteAdminCreateProductSubscriptionPage',
            require.resolveWeak('./dotcom/productSubscriptions/SiteAdminCreateProductSubscriptionPage')
        ),
        exact: true,
    },
    {
        path: '/dotcom/product/subscriptions/:subscriptionUUID',
        render: asyncComponent(
            () => import('./dotcom/productSubscriptions/SiteAdminProductSubscriptionPage'),
            'SiteAdminProductSubscriptionPage',
            require.resolveWeak('./dotcom/productSubscriptions/SiteAdminProductSubscriptionPage')
        ),
        exact: true,
    },
    {
        path: '/dotcom/product/subscriptions',
        render: asyncComponent(
            () => import('./dotcom/productSubscriptions/SiteAdminProductSubscriptionsPage'),
            'SiteAdminProductSubscriptionsPage',
            require.resolveWeak('./dotcom/productSubscriptions/SiteAdminProductSubscriptionsPage')
        ),
        exact: true,
    },
    {
        path: '/dotcom/product/licenses',
        render: asyncComponent(
            () => import('./dotcom/productSubscriptions/SiteAdminProductLicensesPage'),
            'SiteAdminProductLicensesPage',
            require.resolveWeak('./dotcom/productSubscriptions/SiteAdminProductLicensesPage')
        ),
        exact: true,
    },
    {
        path: '/auth/providers',
        render: asyncComponent(
            () => import('./SiteAdminAuthenticationProvidersPage'),
            'SiteAdminAuthenticationProvidersPage',
            require.resolveWeak('./SiteAdminAuthenticationProvidersPage')
        ),
        exact: true,
    },
    {
        path: '/auth/external-accounts',
        render: asyncComponent(
            () => import('./SiteAdminExternalAccountsPage'),
            'SiteAdminExternalAccountsPage',
            require.resolveWeak('./SiteAdminExternalAccountsPage')
        ),
        exact: true,
    },
    {
        path: '/registry/extensions',
        render: asyncComponent(
            () => import('./SiteAdminRegistryExtensionsPage'),
            'SiteAdminRegistryExtensionsPage',
            require.resolveWeak('./SiteAdminRegistryExtensionsPage')
        ),
        exact: true,
    },
]
