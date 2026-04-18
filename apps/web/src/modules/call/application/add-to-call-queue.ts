import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { addToCallQueue as repoAdd, cancelCallTarget } from '../infrastructure/call-repository';
export async function addToCallQueue(input: { companyId: string; contactId?: string; phoneNumber: string; scheduledAt?: string; notes?: string }) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'call.task.create');
    return repoAdd(session.activeBusinessScope, { ...input, assignedUserId: session.user.id, actorUserId: session.user.id });
}
export async function removeFromCallQueue(targetId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'call.task.create');
    return cancelCallTarget(targetId);
}
