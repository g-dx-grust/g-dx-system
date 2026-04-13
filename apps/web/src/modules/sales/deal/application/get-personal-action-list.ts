/**
 * Caching policy: Redis (cross-process). unstable_cache removed to avoid double-caching.
 * Key: gdx:dashboard:action-list:{scope}:{userId}:{today}
 */

import type { BusinessScopeType, PersonalNextActionItem } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { withRedisCache } from '@/shared/server/redis-cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getTokyoTodayStr } from '@/shared/server/date-jst';
import { getPersonalNextActions } from '../infrastructure/personal-kpi-repository';

export function getPersonalActionListCacheKey(
    businessScope: BusinessScopeType,
    userId: string,
    today: string,
): string {
    return `gdx:dashboard:action-list:${businessScope}:${userId}:${today}`;
}

export async function getPersonalActionList(options?: {
    userId?: string;
    scope?: BusinessScopeType;
}): Promise<PersonalNextActionItem[]> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    const today = getTokyoTodayStr();
    const targetUserId = options?.userId ?? session.user.id;
    const scope = options?.scope ?? session.activeBusinessScope;
    const key = getPersonalActionListCacheKey(scope, targetUserId, today);

    return withRedisCache(key, DASHBOARD_DATA_REVALIDATE_SECONDS, async () => {
        const businessUnit = await findBusinessUnitByScope(scope);
        if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
        return getPersonalNextActions(targetUserId, businessUnit.id, today);
    });
}
