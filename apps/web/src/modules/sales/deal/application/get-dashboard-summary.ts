import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getDashboardSummary as getDashboardSummaryFromRepository } from '../infrastructure/deal-repository';

export async function getDashboardSummary() {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return getDashboardSummaryFromRepository(session.activeBusinessScope);
}
