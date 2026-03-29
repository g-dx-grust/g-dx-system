import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getTeamRollingKpi } from '../infrastructure/rolling-kpi-repository';
import type { SalesRollingKpiGrid } from '@g-dx/contracts';

export type { SalesRollingKpiGrid };

export async function getRollingKpi(): Promise<SalesRollingKpiGrid> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.read');
    return getTeamRollingKpi(session.activeBusinessScope);
}
