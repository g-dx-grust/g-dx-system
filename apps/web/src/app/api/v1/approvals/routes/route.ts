import type { ApprovalRouteListResponse } from '@g-dx/contracts';
import { getApprovalRoutes } from '@/modules/approvals/application/list-approval-routes';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET() {
    try {
        const routes = await getApprovalRoutes();
        return successResponse<ApprovalRouteListResponse['data']>(routes);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to approval routes.');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        throw error;
    }
}
