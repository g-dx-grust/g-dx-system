import type { ApprovalRequestDetailResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getApprovalRequestDetail } from '../infrastructure/approval-repository';

export async function getApprovalDetail(
    approvalId: string,
): Promise<ApprovalRequestDetailResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'approval.request.read');

    return getApprovalRequestDetail(approvalId, session.activeBusinessScope);
}
