import { unstable_cache } from 'next/cache';
import type { BusinessScopeType } from '@g-dx/contracts';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';
import {
    getTeamKpiTargetSummaryByScope,
    type TeamKpiTargetSummary,
} from '../infrastructure/team-kpi-target-repository';

function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const getTeamKpiTargetSummaryCached = unstable_cache(
    async (businessScope: BusinessScopeType, targetMonth: string) =>
        getTeamKpiTargetSummaryByScope(businessScope, targetMonth),
    ['dashboard-team-kpi-target-summary'],
    { revalidate: DASHBOARD_DATA_REVALIDATE_SECONDS },
);

export type { TeamKpiTargetSummary };

export async function getTeamKpiTargetSummary(
    targetMonth?: string,
): Promise<TeamKpiTargetSummary> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    if (
        !permissions.has('sales.deal.read') &&
        !permissions.has('dashboard.kpi.read')
    ) {
        throw new AppError('FORBIDDEN');
    }

    return getTeamKpiTargetSummaryCached(
        session.activeBusinessScope,
        targetMonth ?? getCurrentMonth(),
    );
}
