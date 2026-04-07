import { unstable_cache } from 'next/cache';
import type { BusinessScopeType, DashboardAlert } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getDashboardAlerts as getDashboardAlertsByScope } from '../infrastructure/deal-repository';

const getDashboardAlertsCached = unstable_cache(
    async (
        businessScope: BusinessScopeType,
        ownerUserId: string | null,
        includeTeam: boolean,
    ): Promise<DashboardAlert[]> =>
        getDashboardAlertsByScope(businessScope, {
            ownerUserId: ownerUserId ?? undefined,
            includeTeam,
        }),
    ['dashboard-alerts'],
    { revalidate: DASHBOARD_DATA_REVALIDATE_SECONDS },
);

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    const includeTeam = session.user.roles.some(
        (role) =>
            role === 'SUPER_ADMIN' ||
            role === 'ADMIN' ||
            role === 'MANAGER',
    );

    return getDashboardAlertsCached(
        session.activeBusinessScope,
        includeTeam ? null : session.user.id,
        includeTeam,
    );
}
