/**
 * Caching policy: Redis (cross-process). unstable_cache removed to avoid double-caching.
 * Key: gdx:notification:unread:{userId}
 */

import type { NotificationUnreadCountResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { HEADER_BADGE_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { withRedisCache } from '@/shared/server/redis-cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getUnreadCount } from '../infrastructure/notification-repository';

export function getNotificationUnreadCacheKey(userId: string): string {
    return `gdx:notification:unread:${userId}`;
}

export async function getNotificationUnreadCount(): Promise<NotificationUnreadCountResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'notification.read');

    const key = getNotificationUnreadCacheKey(session.user.id);
    const count = await withRedisCache(
        key,
        HEADER_BADGE_REVALIDATE_SECONDS,
        () => getUnreadCount(session.user.id),
    );
    return { count };
}
