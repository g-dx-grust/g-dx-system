/**
 * Caching policy: Redis (cross-process). unstable_cache removed to avoid double-caching.
 * Key (per-user):  gdx:dashboard:alerts:{scope}:user:{userId}
 * Key (team/admin): gdx:dashboard:alerts:{scope}:team
 */

import type { BusinessScopeType, DashboardAlert } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { withRedisCache } from '@/shared/server/redis-cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getDashboardAlerts as getDashboardAlertsByScope } from '../infrastructure/deal-repository';

export function getDashboardAlertsCacheKey(
    businessScope: BusinessScopeType,
    ownerUserId: string | null,
): string {
    const suffix = ownerUserId === null ? 'team' : `user:${ownerUserId}`;
    return `gdx:dashboard:alerts:${businessScope}:${suffix}`;
}

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

    const ownerUserId = includeTeam ? null : session.user.id;
    const key = getDashboardAlertsCacheKey(session.activeBusinessScope, ownerUserId);

    return withRedisCache(
        key,
        DASHBOARD_DATA_REVALIDATE_SECONDS,
        () => getDashboardAlertsByScope(session.activeBusinessScope, {
            ownerUserId: ownerUserId ?? undefined,
            includeTeam,
        }),
    );
}
