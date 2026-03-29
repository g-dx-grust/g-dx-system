import { unstable_cache } from 'next/cache';
import type { BusinessScopeType, SalesRollingKpiGrid } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getTeamRollingKpi } from '../infrastructure/rolling-kpi-repository';

export type { SalesRollingKpiGrid };

const getRollingKpiCached = unstable_cache(
    async (businessScope: BusinessScopeType) => getTeamRollingKpi(businessScope),
    ['dashboard-rolling-kpi'],
    { revalidate: DASHBOARD_DATA_REVALIDATE_SECONDS },
);

export async function getRollingKpi(): Promise<SalesRollingKpiGrid> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return getRollingKpiCached(session.activeBusinessScope);
}
