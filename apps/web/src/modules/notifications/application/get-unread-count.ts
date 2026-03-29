import { unstable_cache } from 'next/cache';
import type { NotificationUnreadCountResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { HEADER_BADGE_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getUnreadCount } from '../infrastructure/notification-repository';

const getNotificationUnreadCountCached = unstable_cache(
    async (userId: string) => getUnreadCount(userId),
    ['notification-unread-count'],
    { revalidate: HEADER_BADGE_REVALIDATE_SECONDS },
);

export async function getNotificationUnreadCount(): Promise<NotificationUnreadCountResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    const count = await getNotificationUnreadCountCached(session.user.id);
    return { count };
}
