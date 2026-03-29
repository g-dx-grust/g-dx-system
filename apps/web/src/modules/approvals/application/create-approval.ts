import type { CreateApprovalRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createApprovalRequest } from '../infrastructure/approval-repository';

export async function createApproval(input: CreateApprovalRequest): Promise<{ id: string }> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'approval.request.create');

    return createApprovalRequest(session.activeBusinessScope, session.user.id, input);
}
