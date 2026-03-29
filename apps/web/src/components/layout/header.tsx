import { BusinessSwitcher } from './business-switcher';
import { NotificationMenu } from './notification-menu';
import { UserMenu } from './user-menu';
import { getNotificationUnreadCount } from '@/modules/notifications/application/get-unread-count';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';
import type { BusinessScopeType } from '@g-dx/contracts';
import { GlobalSearchBar } from './global-search-bar';

export async function Header() {
    const session = await getAuthenticatedAppSession();
    const availableScopes: BusinessScopeType[] =
        session?.businessMemberships.map((m) => m.code) ?? [];
    const permissionSet = new Set(session ? getGrantedPermissionKeys(session.user.roles) : []);
    const canReadNotifications = permissionSet.has('notification.read');
    const unreadCount = canReadNotifications
        ? (await getNotificationUnreadCount().catch(() => ({ count: 0 }))).count
        : 0;

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 flex-col justify-center border-b bg-white px-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {session ? (
                        <BusinessSwitcher
                            activeBusinessScope={session.activeBusinessScope}
                            availableScopes={availableScopes}
                        />
                    ) : null}
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <GlobalSearchBar />
                    </div>

                    {canReadNotifications ? (
                        <NotificationMenu initialUnreadCount={unreadCount} />
                    ) : null}

                    <UserMenu
                        name={session?.user.name ?? 'ゲスト'}
                        email={session?.user.email ?? ''}
                        avatarUrl={session?.user.avatarUrl}
                        isAdmin={session?.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN') ?? false}
                    />
                </div>
            </div>
        </header>
    );
}
