import type { CallResult } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { recordCall as repo } from '../infrastructure/call-repository';
export async function recordCall(input: { callTargetId?: string; companyId: string; contactId?: string; result: CallResult; notes?: string; nextCallDatetime?: string }) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'call.log.create');
    return repo(session.activeBusinessScope, { ...input, actorUserId: session.user.id });
}
