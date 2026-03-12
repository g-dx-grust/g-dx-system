import type { CallHistoryFilters } from '../infrastructure/call-repository';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listCallHistory as repo } from '../infrastructure/call-repository';
export async function listCallHistory(filters: CallHistoryFilters = {}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'call.log.read');
    return repo(session.activeBusinessScope, filters);
}
