import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { redisDelete } from '@/shared/server/redis-cache';
import { markNotificationRead, markAllNotificationsRead } from '../infrastructure/notification-repository';
import { getNotificationUnreadCacheKey } from './get-unread-count';

export async function markRead(notificationId: string): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    await markNotificationRead(notificationId, session.user.id);
    void redisDelete(getNotificationUnreadCacheKey(session.user.id));
}

export async function markAllRead(): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    await markAllNotificationsRead(session.user.id);
    void redisDelete(getNotificationUnreadCacheKey(session.user.id));
}
