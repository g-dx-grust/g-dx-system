import { db } from '@g-dx/database';
import { dealActivities, users } from '@g-dx/database/schema';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { BusinessScopeType, DealActivityItem, DealActivityType } from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { AppError } from '@/shared/server/errors';

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
    await db.insert(dealActivities).values({
        id: crypto.randomUUID(), dealId: input.dealId, businessUnitId: businessUnit.id,
        userId: input.userId, activityType: input.activityType, activityDate: input.activityDate,
        summary: input.summary ?? null,
    });
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
