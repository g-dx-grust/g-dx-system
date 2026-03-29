import type { ApprovalRequestListResponse, PaginationMeta } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listApprovalRequests } from '../infrastructure/approval-repository';

export async function listApprovals(filters: {
    page?: number;
    pageSize?: number;
    approvalType?: string;
    approvalStatus?: string;
    dealId?: string;
}): Promise<{ data: ApprovalRequestListResponse['data']; meta: PaginationMeta }> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'approval.request.read');

    return listApprovalRequests(session.activeBusinessScope, filters);
}
