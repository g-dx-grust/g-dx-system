import { unstable_cache } from 'next/cache';
import type { BusinessScopeType } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getDashboardSummaryOptimized } from '../infrastructure/deal-repository';

const getDashboardSummaryCached = unstable_cache(
    async (businessScope: BusinessScopeType) =>
        getDashboardSummaryOptimized(businessScope),
    ['dashboard-summary'],
    { revalidate: DASHBOARD_DATA_REVALIDATE_SECONDS },
);

export async function getDashboardSummary() {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return getDashboardSummaryCached(session.activeBusinessScope);
}
