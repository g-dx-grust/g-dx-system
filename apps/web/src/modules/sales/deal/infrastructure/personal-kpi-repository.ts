import { db } from '@g-dx/database';
import {
    dealActivities,
    dealStageHistory,
    deals,
    pipelineStages,
    pipelines,
    contracts,
    userKpiTargets,
    companies,
    callLogs,
} from '@g-dx/database/schema';
import { and, count, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import type { PersonalNextActionItem, SaveKpiTargetInput, UserKpiTarget } from '@g-dx/contracts';

function getMonthBounds(targetMonth: string): { startDate: string; endDate: string } {
    const [year, month] = targetMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
}

function getEndOfWindow(today: string): string {
    const [year, month, day] = today.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + 13));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export async function upsertKpiTarget(
    userId: string,
    businessUnitId: string,
    input: SaveKpiTargetInput,
): Promise<void> {
    await db
        .insert(userKpiTargets)
        .values({
            userId,
            businessUnitId,
            targetMonth: input.targetMonth,
            callTarget: input.callTarget,
            visitTarget: input.visitTarget,
            appointmentTarget: input.appointmentTarget,
            negotiationTarget: input.negotiationTarget,
            contractTarget: input.contractTarget,
            revenueTarget: String(input.revenueTarget),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: [userKpiTargets.userId, userKpiTargets.businessUnitId, userKpiTargets.targetMonth],
            set: {
                callTarget: input.callTarget,
                visitTarget: input.visitTarget,
                appointmentTarget: input.appointmentTarget,
                negotiationTarget: input.negotiationTarget,
                contractTarget: input.contractTarget,
                revenueTarget: String(input.revenueTarget),
                updatedAt: new Date(),
            },
        });
}

export async function getKpiTargetRow(
    userId: string,
    businessUnitId: string,
    targetMonth: string,
): Promise<UserKpiTarget | null> {
    const [row] = await db
        .select()
        .from(userKpiTargets)
        .where(
            and(
                eq(userKpiTargets.userId, userId),
                eq(userKpiTargets.businessUnitId, businessUnitId),
                eq(userKpiTargets.targetMonth, targetMonth),
            ),
        )
        .limit(1);

    if (!row) return null;
    return {
        userId: row.userId,
        businessUnitId: row.businessUnitId,
        targetMonth: row.targetMonth,
        callTarget: row.callTarget,
        visitTarget: row.visitTarget,
        appointmentTarget: row.appointmentTarget,
        negotiationTarget: row.negotiationTarget,
        contractTarget: row.contractTarget,
        revenueTarget: parseFloat(row.revenueTarget ?? '0'),
    };
}

interface PersonalActuals {
    callCount: number;
    visitCount: number;
    appointmentCount: number;
    negotiationCount: number;
    contractCount: number;
    revenueTotal: number;
}

export async function getPersonalActuals(
    userId: string,
    businessUnitId: string,
    targetMonth: string,
): Promise<PersonalActuals> {
    const { startDate, endDate } = getMonthBounds(targetMonth);

    const [activityCounts, callLogCount, negoStages, contractedStages, revenueResult] = await Promise.all([
        // 1. コール数・訪問数（dealActivities から ＝ 手動ログ）
        db
            .select({
                activityType: dealActivities.activityType,
                cnt: sql<number>`count(*)::int`,
            })
            .from(dealActivities)
            .where(
                and(
                    eq(dealActivities.userId, userId),
                    eq(dealActivities.businessUnitId, businessUnitId),
                    gte(dealActivities.activityDate, startDate),
                    lte(dealActivities.activityDate, endDate),
                ),
            )
            .groupBy(dealActivities.activityType),

        // 2. コールシステム経由の架電数（callLogs から）
        db
            .select({ cnt: sql<number>`count(*)::int` })
            .from(callLogs)
            .where(
                and(
                    eq(callLogs.userId, userId),
                    eq(callLogs.businessUnitId, businessUnitId),
                    gte(callLogs.startedAt, new Date(`${startDate}T00:00:00Z`)),
                    lte(callLogs.startedAt, new Date(`${endDate}T23:59:59Z`)),
                ),
            ),

        // 3. NEGOTIATING ステージID取得
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(
                and(
                    eq(pipelines.businessUnitId, businessUnitId),
                    eq(pipelineStages.stageKey, 'NEGOTIATING'),
                ),
            ),

        // 4. CONTRACTED ステージID取得
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(
                and(
                    eq(pipelines.businessUnitId, businessUnitId),
                    eq(pipelineStages.stageKey, 'CONTRACTED'),
                ),
            ),

        // 5. 売上実績（contracts から）
        db
            .select({ total: sql<string>`COALESCE(SUM(${contracts.amount}), 0)` })
            .from(contracts)
            .where(
                and(
                    eq(contracts.ownerUserId, userId),
                    eq(contracts.businessUnitId, businessUnitId),
                    gte(contracts.contractDate, startDate),
                    lte(contracts.contractDate, endDate),
                    isNull(contracts.deletedAt),
                ),
            ),
    ]);

    // 活動カウント集計（手動ログ）
    let activityCallCount = 0;
    let visitCount = 0;
    for (const row of activityCounts) {
        if (row.activityType === 'CALL') activityCallCount = row.cnt;
        else if (row.activityType === 'VISIT') visitCount = row.cnt;
    }
    // コールシステム経由の架電数を加算（二重カウントなし: 別入力経路）
    const callCount = activityCallCount + (callLogCount[0]?.cnt ?? 0);

    // アポイント数 = 期間内に自分が担当で作成された案件数（APO_ACQUIREDステージ）
    const apoStages = await db
        .select({ id: pipelineStages.id })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(
            and(
                eq(pipelines.businessUnitId, businessUnitId),
                eq(pipelineStages.stageKey, 'APO_ACQUIRED'),
            ),
        );

    let appointmentCount = 0;
    if (apoStages.length > 0) {
        const [result] = await db
            .select({ cnt: count() })
            .from(deals)
            .where(
                and(
                    eq(deals.ownerUserId, userId),
                    eq(deals.businessUnitId, businessUnitId),
                    isNull(deals.deletedAt),
                    gte(deals.createdAt, new Date(`${startDate}T00:00:00Z`)),
                    lte(deals.createdAt, new Date(`${endDate}T23:59:59Z`)),
                ),
            );
        appointmentCount = Number(result?.cnt ?? 0);
    }

    // 商談化数 = NEGOTIATING ステージへ遷移した案件数（自分担当）
    let negotiationCount = 0;
    for (const stage of negoStages) {
        const [result] = await db
            .select({ cnt: count() })
            .from(dealStageHistory)
            .innerJoin(deals, eq(dealStageHistory.dealId, deals.id))
            .where(
                and(
                    eq(dealStageHistory.toStageId, stage.id),
                    eq(deals.ownerUserId, userId),
                    gte(dealStageHistory.changedAt, new Date(`${startDate}T00:00:00Z`)),
                    lte(dealStageHistory.changedAt, new Date(`${endDate}T23:59:59Z`)),
                ),
            );
        negotiationCount += Number(result?.cnt ?? 0);
    }

    // 契約数 = CONTRACTED ステージへ遷移した案件数（自分担当）
    let contractCount = 0;
    for (const stage of contractedStages) {
        const [result] = await db
            .select({ cnt: count() })
            .from(dealStageHistory)
            .innerJoin(deals, eq(dealStageHistory.dealId, deals.id))
            .where(
                and(
                    eq(dealStageHistory.toStageId, stage.id),
                    eq(deals.ownerUserId, userId),
                    gte(dealStageHistory.changedAt, new Date(`${startDate}T00:00:00Z`)),
                    lte(dealStageHistory.changedAt, new Date(`${endDate}T23:59:59Z`)),
                ),
            );
        contractCount += Number(result?.cnt ?? 0);
    }

    const revenueTotal = parseFloat(revenueResult[0]?.total ?? '0');

    return { callCount, visitCount, appointmentCount, negotiationCount, contractCount, revenueTotal };
}

export async function getPersonalNextActions(
    userId: string,
    businessUnitId: string,
    today: string,
): Promise<PersonalNextActionItem[]> {
    const endOfWindow = getEndOfWindow(today);

    const rows = await db
        .select({
            dealId: deals.id,
            dealName: deals.title,
            companyName: companies.displayName,
            stageKey: pipelineStages.stageKey,
            stageName: pipelineStages.name,
            amount: deals.amount,
            nextActionDate: deals.nextActionDate,
            nextActionContent: deals.nextActionContent,
        })
        .from(deals)
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
        .where(
            and(
                eq(deals.ownerUserId, userId),
                eq(deals.businessUnitId, businessUnitId),
                isNull(deals.deletedAt),
                sql`${deals.nextActionDate} IS NOT NULL`,
                lte(deals.nextActionDate, endOfWindow),
            ),
        )
        .orderBy(deals.nextActionDate);

    return rows
        .filter((row) => row.nextActionDate !== null)
        .map((row) => {
            const date = row.nextActionDate!;
            let urgency: PersonalNextActionItem['urgency'];
            if (date < today) urgency = 'OVERDUE';
            else if (date === today) urgency = 'TODAY';
            else urgency = 'THIS_WEEK';

            return {
                dealId: row.dealId,
                dealName: row.dealName,
                companyName: row.companyName,
                stageKey: row.stageKey,
                stageName: row.stageName,
                amount: row.amount !== null ? parseFloat(row.amount) : null,
                nextActionDate: date,
                nextActionContent: row.nextActionContent,
                urgency,
            };
        });
}
