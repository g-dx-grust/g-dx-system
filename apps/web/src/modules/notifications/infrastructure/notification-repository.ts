import { db } from '@g-dx/database';
import { notifications } from '@g-dx/database/schema';
import { and, count, desc, eq } from 'drizzle-orm';
import type { NotificationItem, NotificationTypeValue, PaginationMeta } from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';

function mapRow(row: typeof notifications.$inferSelect): NotificationItem {
    return {
        id: row.id,
        notificationType: row.notificationType as NotificationTypeValue,
        title: row.title,
        body: row.body,
        relatedEntityType: row.relatedEntityType,
        relatedEntityId: row.relatedEntityId,
        linkUrl: row.linkUrl,
        isRead: row.isRead,
        readAt: row.readAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
    };
}

export async function listNotifications(
    recipientUserId: string,
    filters: { page?: number; pageSize?: number; unreadOnly?: boolean },
): Promise<{ data: NotificationItem[]; meta: PaginationMeta }> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(notifications.recipientUserId, recipientUserId)];
    if (filters.unreadOnly) conditions.push(eq(notifications.isRead, false));

    const rows = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset(offset);

    const [{ total }] = await db
        .select({ total: count() })
        .from(notifications)
        .where(and(...conditions));

    return {
        data: rows.map(mapRow),
        meta: { page, pageSize, total: Number(total) },
    };
}

export async function getUnreadCount(recipientUserId: string): Promise<number> {
    const [{ total }] = await db
        .select({ total: count() })
        .from(notifications)
        .where(
            and(
                eq(notifications.recipientUserId, recipientUserId),
                eq(notifications.isRead, false),
            )
        );
    return Number(total);
}

export async function markNotificationRead(
    notificationId: string,
    recipientUserId: string,
): Promise<void> {
    const [existing] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
            and(
                eq(notifications.id, notificationId),
                eq(notifications.recipientUserId, recipientUserId),
            )
        )
        .limit(1);

    if (!existing) throw new AppError('NOT_FOUND', 'Notification was not found.');

    await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsRead(recipientUserId: string): Promise<void> {
    await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
            and(
                eq(notifications.recipientUserId, recipientUserId),
                eq(notifications.isRead, false),
            )
        );
}
