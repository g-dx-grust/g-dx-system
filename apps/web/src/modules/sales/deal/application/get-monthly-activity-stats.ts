import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getMonthlyActivityStats as repoGetStats } from '../infrastructure/activity-repository';

export async function getMonthlyActivityStats() {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.read');
    const now = new Date();
    return repoGetStats(session.activeBusinessScope, now.getFullYear(), now.getMonth() + 1);
}
