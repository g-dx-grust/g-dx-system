import type { ApprovalRequestListResponse, CreateApprovalRequest } from '@g-dx/contracts';
import { listApprovals } from '@/modules/approvals/application/list-approvals';
import { createApproval } from '@/modules/approvals/application/create-approval';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page') ?? '1');
        const pageSize = Number(searchParams.get('pageSize') ?? '20');
        const approvalType = searchParams.get('approvalType') ?? undefined;
        const approvalStatus = searchParams.get('approvalStatus') ?? undefined;
        const dealId = searchParams.get('dealId') ?? undefined;

        const result = await listApprovals({
            page: Number.isFinite(page) ? page : 1,
            pageSize: Number.isFinite(pageSize) ? pageSize : 20,
            approvalType,
            approvalStatus,
            dealId,
        });

        return successResponse<ApprovalRequestListResponse['data'], ApprovalRequestListResponse['meta']>(
            result.data,
            result.meta,
        );
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to approvals.');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as CreateApprovalRequest;

        if (!body.dealId || !body.approvalType) {
            return errorResponse(422, 'VALIDATION_ERROR', 'dealId and approvalType are required.', {
                fields: {
                    ...(!body.dealId ? { dealId: ['dealId is required.'] } : {}),
                    ...(!body.approvalType ? { approvalType: ['approvalType is required.'] } : {}),
                },
            });
        }

        const created = await createApproval(body);
        return successResponse<{ id: string }>(created);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to create approvals.');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        if (isAppError(error, 'NOT_FOUND')) return errorResponse(404, 'NOT_FOUND', 'Deal was not found.');
        throw error;
    }
}
