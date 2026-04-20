import { db } from '@g-dx/database';
import { dealActivities, meetings, users } from '@g-dx/database/schema';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import type {
    BusinessScopeType,
    DealActivityItem,
    DealActivityType,
    MeetingTargetType,
    NegotiationOutcome,
    VisitCategory,
} from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { AppError } from '@/shared/server/errors';
import { sendGroupMessage, buildActivityMessage } from '@/lib/lark/larkMessaging';
import { createCalendarEvent, buildNextActionCalendarParams } from '@/lib/lark/larkCalendar';
import { getDealLarkContext } from './deal-repository';

function isMeetingActivityType(activityType: DealActivityType): boolean {
    return activityType === 'VISIT' || activityType === 'ONLINE';
}

function normalizeMeetingMetadata(input: {
    activityType: DealActivityType;
    visitCategory?: VisitCategory;
    targetType?: MeetingTargetType;
    meetingCount?: number;
}): { visitCategory: VisitCategory | null; targetType: MeetingTargetType | null; meetingCount: number } {
    if (!isMeetingActivityType(input.activityType)) {
        return { visitCategory: null, targetType: null, meetingCount: 0 };
    }

    return {
        visitCategory: input.visitCategory ?? 'REPEAT',
        targetType: input.targetType ?? 'CORPORATE',
        meetingCount: Math.max(1, input.meetingCount ?? 1),
    };
}

function normalizeNegotiationMetadata(input: {
    isNegotiation?: boolean;
    negotiationOutcome?: NegotiationOutcome;
    competitorInfo?: string;
}): {
    isNegotiation: boolean;
    negotiationOutcome: NegotiationOutcome | null;
    competitorInfo: string | null;
} {
    if (!input.isNegotiation) {
        return {
            isNegotiation: false,
            negotiationOutcome: null,
            competitorInfo: null,
        };
    }

    return {
        isNegotiation: true,
        negotiationOutcome: input.negotiationOutcome ?? 'MEDIUM',
        competitorInfo: input.competitorInfo ?? null,
    };
}

export async function listDealActivities(dealId: string): Promise<DealActivityItem[]> {
    const rows = await db
        .select({
            id: dealActivities.id, dealId: dealActivities.dealId,
            userId: dealActivities.userId, userName: users.displayName,
            activityType: dealActivities.activityType, activityDate: dealActivities.activityDate,
            summary: dealActivities.summary, meetingCount: dealActivities.meetingCount,
            visitCategory: dealActivities.visitCategory, targetType: dealActivities.targetType,
            isNegotiation: dealActivities.isNegotiation,
            negotiationOutcome: dealActivities.negotiationOutcome,
            competitorInfo: dealActivities.competitorInfo,
            larkMeetingUrl: dealActivities.larkMeetingUrl,
            isKmContact: dealActivities.isKmContact,
            createdAt: dealActivities.createdAt,
        })
        .from(dealActivities)
        .innerJoin(users, eq(dealActivities.userId, users.id))
        .where(eq(dealActivities.dealId, dealId))
        .orderBy(desc(dealActivities.activityDate), desc(dealActivities.createdAt));

    return rows.map((r) => ({
        id: r.id, dealId: r.dealId, userId: r.userId, userName: r.userName ?? 'Unknown',
        activityType: r.activityType as DealActivityType, activityDate: r.activityDate ?? '',
        summary: r.summary, meetingCount: r.meetingCount ?? 0,
        visitCategory: (r.visitCategory as VisitCategory | null) ?? null,
        targetType: (r.targetType as MeetingTargetType | null) ?? null,
        isNegotiation: r.isNegotiation ?? false,
        negotiationOutcome: (r.negotiationOutcome as NegotiationOutcome | null) ?? null,
        competitorInfo: r.competitorInfo ?? null,
        larkMeetingUrl: r.larkMeetingUrl ?? null,
        isKmContact: r.isKmContact ?? false,
        createdAt: r.createdAt.toISOString(),
    }));
}

export async function createDealActivity(input: {
    dealId: string; businessScope: BusinessScopeType;
    userId: string;
    activityType: DealActivityType;
    activityDate: string;
    summary?: string;
    meetingCount?: number;
    visitCategory?: VisitCategory;
    targetType?: MeetingTargetType;
    isNegotiation?: boolean;
    negotiationOutcome?: NegotiationOutcome;
    competitorInfo?: string;
    larkMeetingUrl?: string;
    isKmContact?: boolean;
}): Promise<void> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    const meetingMetadata = normalizeMeetingMetadata(input);
    const negotiationMetadata = normalizeNegotiationMetadata(input);

    // Get user name and deal context before insert
    const [actorRow] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, input.userId)).limit(1);
    const actorName = actorRow?.name ?? 'Unknown';

    await db.insert(dealActivities).values({
        id: crypto.randomUUID(), dealId: input.dealId, businessUnitId: businessUnit.id,
        userId: input.userId, activityType: input.activityType, activityDate: input.activityDate,
        summary: input.summary ?? null,
        meetingCount: meetingMetadata.meetingCount,
        visitCategory: meetingMetadata.visitCategory,
        targetType: meetingMetadata.targetType,
        isNegotiation: negotiationMetadata.isNegotiation,
        negotiationOutcome: negotiationMetadata.negotiationOutcome,
        competitorInfo: negotiationMetadata.competitorInfo,
        larkMeetingUrl: input.larkMeetingUrl ?? null,
        isKmContact: input.isKmContact ?? false,
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

export async function updateDealActivity(input: {
    activityId: string;
    dealId: string;
    actorUserId: string;
    activityType?: DealActivityType;
    activityDate?: string;
    summary?: string | null;
    meetingCount?: number;
    visitCategory?: VisitCategory | null;
    targetType?: MeetingTargetType | null;
    isNegotiation?: boolean;
    negotiationOutcome?: NegotiationOutcome | null;
    competitorInfo?: string | null;
    larkMeetingUrl?: string | null;
    isKmContact?: boolean;
}): Promise<void> {
    // Verify the activity belongs to the given deal
    const [existing] = await db
        .select({ id: dealActivities.id })
        .from(dealActivities)
        .where(and(eq(dealActivities.id, input.activityId), eq(dealActivities.dealId, input.dealId)))
        .limit(1);

    if (!existing) throw new AppError('NOT_FOUND', 'Deal activity not found.');

    await db
        .update(dealActivities)
        .set({
            ...(input.activityType !== undefined && { activityType: input.activityType }),
            ...(input.activityDate !== undefined && { activityDate: input.activityDate }),
            ...(input.summary !== undefined && { summary: input.summary }),
            ...(input.meetingCount !== undefined && { meetingCount: input.meetingCount }),
            ...(input.visitCategory !== undefined && { visitCategory: input.visitCategory }),
            ...(input.targetType !== undefined && { targetType: input.targetType }),
            ...(input.isNegotiation !== undefined && { isNegotiation: input.isNegotiation }),
            ...(input.negotiationOutcome !== undefined && { negotiationOutcome: input.negotiationOutcome }),
            ...(input.competitorInfo !== undefined && { competitorInfo: input.competitorInfo }),
            ...(input.larkMeetingUrl !== undefined && { larkMeetingUrl: input.larkMeetingUrl }),
            ...(input.isKmContact !== undefined && { isKmContact: input.isKmContact }),
            updatedAt: new Date(),
        })
        .where(and(eq(dealActivities.id, input.activityId), eq(dealActivities.dealId, input.dealId)));
}

export interface MonthlyActivityStat {
    userId: string;
    userName: string;
    visitCount: number;
    onlineCount: number;
    totalCount: number;
    meetingVisitCount: number;
    meetingOnlineCount: number;
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
            // GREATEST(meeting_count, 1) で 0 やデフォルト値が混在する旧データも正しくカウント
            meetingSum: sql<number>`sum(GREATEST(${dealActivities.meetingCount}, 1))::int`,
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
        const entry = userMap.get(row.userId) ?? { userId: row.userId, userName: row.userName ?? 'Unknown', visitCount: 0, onlineCount: 0, totalCount: 0, meetingVisitCount: 0, meetingOnlineCount: 0 };
        if (row.activityType === 'VISIT') {
            entry.visitCount += row.meetingSum;
            entry.totalCount += row.meetingSum;
        } else if (row.activityType === 'ONLINE') {
            entry.onlineCount += row.meetingSum;
            entry.totalCount += row.meetingSum;
        } else {
            entry.totalCount += row.count;
        }
        userMap.set(row.userId, entry);
    }

    // meetings テーブルの面談（VISIT/ONLINE）を合算
    const meetingRows = await db
        .select({
            userId: meetings.ownerUserId,
            userName: users.displayName,
            activityType: meetings.activityType,
            count: sql<number>`count(*)::int`,
        })
        .from(meetings)
        .innerJoin(users, eq(meetings.ownerUserId, users.id))
        .where(and(
            eq(meetings.businessUnitId, businessUnit.id),
            isNull(meetings.deletedAt),
            gte(meetings.meetingDate, new Date(startDate + 'T00:00:00Z')),
            lte(meetings.meetingDate, new Date(endDate + 'T23:59:59Z')),
        ))
        .groupBy(meetings.ownerUserId, users.displayName, meetings.activityType);

    for (const row of meetingRows) {
        const cnt = row.count;
        const entry = userMap.get(row.userId) ?? { userId: row.userId, userName: row.userName ?? 'Unknown', visitCount: 0, onlineCount: 0, totalCount: 0, meetingVisitCount: 0, meetingOnlineCount: 0 };
        if (row.activityType === 'VISIT') {
            entry.visitCount += cnt;
            entry.totalCount += cnt;
            entry.meetingVisitCount += cnt;
        } else if (row.activityType === 'ONLINE') {
            entry.onlineCount += cnt;
            entry.totalCount += cnt;
            entry.meetingOnlineCount += cnt;
        } else {
            entry.totalCount += cnt;
        }
        userMap.set(row.userId, entry);
    }

    return Array.from(userMap.values()).sort((a, b) => b.totalCount - a.totalCount);
}
