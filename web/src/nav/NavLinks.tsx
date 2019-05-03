import * as H from 'history'
import * as React from 'react'
import { Subscription } from 'rxjs'
import { ContributableMenu } from '../../../shared/src/api/protocol'
import { ActivationProps } from '../../../shared/src/components/activation/Activation'
import { ActivationDropdown } from '../../../shared/src/components/activation/ActivationDropdown'
import { Link } from '../../../shared/src/components/Link'
import { ExtensionsControllerProps } from '../../../shared/src/extensions/controller'
import * as GQL from '../../../shared/src/graphql/schema'
import { PlatformContextProps } from '../../../shared/src/platform/context'
import { SettingsCascadeProps } from '../../../shared/src/settings/settings'
import { WebActionsNavItems, WebCommandListPopoverButton } from '../components/shared'
import { isDiscussionsEnabled } from '../discussions'
import { ChecksIcon, CodemodIcon, ThreadsIcon } from '../enterprise/threads/icons'
import { KeybindingsProps } from '../keybindings'
import { ThemePreferenceProps, ThemeProps } from '../theme'
import { EventLoggerProps } from '../tracking/eventLogger'
import { UserNavItem } from './UserNavItem'

/**
 * A nav link that shows a tooltipped icon on narrow screens and a non-tooltipped icon label on
 * wider screens.
 *
 * The tooltip is hidden on wider screens because it is redundant with the label text.
 */
const NavLinkWithIconOnlyTooltip: React.FunctionComponent<{
    to: string
    text: string
    icon: React.ComponentType<{ className?: string }>
}> = ({ to, text, icon: Icon }) => (
    <Link to={to} className="nav-link d-flex align-items-center">
        <Icon className="icon-inline d-lg-none" data-tooltip={text} />
        <Icon className="icon-inline d-none d-lg-inline-block" />
        <span className="d-none d-lg-inline-block ml-1">{text}</span>
    </Link>
)

interface Props
    extends SettingsCascadeProps,
        KeybindingsProps,
        ExtensionsControllerProps<'executeCommand' | 'services'>,
        PlatformContextProps<'forceUpdateTooltip'>,
        ThemeProps,
        ThemePreferenceProps,
        EventLoggerProps,
        ActivationProps {
    location: H.Location
    history: H.History
    authenticatedUser: GQL.IUser | null
    showDotComMarketing: boolean
}

export class NavLinks extends React.PureComponent<Props> {
    private subscriptions = new Subscription()

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        return (
            <ul className="nav-links nav align-items-center pl-2 pr-1">
                {/* Show "Search" link on small screens when GlobalNavbar hides the SearchNavbarItem. */}
                {this.props.location.pathname !== '/search' && this.props.location.pathname !== '/welcome' && (
                    <li className="nav-item d-sm-none">
                        <Link className="nav-link" to="/search">
                            Search
                        </Link>
                    </li>
                )}
                {this.props.showDotComMarketing && this.props.location.pathname !== '/welcome' && (
                    <li className="nav-item">
                        <Link to="/welcome" className="nav-link">
                            Welcome
                        </Link>
                    </li>
                )}
                {this.props.showDotComMarketing && this.props.location.pathname === '/welcome' && (
                    <li className="nav-item">
                        <a href="https://docs.sourcegraph.com" className="nav-link" target="_blank">
                            Docs
                        </a>
                    </li>
                )}
                <WebActionsNavItems {...this.props} menu={ContributableMenu.GlobalNav} />
                {this.props.activation && (
                    <li className="nav-item">
                        <ActivationDropdown activation={this.props.activation} history={this.props.history} />
                    </li>
                )}
                {(!this.props.showDotComMarketing ||
                    !!this.props.authenticatedUser ||
                    this.props.location.pathname !== '/welcome') && (
                    <>
                        {/* TODO!(sqs): only show these on enterprise */}
                        <li className="nav-item">
                            <NavLinkWithIconOnlyTooltip to="/threads" text="Threads" icon={ThreadsIcon} />
                        </li>
                        <li className="nav-item">
                            <NavLinkWithIconOnlyTooltip to="/checks" text="Checks" icon={ChecksIcon} />
                        </li>
                        <li className="nav-item">
                            <NavLinkWithIconOnlyTooltip to="/codemods" text="Codemods" icon={CodemodIcon} />
                        </li>
                    </>
                )}
                {!this.props.authenticatedUser && (
                    <>
                        {this.props.location.pathname !== '/welcome' && (
                            <li className="nav-item">
                                <Link to="/extensions" className="nav-link">
                                    Extensions
                                </Link>
                            </li>
                        )}
                        {this.props.location.pathname !== '/sign-in' && (
                            <li className="nav-item mx-1">
                                <Link className="nav-link btn btn-primary" to="/sign-in">
                                    Sign in
                                </Link>
                            </li>
                        )}
                        {this.props.showDotComMarketing && (
                            <li className="nav-item">
                                <a href="https://about.sourcegraph.com" className="nav-link">
                                    About
                                </a>
                            </li>
                        )}
                        {this.props.location.pathname !== '/welcome' && (
                            <li className="nav-item">
                                <Link to="/help" className="nav-link">
                                    Help
                                </Link>
                            </li>
                        )}
                    </>
                )}
                {this.props.location.pathname !== '/welcome' && (
                    <WebCommandListPopoverButton
                        {...this.props}
                        menu={ContributableMenu.CommandPalette}
                        toggleVisibilityKeybinding={this.props.keybindings.commandPalette}
                    />
                )}
                {this.props.authenticatedUser && (
                    <li className="nav-item">
                        <UserNavItem
                            {...this.props}
                            authenticatedUser={this.props.authenticatedUser}
                            showDotComMarketing={this.props.showDotComMarketing}
                            showDiscussions={isDiscussionsEnabled(this.props.settingsCascade)}
                        />
                    </li>
                )}
            </ul>
        )
    }
}
