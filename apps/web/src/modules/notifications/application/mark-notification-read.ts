import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { markNotificationRead, markAllNotificationsRead } from '../infrastructure/notification-repository';

export async function markRead(notificationId: string): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    return markNotificationRead(notificationId, session.user.id);
}

export async function markAllRead(): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    return markAllNotificationsRead(session.user.id);
}
