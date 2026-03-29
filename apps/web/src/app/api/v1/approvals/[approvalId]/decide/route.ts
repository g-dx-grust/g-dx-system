import type { DecideApprovalRequest } from '@g-dx/contracts';
import { decideApproval } from '@/modules/approvals/application/decide-approval';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: { approvalId: string };
}

export async function POST(request: Request, { params }: RouteContext) {
    try {
        const body = (await request.json()) as DecideApprovalRequest;

        if (!body.decision || !['APPROVED', 'REJECTED', 'RETURNED'].includes(body.decision)) {
            return errorResponse(422, 'VALIDATION_ERROR', 'decision must be APPROVED, REJECTED, or RETURNED.', {
                fields: { decision: ['Must be one of: APPROVED, REJECTED, RETURNED.'] },
            });
        }

        await decideApproval(params.approvalId, body);
        return successResponse<{ ok: true }>({ ok: true });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have permission to decide approvals.');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        if (isAppError(error, 'NOT_FOUND')) return errorResponse(404, 'NOT_FOUND', 'Approval request was not found.');
        if (isAppError(error, 'SELF_APPROVAL_DENIED')) return errorResponse(403, 'SELF_APPROVAL_DENIED', 'Self-approval is not permitted.');
        if (isAppError(error, 'VALIDATION_ERROR')) return errorResponse(422, 'VALIDATION_ERROR', 'Only pending requests can be decided.');
        throw error;
    }
}
