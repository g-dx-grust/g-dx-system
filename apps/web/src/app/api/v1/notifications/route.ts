import type { NotificationListResponse } from '@g-dx/contracts';
import { getNotifications } from '@/modules/notifications/application/list-notifications';
import { markAllRead } from '@/modules/notifications/application/mark-notification-read';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page') ?? '1');
        const pageSize = Number(searchParams.get('pageSize') ?? '20');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const result = await getNotifications({
            page: Number.isFinite(page) ? page : 1,
            pageSize: Number.isFinite(pageSize) ? pageSize : 20,
            unreadOnly,
        });

        return successResponse<NotificationListResponse['data'], NotificationListResponse['meta']>(
            result.data,
            result.meta,
        );
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to notifications.');
        throw error;
    }
}

// POST /notifications → mark all as read
export async function POST() {
    try {
        await markAllRead();
        return successResponse<{ ok: true }>({ ok: true });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to notifications.');
        throw error;
    }
}
