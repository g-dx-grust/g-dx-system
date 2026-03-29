import type { ApprovalRequestDetailResponse } from '@g-dx/contracts';
import { getApprovalDetail } from '@/modules/approvals/application/get-approval-detail';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: { approvalId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
    try {
        const detail = await getApprovalDetail(params.approvalId);
        return successResponse<ApprovalRequestDetailResponse['data']>(detail);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to approvals.');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        if (isAppError(error, 'NOT_FOUND')) return errorResponse(404, 'NOT_FOUND', 'Approval request was not found.');
        throw error;
    }
}
