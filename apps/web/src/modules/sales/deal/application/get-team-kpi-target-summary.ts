/**
 * Caching policy: Redis (cross-process). unstable_cache removed to avoid double-caching.
 * Key: gdx:dashboard:team-kpi-target:{scope}:{month}
 */

import type { BusinessScopeType } from '@g-dx/contracts';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { withRedisCache } from '@/shared/server/redis-cache';
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

export function getTeamKpiTargetSummaryCacheKey(
    businessScope: BusinessScopeType,
    targetMonth: string,
): string {
    return `gdx:dashboard:team-kpi-target:${businessScope}:${targetMonth}`;
}

export type { TeamKpiTargetSummary };

export async function getTeamKpiTargetSummary(
    targetMonth?: string,
    overrideScope?: BusinessScopeType,
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

    const month = targetMonth ?? getCurrentMonth();
    const scope = overrideScope ?? session.activeBusinessScope;
    const key = getTeamKpiTargetSummaryCacheKey(scope, month);

    return withRedisCache(
        key,
        DASHBOARD_DATA_REVALIDATE_SECONDS,
        () => getTeamKpiTargetSummaryByScope(scope, month),
    );
}
