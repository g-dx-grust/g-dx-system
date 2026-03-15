import { db } from '@g-dx/database';
import { dealActivities, users } from '@g-dx/database/schema';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { BusinessScopeType, DealActivityItem, DealActivityType } from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { AppError } from '@/shared/server/errors';
import { sendGroupMessage, buildActivityMessage } from '@/lib/lark/larkMessaging';
import { createCalendarEvent, buildNextActionCalendarParams } from '@/lib/lark/larkCalendar';
import { getDealLarkContext } from './deal-repository';

export async function listDealActivities(dealId: string): Promise<DealActivityItem[]> {
    const rows = await db
        .select({
            id: dealActivities.id, dealId: dealActivities.dealId,
            userId: dealActivities.userId, userName: users.displayName,
            activityType: dealActivities.activityType, activityDate: dealActivities.activityDate,
            summary: dealActivities.summary, createdAt: dealActivities.createdAt,
        })
        .from(dealActivities)
        .innerJoin(users, eq(dealActivities.userId, users.id))
        .where(eq(dealActivities.dealId, dealId))
        .orderBy(desc(dealActivities.activityDate));

    return rows.map((r) => ({
        id: r.id, dealId: r.dealId, userId: r.userId, userName: r.userName ?? 'Unknown',
        activityType: r.activityType as DealActivityType, activityDate: r.activityDate ?? '',
        summary: r.summary, createdAt: r.createdAt.toISOString(),
    }));
}

export async function createDealActivity(input: {
    dealId: string; businessScope: BusinessScopeType;
    userId: string; activityType: DealActivityType; activityDate: string; summary?: string;
}): Promise<void> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    // Get user name and deal context before insert
    const [actorRow] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, input.userId)).limit(1);
    const actorName = actorRow?.name ?? 'Unknown';

    await db.insert(dealActivities).values({
        id: crypto.randomUUID(), dealId: input.dealId, businessUnitId: businessUnit.id,
        userId: input.userId, activityType: input.activityType, activityDate: input.activityDate,
        summary: input.summary ?? null,
    });

    // Lark通知＋カレンダー: 活動ログ記録 (fire-and-forget)
    getDealLarkContext(input.dealId).then(async (dealCtx) => {
        if (!dealCtx) return;

        // 通知送信
        if (dealCtx.larkChatId) {
            const message = buildActivityMessage({
                dealName: dealCtx.title,
                activityType: input.activityType,
                activityDate: input.activityDate,
                content: input.summary ?? null,
                assigneeName: actorName,
            });
            await sendGroupMessage(dealCtx.larkChatId, message).catch((err) =>
                console.error('[Lark] activity notification failed:', err)
            );
        }

        // カレンダー登録: 活動種別が「訪問」で次回アクション日/内容が設定されている場合
        if (input.activityType === 'VISIT' && dealCtx.nextActionDate && dealCtx.nextActionContent) {
            const calendarId = dealCtx.larkCalendarId ?? 'primary';
            const params = buildNextActionCalendarParams({
                calendarId,
                companyName: dealCtx.companyName,
                dealName: dealCtx.title,
                nextActionContent: dealCtx.nextActionContent,
                nextActionDate: dealCtx.nextActionDate,
                assigneeName: actorName,
            });
            await createCalendarEvent(params).catch((err) =>
                console.error('[Lark] calendar event (VISIT activity) failed:', err)
            );
        }
    }).catch((err) => console.error('[Lark] getDealLarkContext failed:', err));
}

export interface MonthlyActivityStat {
    userId: string;
    userName: string;
    visitCount: number;
    onlineCount: number;
    totalCount: number;
}

export async function getMonthlyActivityStats(businessScope: BusinessScopeType, year: number, month: number): Promise<MonthlyActivityStat[]> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) return [];

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const rows = await db
        .select({
            userId: dealActivities.userId, userName: users.displayName,
            activityType: dealActivities.activityType,
            count: sql<number>`count(*)::int`,
        })
        .from(dealActivities)
        .innerJoin(users, eq(dealActivities.userId, users.id))
        .where(and(
            eq(dealActivities.businessUnitId, businessUnit.id),
            gte(dealActivities.activityDate, startDate),
            lte(dealActivities.activityDate, endDate),
        ))
        .groupBy(dealActivities.userId, users.displayName, dealActivities.activityType);

    const userMap = new Map<string, MonthlyActivityStat>();
    for (const row of rows) {
        const entry = userMap.get(row.userId) ?? { userId: row.userId, userName: row.userName ?? 'Unknown', visitCount: 0, onlineCount: 0, totalCount: 0 };
        if (row.activityType === 'VISIT') entry.visitCount += row.count;
        else if (row.activityType === 'ONLINE') entry.onlineCount += row.count;
        entry.totalCount += row.count;
        userMap.set(row.userId, entry);
    }
    return Array.from(userMap.values()).sort((a, b) => b.totalCount - a.totalCount);
}
