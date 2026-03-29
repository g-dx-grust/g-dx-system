import type { NotificationUnreadCountResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getUnreadCount } from '../infrastructure/notification-repository';

export async function getNotificationUnreadCount(): Promise<NotificationUnreadCountResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    const count = await getUnreadCount(session.user.id);
    return { count };
}
