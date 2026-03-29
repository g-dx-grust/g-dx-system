import type { DecideApprovalRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { decideApprovalRequest } from '../infrastructure/approval-repository';

export async function decideApproval(
    approvalId: string,
    input: DecideApprovalRequest,
): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'approval.decide');

    return decideApprovalRequest(
        approvalId,
        session.activeBusinessScope,
        session.user.id,
        input,
    );
}
