import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getContractDashboardSummary } from '../infrastructure/contract-repository';

export async function getContractDashboard() {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.contract.read');
    return getContractDashboardSummary(session.activeBusinessScope);
}
