/**
 * Caching policy: Redis (cross-process). unstable_cache removed to avoid double-caching.
 * Key: gdx:dashboard:rolling-kpi:{scope}
 */

import type { BusinessScopeType, SalesRollingKpiGrid } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { withRedisCache } from '@/shared/server/redis-cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getTeamRollingKpi } from '../infrastructure/rolling-kpi-repository';

export type { SalesRollingKpiGrid };

export function getRollingKpiCacheKey(businessScope: BusinessScopeType): string {
    return `gdx:dashboard:rolling-kpi:${businessScope}`;
}

export async function getRollingKpi(overrideScope?: BusinessScopeType): Promise<SalesRollingKpiGrid> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    const scope = overrideScope ?? session.activeBusinessScope;
    const key = getRollingKpiCacheKey(scope);

    return withRedisCache(
        key,
        DASHBOARD_DATA_REVALIDATE_SECONDS,
        () => getTeamRollingKpi(scope),
    );
}
