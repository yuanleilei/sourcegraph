import { asyncComponent } from '../util/asyncComponent'
import { ExploreSectionDescriptor } from './ExploreArea'

export const exploreSections: ReadonlyArray<ExploreSectionDescriptor> = [
    {
        render: asyncComponent(
            () => import('../extensions/explore/ExtensionViewsExploreSection'),
            'ExtensionViewsExploreSection',
            require.resolveWeak('../extensions/explore/ExtensionViewsExploreSection')
        ),
    },
    {
        render: asyncComponent(
            () => import('../integrations/explore/IntegrationsExploreSection'),
            'IntegrationsExploreSection',
            require.resolveWeak('../integrations/explore/IntegrationsExploreSection')
        ),
    },
    {
        render: asyncComponent(
            () => import('../repo/explore/RepositoriesExploreSection'),
            'RepositoriesExploreSection',
            require.resolveWeak('../repo/explore/RepositoriesExploreSection')
        ),
    },
    {
        render: asyncComponent(
            () => import('../search/saved-queries/explore/SavedSearchesExploreSection'),
            'SavedSearchesExploreSection',
            require.resolveWeak('../search/saved-queries/explore/SavedSearchesExploreSection')
        ),
    },
    {
        render: asyncComponent(
            () => import('../usageStatistics/explore/SiteUsageExploreSection'),
            'SiteUsageExploreSection',
            require.resolveWeak('../usageStatistics/explore/SiteUsageExploreSection')
        ),
        condition: ({ authenticatedUser }) =>
            (!window.context.sourcegraphDotComMode || window.context.debug) && !!authenticatedUser,
    },
]
