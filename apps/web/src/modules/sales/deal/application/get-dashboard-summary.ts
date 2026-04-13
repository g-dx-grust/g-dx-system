/**
 * Caching policy for getDashboardSummary:
 *   - Uses Redis (cross-process) as the single cache layer.
 *   - next/cache unstable_cache is intentionally NOT used here to avoid
 *     double-caching (one in Redis, one per Next.js process).
 *   - Other functions that still use unstable_cache are unaffected until
 *     each is individually migrated and validated.
 *
 * Cache key: gdx:dashboard:summary:{businessScope}
 *   businessScope is sufficient; this is team-level data with no per-user variation.
 */

import type { BusinessScopeType } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { withRedisCache } from '@/shared/server/redis-cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getDashboardSummaryOptimized } from '../infrastructure/deal-repository';

export function getDashboardSummaryCacheKey(businessScope: BusinessScopeType): string {
    return `gdx:dashboard:summary:${businessScope}`;
}

export async function getDashboardSummary(overrideScope?: BusinessScopeType) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    const scope = overrideScope ?? session.activeBusinessScope;
    const key = getDashboardSummaryCacheKey(scope);
    return withRedisCache(
        key,
        DASHBOARD_DATA_REVALIDATE_SECONDS,
        () => getDashboardSummaryOptimized(scope),
    );
}
