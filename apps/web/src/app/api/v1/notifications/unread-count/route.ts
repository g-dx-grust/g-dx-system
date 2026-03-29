import type { NotificationUnreadCountResponse } from '@g-dx/contracts';
import { getNotificationUnreadCount } from '@/modules/notifications/application/get-unread-count';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET() {
    try {
        const result = await getNotificationUnreadCount();
        return successResponse<NotificationUnreadCountResponse['data']>(result);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to notifications.');
        throw error;
    }
}
