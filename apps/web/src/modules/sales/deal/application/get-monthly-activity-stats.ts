/**
 * Caching policy: Redis (cross-process). unstable_cache removed to avoid double-caching.
 * Key: gdx:dashboard:monthly-activity:{scope}:{year}:{month}
 */

import type { BusinessScopeType } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { withRedisCache } from '@/shared/server/redis-cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getMonthlyActivityStats as repoGetStats } from '../infrastructure/activity-repository';

export function getMonthlyActivityStatsCacheKey(
    businessScope: BusinessScopeType,
    year: number,
    month: number,
): string {
    return `gdx:dashboard:monthly-activity:${businessScope}:${year}:${month}`;
}

export async function getMonthlyActivityStats(overrideScope?: BusinessScopeType) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const scope = overrideScope ?? session.activeBusinessScope;
    const key = getMonthlyActivityStatsCacheKey(scope, year, month);

    return withRedisCache(
        key,
        DASHBOARD_DATA_REVALIDATE_SECONDS,
        () => repoGetStats(scope, year, month),
    );
}
