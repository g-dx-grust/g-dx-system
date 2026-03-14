import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listCallHistoryByCompany as repo } from '../infrastructure/call-repository';

export async function listCallHistoryByCompany(companyId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'call.log.read');
    return repo(session.activeBusinessScope, companyId);
}
