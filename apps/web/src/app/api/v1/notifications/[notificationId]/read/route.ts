import { markRead } from '@/modules/notifications/application/mark-notification-read';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: { notificationId: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
    try {
        await markRead(params.notificationId);
        return successResponse<{ ok: true }>({ ok: true });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to notifications.');
        if (isAppError(error, 'NOT_FOUND')) return errorResponse(404, 'NOT_FOUND', 'Notification was not found.');
        throw error;
    }
}
