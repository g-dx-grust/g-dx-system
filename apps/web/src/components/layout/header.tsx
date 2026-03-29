import { Suspense } from 'react';
import { BusinessSwitcher } from './business-switcher';
import { NotificationMenu } from './notification-menu';
import { UserMenu } from './user-menu';
import { getNotificationUnreadCount } from '@/modules/notifications/application/get-unread-count';
import { getGrantedPermissionKeys, type AuthenticatedAppSession } from '@/shared/server/session';
import { GlobalSearchBar } from './global-search-bar';
import { MobileSearchButton } from './mobile-search-button';

interface HeaderProps {
    session: AuthenticatedAppSession;
}

export function Header({ session }: HeaderProps) {
    const availableScopes = session.businessMemberships.map((membership) => membership.code);
    const permissionSet = new Set(getGrantedPermissionKeys(session.user.roles));
    const canReadNotifications = permissionSet.has('notification.read');

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 flex-col justify-center border-b bg-white px-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BusinessSwitcher
                        activeBusinessScope={session.activeBusinessScope}
                        availableScopes={availableScopes}
                    />
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <MobileSearchButton />

                    <div className="hidden md:block">
                        <GlobalSearchBar />
                    </div>

                    {canReadNotifications ? (
                        <Suspense fallback={<NotificationMenu initialUnreadCount={0} />}>
                            <HeaderNotificationMenu />
                        </Suspense>
                    ) : null}

                    <UserMenu
                        name={session.user.name}
                        email={session.user.email}
                        avatarUrl={session.user.avatarUrl}
                        isAdmin={session.user.roles.some((role) => role === 'SUPER_ADMIN' || role === 'ADMIN')}
                    />
                </div>
            </div>
        </header>
    );
}

async function HeaderNotificationMenu() {
    const unreadCount = (await getNotificationUnreadCount().catch(() => ({ count: 0 }))).count;
    return <NotificationMenu initialUnreadCount={unreadCount} />;
}
