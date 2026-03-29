import type { NotificationListResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listNotifications } from '../infrastructure/notification-repository';

export async function getNotifications(filters: {
    page?: number;
    pageSize?: number;
    unreadOnly?: boolean;
}): Promise<NotificationListResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    return listNotifications(session.user.id, filters);
}
