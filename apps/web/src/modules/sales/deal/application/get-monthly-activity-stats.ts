import { unstable_cache } from 'next/cache';
import type { BusinessScopeType } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getMonthlyActivityStats as repoGetStats } from '../infrastructure/activity-repository';

const getMonthlyActivityStatsCached = unstable_cache(
    async (businessScope: BusinessScopeType, year: number, month: number) =>
        repoGetStats(businessScope, year, month),
    ['dashboard-monthly-activity-stats'],
    { revalidate: DASHBOARD_DATA_REVALIDATE_SECONDS },
);

export async function getMonthlyActivityStats() {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    const now = new Date();

    return getMonthlyActivityStatsCached(
        session.activeBusinessScope,
        now.getFullYear(),
        now.getMonth() + 1,
    );
}
