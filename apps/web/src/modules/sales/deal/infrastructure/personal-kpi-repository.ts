import { db } from '@g-dx/database';
import {
    dealActivities,
    dealStageHistory,
    deals,
    meetings,
    pipelineStages,
    pipelines,
    contracts,
    userKpiTargets,
    companies,
    callLogs,
} from '@g-dx/database/schema';
import { and, count, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import type {
    KpiSegmentedCounts,
    PersonalCompanyActionType,
    PersonalLastWeekCompanyActionGroup,
    PersonalLastWeekCompanyActionItem,
    PersonalNextActionItem,
    PersonalRollingKpiBlock,
    RollingKpiMetricKey,
    SaveKpiTargetInput,
    UserKpiTarget,
} from '@g-dx/contracts';
import { getRollingPeriodBounds, ALL_ROLLING_PERIODS, type RollingPeriodBounds } from './rolling-period';
import { hasSegmentTargetColumns, hasJetKpiColumns } from './kpi-target-columns';
import { listPersonalDealNextActionTasks } from '@/modules/tasks/infrastructure/deal-next-action-task-repository';
import { getTokyoWeekEndStr } from '@/shared/server/date-jst';

function getMonthBounds(targetMonth: string): { startDate: string; endDate: string } {
    const [year, month] = targetMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
}


export async function upsertKpiTarget(
    userId: string,
    businessUnitId: string,
    input: SaveKpiTargetInput,
): Promise<void> {
    const supportsSegmentTargets = await hasSegmentTargetColumns();
    const jetColumnsReady = await hasJetKpiColumns();
    const baseValues = {
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
    };
    const baseSet = {
        callTarget: input.callTarget,
        visitTarget: input.visitTarget,
        appointmentTarget: input.appointmentTarget,
        negotiationTarget: input.negotiationTarget,
        contractTarget: input.contractTarget,
        revenueTarget: String(input.revenueTarget),
        updatedAt: new Date(),
    };

    if (supportsSegmentTargets) {
        const segmentValues = {
            ...baseValues,
            newVisitTarget: input.newVisitTarget,
            newNegotiationTarget: input.newNegotiationTarget,
            ...(jetColumnsReady && {
                kmContactTarget: input.kmContactTarget,
                onlineTarget: input.onlineTarget,
            }),
        };
        const segmentSet = {
            ...baseSet,
            newVisitTarget: input.newVisitTarget,
            newNegotiationTarget: input.newNegotiationTarget,
            ...(jetColumnsReady && {
                kmContactTarget: input.kmContactTarget,
                onlineTarget: input.onlineTarget,
            }),
        };
        await db
            .insert(userKpiTargets)
            .values(segmentValues)
            .onConflictDoUpdate({
                target: [
                    userKpiTargets.userId,
                    userKpiTargets.businessUnitId,
                    userKpiTargets.targetMonth,
                ],
                set: segmentSet,
            });
        return;
    }

    await db
        .insert(userKpiTargets)
        .values(baseValues)
        .onConflictDoUpdate({
            target: [
                userKpiTargets.userId,
                userKpiTargets.businessUnitId,
                userKpiTargets.targetMonth,
            ],
            set: baseSet,
        });
}

export async function getKpiTargetRow(
    userId: string,
    businessUnitId: string,
    targetMonth: string,
): Promise<UserKpiTarget | null> {
    const whereClause = and(
        eq(userKpiTargets.userId, userId),
        eq(userKpiTargets.businessUnitId, businessUnitId),
        eq(userKpiTargets.targetMonth, targetMonth),
    );
    const supportsSegmentTargets = await hasSegmentTargetColumns();
    const jetColumnsReady = await hasJetKpiColumns();

    if (supportsSegmentTargets) {
        const [row] = await db
            .select({
                userId: userKpiTargets.userId,
                businessUnitId: userKpiTargets.businessUnitId,
                targetMonth: userKpiTargets.targetMonth,
                callTarget: userKpiTargets.callTarget,
                visitTarget: userKpiTargets.visitTarget,
                newVisitTarget: userKpiTargets.newVisitTarget,
                appointmentTarget: userKpiTargets.appointmentTarget,
                negotiationTarget: userKpiTargets.negotiationTarget,
                newNegotiationTarget: userKpiTargets.newNegotiationTarget,
                contractTarget: userKpiTargets.contractTarget,
                revenueTarget: userKpiTargets.revenueTarget,
                ...(jetColumnsReady && {
                    kmContactTarget: userKpiTargets.kmContactTarget,
                    onlineTarget: userKpiTargets.onlineTarget,
                }),
            })
            .from(userKpiTargets)
            .where(whereClause)
            .limit(1);

        if (!row) return null;
        return {
            userId: row.userId,
            businessUnitId: row.businessUnitId,
            targetMonth: row.targetMonth,
            callTarget: row.callTarget,
            visitTarget: row.visitTarget,
            newVisitTarget: row.newVisitTarget,
            appointmentTarget: row.appointmentTarget,
            negotiationTarget: row.negotiationTarget,
            newNegotiationTarget: row.newNegotiationTarget,
            contractTarget: row.contractTarget,
            revenueTarget: parseFloat(row.revenueTarget ?? '0'),
            kmContactTarget: jetColumnsReady ? (row.kmContactTarget ?? 0) : 0,
            onlineTarget: jetColumnsReady ? (row.onlineTarget ?? 0) : 0,
        };
    }

    const [row] = await db
        .select({
            userId: userKpiTargets.userId,
            businessUnitId: userKpiTargets.businessUnitId,
            targetMonth: userKpiTargets.targetMonth,
            callTarget: userKpiTargets.callTarget,
            visitTarget: userKpiTargets.visitTarget,
            appointmentTarget: userKpiTargets.appointmentTarget,
            negotiationTarget: userKpiTargets.negotiationTarget,
            contractTarget: userKpiTargets.contractTarget,
            revenueTarget: userKpiTargets.revenueTarget,
        })
        .from(userKpiTargets)
        .where(whereClause)
        .limit(1);

    if (!row) return null;
    return {
        userId: row.userId,
        businessUnitId: row.businessUnitId,
        targetMonth: row.targetMonth,
        callTarget: row.callTarget,
        visitTarget: row.visitTarget,
        newVisitTarget: row.visitTarget,
        appointmentTarget: row.appointmentTarget,
        negotiationTarget: row.negotiationTarget,
        newNegotiationTarget: row.negotiationTarget,
        contractTarget: row.contractTarget,
        revenueTarget: parseFloat(row.revenueTarget ?? '0'),
        kmContactTarget: 0,
        onlineTarget: 0,
    };
}

interface PersonalActuals {
    callCount: number;
    visitCount: number;
    kmContactCount: number;
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

    const jetColumnsExist = await hasJetKpiColumns();

    const [activityCounts, callLogCount, negoStages, contractedStages, apoStages, revenueResult, kmContactResult] = await Promise.all([
        // 1. コール数・訪問数（dealActivities から ＝ 手動ログ）
        db
            .select({
                activityType: dealActivities.activityType,
                cnt: sql<number>`count(*)::int`,
                meetingSum: sql<number>`sum(${dealActivities.meetingCount})::int`,
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

        // 5. APO_ACQUIRED ステージID取得
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(
                and(
                    eq(pipelines.businessUnitId, businessUnitId),
                    eq(pipelineStages.stageKey, 'APO_ACQUIRED'),
                ),
            ),

        // 6. 売上実績（contracts から）
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

        // 7. KM接触数（is_km_contact = true のアクティビティ）
        jetColumnsExist
            ? db
                .select({ cnt: sql<number>`count(*)::int` })
                .from(dealActivities)
                .where(
                    and(
                        eq(dealActivities.userId, userId),
                        eq(dealActivities.businessUnitId, businessUnitId),
                        gte(dealActivities.activityDate, startDate),
                        lte(dealActivities.activityDate, endDate),
                        eq(dealActivities.isKmContact, true),
                    ),
                )
            : Promise.resolve([{ cnt: 0 }]),
    ]);

    // 活動カウント集計（手動ログ）
    let activityCallCount = 0;
    let visitCount = 0;
    for (const row of activityCounts) {
        if (row.activityType === 'CALL') activityCallCount = row.cnt;
        else if (row.activityType === 'VISIT') visitCount = row.meetingSum ?? row.cnt;
    }
    // コールシステム経由の架電数を加算（二重カウントなし: 別入力経路）
    const callCount = activityCallCount + (callLogCount[0]?.cnt ?? 0);

    // meetings テーブルの面談（VISIT/ONLINE）を加算
    const meetingVisitCount = await db
        .select({ cnt: sql<number>`count(*)::int` })
        .from(meetings)
        .where(
            and(
                eq(meetings.ownerUserId, userId),
                eq(meetings.businessUnitId, businessUnitId),
                isNull(meetings.deletedAt),
                gte(meetings.meetingDate, new Date(startDate + 'T00:00:00Z')),
                lte(meetings.meetingDate, new Date(endDate + 'T23:59:59Z')),
                inArray(meetings.activityType, ['VISIT', 'ONLINE']),
            ),
        )
        .then(([r]) => Number(r?.cnt ?? 0));
    visitCount += meetingVisitCount;

    // アポイント数・商談化数・契約数を並列取得
    const [appointmentCount, negotiationCount, contractCount] = await Promise.all([
        // アポイント数 = 期間内に自分が担当で作成された案件数（APO_ACQUIREDステージ）
        apoStages.length === 0
            ? Promise.resolve(0)
            : db
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
                )
                .then(([r]) => Number(r?.cnt ?? 0)),

        // 商談化数 = NEGOTIATING ステージへ遷移した案件数（自分担当）
        Promise.all(
            negoStages.map((stage) =>
                db
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
                    )
                    .then(([r]) => Number(r?.cnt ?? 0)),
            ),
        ).then((counts) => counts.reduce((a, b) => a + b, 0)),

        // 契約数 = CONTRACTED ステージへ遷移した案件数（自分担当）
        Promise.all(
            contractedStages.map((stage) =>
                db
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
                    )
                    .then(([r]) => Number(r?.cnt ?? 0)),
            ),
        ).then((counts) => counts.reduce((a, b) => a + b, 0)),
    ]);

    const revenueTotal = parseFloat(revenueResult[0]?.total ?? '0');
    const kmContactCount = Number(kmContactResult[0]?.cnt ?? 0);

    return { callCount, visitCount, kmContactCount, appointmentCount, negotiationCount, contractCount, revenueTotal };
}

// ─── Rolling KPI（期間別実績 新規／既存分類付き）────────────────────────────

function emptySegmented(): KpiSegmentedCounts {
    return { total: 0, bySegment: { new: 0, existing: 0 } };
}

function emptyMetrics(): Record<RollingKpiMetricKey, KpiSegmentedCounts> {
    return {
        callCount: emptySegmented(),
        visitCount: emptySegmented(),
        onlineCount: emptySegmented(),
        newVisitCount: emptySegmented(),
        kmContactCount: emptySegmented(),
        appointmentCount: emptySegmented(),
        negotiationCount: emptySegmented(),
        contractCount: emptySegmented(),
    };
}

function buildUuidArraySql(values: string[]) {
    return sql`ARRAY[${sql.join(values.map((value) => sql`${value}`), sql`, `)}]::uuid[]`;
}

async function getPersonalPeriodMetrics(
    userId: string,
    businessUnitId: string,
    bounds: RollingPeriodBounds,
    negoStageIds: string[],
    contractStageIds: string[],
): Promise<Record<RollingKpiMetricKey, KpiSegmentedCounts>> {
    const { startDate, endDate } = bounds;
    const metrics = emptyMetrics();

    type SegRow = { segment: string; cnt: number };
    type ActivityRow = { activity_type: string; segment: string; cnt: number };
    type NewVisitRow = { activity_type: string; cnt: number };

    // 1. Activities from deal_activities (CALL, VISIT, ONLINE)
    //    Segment: at activity_date, were there other deals for the same company?
    //    For VISIT/ONLINE sum meeting_count (GREATEST で 0 旧データも補正); for others count records.
    const activityRows = await db.execute<ActivityRow>(sql`
        SELECT
            da.activity_type,
            CASE WHEN EXISTS (
                SELECT 1 FROM deals d2
                WHERE d2.company_id = d.company_id
                AND d2.business_unit_id = ${businessUnitId}
                AND d2.deleted_at IS NULL
                AND d2.id != da.deal_id
                AND d2.created_at::date < da.activity_date
            ) THEN 'existing' ELSE 'new' END AS segment,
            CASE WHEN da.activity_type IN ('VISIT', 'ONLINE')
                THEN SUM(GREATEST(da.meeting_count, 1))::int
                ELSE COUNT(*)::int
            END AS cnt
        FROM deal_activities da
        JOIN deals d ON da.deal_id = d.id
        WHERE da.user_id = ${userId}
        AND da.business_unit_id = ${businessUnitId}
        AND da.activity_date >= ${startDate}
        AND da.activity_date <= ${endDate}
        GROUP BY da.activity_type, 2
    `);

    const newVisitRows = await db.execute<NewVisitRow>(sql`
        SELECT
            da.activity_type,
            CASE
                WHEN da.activity_type IN ('VISIT', 'ONLINE')
                    THEN SUM(GREATEST(da.meeting_count, 1))::int
                ELSE COUNT(*)::int
            END AS cnt
        FROM deal_activities da
        WHERE da.user_id = ${userId}
        AND da.business_unit_id = ${businessUnitId}
        AND da.activity_type IN ('VISIT', 'ONLINE')
        AND da.visit_category = 'NEW'
        AND da.activity_date >= ${startDate}
        AND da.activity_date <= ${endDate}
        GROUP BY da.activity_type
    `);

    for (const row of activityRows.rows) {
        const seg = row.segment as 'new' | 'existing';
        const cnt = Number(row.cnt);
        if (row.activity_type === 'CALL') {
            metrics.callCount.total += cnt;
            metrics.callCount.bySegment[seg] += cnt;
        } else if (row.activity_type === 'VISIT') {
            metrics.visitCount.total += cnt;
            metrics.visitCount.bySegment[seg] += cnt;
        } else if (row.activity_type === 'ONLINE') {
            metrics.onlineCount.total += cnt;
            metrics.onlineCount.bySegment[seg] += cnt;
        }
    }

    for (const row of newVisitRows.rows) {
        const cnt = Number(row.cnt);
        metrics.newVisitCount.total += cnt;
        metrics.newVisitCount.bySegment.new += cnt;
    }

    // 1c. meetings テーブルの面談（VISIT/ONLINE）を合算
    // meetings には visit_category がないため一律「新規」扱いとする
    const personalMeetingRows = await db
        .select({
            activityType: meetings.activityType,
            cnt: sql<number>`count(*)::int`,
        })
        .from(meetings)
        .where(
            and(
                eq(meetings.ownerUserId, userId),
                eq(meetings.businessUnitId, businessUnitId),
                isNull(meetings.deletedAt),
                gte(meetings.meetingDate, new Date(startDate + 'T00:00:00Z')),
                lte(meetings.meetingDate, new Date(endDate + 'T23:59:59Z')),
            ),
        )
        .groupBy(meetings.activityType);

    for (const row of personalMeetingRows) {
        const cnt = Number(row.cnt);
        if (row.activityType === 'VISIT') {
            metrics.visitCount.total += cnt;
            metrics.visitCount.bySegment.new += cnt;
            metrics.newVisitCount.total += cnt;
            metrics.newVisitCount.bySegment.new += cnt;
        } else if (row.activityType === 'ONLINE') {
            metrics.onlineCount.total += cnt;
            metrics.onlineCount.bySegment.new += cnt;
        }
    }

    // 1b. KM接触数（is_km_contact = true のアクティビティ）
    const jetColumnsReady = await hasJetKpiColumns();
    if (jetColumnsReady) {
        const kmContactRows = await db.execute<{ segment: string; cnt: number }>(sql`
            SELECT
                CASE WHEN EXISTS (
                    SELECT 1 FROM deals d2
                    WHERE d2.company_id = d.company_id
                    AND d2.business_unit_id = ${businessUnitId}
                    AND d2.deleted_at IS NULL
                    AND d2.id != da.deal_id
                    AND d2.created_at::date < da.activity_date
                ) THEN 'existing' ELSE 'new' END AS segment,
                COUNT(*)::int AS cnt
            FROM deal_activities da
            JOIN deals d ON da.deal_id = d.id
            WHERE da.user_id = ${userId}
            AND da.business_unit_id = ${businessUnitId}
            AND da.is_km_contact = true
            AND da.activity_date >= ${startDate}
            AND da.activity_date <= ${endDate}
            GROUP BY 1
        `);
        for (const row of kmContactRows.rows) {
            const seg = row.segment as 'new' | 'existing';
            const cnt = Number(row.cnt);
            metrics.kmContactCount.total += cnt;
            metrics.kmContactCount.bySegment[seg] += cnt;
        }
    }

    // 2. Call logs (callLogs has companyId directly)
    const callLogRows = await db.execute<SegRow>(sql`
        SELECT
            CASE WHEN EXISTS (
                SELECT 1 FROM deals d2
                WHERE d2.company_id = cl.company_id
                AND d2.business_unit_id = ${businessUnitId}
                AND d2.deleted_at IS NULL
                AND d2.created_at < cl.started_at
            ) THEN 'existing' ELSE 'new' END AS segment,
            COUNT(*)::int AS cnt
        FROM call_logs cl
        WHERE cl.user_id = ${userId}
        AND cl.business_unit_id = ${businessUnitId}
        AND cl.started_at >= ${startDate}::date
        AND cl.started_at < (${endDate}::date + INTERVAL '1 day')
        GROUP BY 1
    `);

    for (const row of callLogRows.rows) {
        const seg = row.segment as 'new' | 'existing';
        const cnt = Number(row.cnt);
        metrics.callCount.total += cnt;
        metrics.callCount.bySegment[seg] += cnt;
    }

    // 3. Appointments (deals created in period, owned by user)
    const apoRows = await db.execute<SegRow>(sql`
        SELECT
            CASE WHEN EXISTS (
                SELECT 1 FROM deals d2
                WHERE d2.company_id = d.company_id
                AND d2.business_unit_id = ${businessUnitId}
                AND d2.deleted_at IS NULL
                AND d2.id != d.id
                AND d2.created_at < d.created_at
            ) THEN 'existing' ELSE 'new' END AS segment,
            COUNT(*)::int AS cnt
        FROM deals d
        WHERE d.owner_user_id = ${userId}
        AND d.business_unit_id = ${businessUnitId}
        AND d.deleted_at IS NULL
        AND d.created_at >= ${startDate}::date
        AND d.created_at < (${endDate}::date + INTERVAL '1 day')
        GROUP BY 1
    `);

    for (const row of apoRows.rows) {
        const seg = row.segment as 'new' | 'existing';
        const cnt = Number(row.cnt);
        metrics.appointmentCount.total += cnt;
        metrics.appointmentCount.bySegment[seg] += cnt;
    }

    // 4. Negotiation (NEGOTIATING stage transitions for user's deals)
    if (negoStageIds.length > 0) {
        const negoRows = await db.execute<SegRow>(sql`
            SELECT
                CASE WHEN EXISTS (
                    SELECT 1 FROM deals d2
                    WHERE d2.company_id = d.company_id
                    AND d2.business_unit_id = ${businessUnitId}
                    AND d2.deleted_at IS NULL
                    AND d2.id != d.id
                    AND d2.created_at < dsh.changed_at
                ) THEN 'existing' ELSE 'new' END AS segment,
                COUNT(*)::int AS cnt
            FROM deal_stage_history dsh
            JOIN deals d ON dsh.deal_id = d.id
            WHERE d.owner_user_id = ${userId}
            AND dsh.to_stage_id = ANY(${buildUuidArraySql(negoStageIds)})
            AND dsh.changed_at >= ${startDate}::date
            AND dsh.changed_at < (${endDate}::date + INTERVAL '1 day')
            GROUP BY 1
        `);
        for (const row of negoRows.rows) {
            const seg = row.segment as 'new' | 'existing';
            const cnt = Number(row.cnt);
            metrics.negotiationCount.total += cnt;
            metrics.negotiationCount.bySegment[seg] += cnt;
        }
    }

    // 5. Contracts (CONTRACTED stage transitions for user's deals)
    if (contractStageIds.length > 0) {
        const contractRows = await db.execute<SegRow>(sql`
            SELECT
                CASE WHEN EXISTS (
                    SELECT 1 FROM deals d2
                    WHERE d2.company_id = d.company_id
                    AND d2.business_unit_id = ${businessUnitId}
                    AND d2.deleted_at IS NULL
                    AND d2.id != d.id
                    AND d2.created_at < dsh.changed_at
                ) THEN 'existing' ELSE 'new' END AS segment,
                COUNT(*)::int AS cnt
            FROM deal_stage_history dsh
            JOIN deals d ON dsh.deal_id = d.id
            WHERE d.owner_user_id = ${userId}
            AND dsh.to_stage_id = ANY(${buildUuidArraySql(contractStageIds)})
            AND dsh.changed_at >= ${startDate}::date
            AND dsh.changed_at < (${endDate}::date + INTERVAL '1 day')
            GROUP BY 1
        `);
        for (const row of contractRows.rows) {
            const seg = row.segment as 'new' | 'existing';
            const cnt = Number(row.cnt);
            metrics.contractCount.total += cnt;
            metrics.contractCount.bySegment[seg] += cnt;
        }
    }

    return metrics;
}

export async function getPersonalRollingKpis(
    userId: string,
    businessUnitId: string,
): Promise<PersonalRollingKpiBlock[]> {
    const [negoStages, contractStages] = await Promise.all([
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(and(eq(pipelines.businessUnitId, businessUnitId), eq(pipelineStages.stageKey, 'NEGOTIATING'))),
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(and(eq(pipelines.businessUnitId, businessUnitId), eq(pipelineStages.stageKey, 'CONTRACTED'))),
    ]);
    const negoStageIds = negoStages.map((s) => s.id);
    const contractStageIds = contractStages.map((s) => s.id);

    const results = await Promise.all(
        ALL_ROLLING_PERIODS.map(async (period) => {
            const bounds = getRollingPeriodBounds(period);
            const metrics = await getPersonalPeriodMetrics(userId, businessUnitId, bounds, negoStageIds, contractStageIds);
            return {
                period,
                periodLabel: bounds.label,
                startDate: bounds.startDate,
                endDate: bounds.endDate,
                metrics,
            } satisfies PersonalRollingKpiBlock;
        }),
    );
    return results;
}

type CompanyActionRow = {
    companyId: string;
    companyName: string;
    dealId: string;
    dealName: string;
    actedAt: string;
};

const PERSONAL_ACTION_TYPE_LABELS: Record<PersonalCompanyActionType, string> = {
    VISIT: '訪問',
    ONLINE: 'オンライン商談',
    APPOINTMENT: 'アポイント獲得',
    CONTRACT: '契約',
};

function aggregateLastWeekCompanyActions(
    actionType: PersonalCompanyActionType,
    rows: CompanyActionRow[],
): PersonalLastWeekCompanyActionGroup {
    const companyMap = new Map<string, PersonalLastWeekCompanyActionItem>();

    for (const row of rows) {
        const existing = companyMap.get(row.companyId);
        if (existing) {
            existing.occurrenceCount += 1;
            continue;
        }

        companyMap.set(row.companyId, {
            companyId: row.companyId,
            companyName: row.companyName,
            dealId: row.dealId,
            dealName: row.dealName,
            latestActedAt: row.actedAt,
            occurrenceCount: 1,
        });
    }

    return {
        actionType,
        label: PERSONAL_ACTION_TYPE_LABELS[actionType],
        companies: Array.from(companyMap.values()),
    };
}

export async function getPersonalLastWeekCompanyActions(
    userId: string,
    businessUnitId: string,
): Promise<PersonalLastWeekCompanyActionGroup[]> {
    const lastWeekBounds = getRollingPeriodBounds('lastWeek');
    const startDateTime = new Date(`${lastWeekBounds.startDate}T00:00:00Z`);
    const endDateTime = new Date(`${lastWeekBounds.endDate}T23:59:59Z`);

    const [contractStages, visits, onlineMeetings, appointments] = await Promise.all([
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(and(eq(pipelines.businessUnitId, businessUnitId), eq(pipelineStages.stageKey, 'CONTRACTED'))),
        db
            .select({
                companyId: companies.id,
                companyName: companies.displayName,
                dealId: deals.id,
                dealName: deals.title,
                actedAt: dealActivities.activityDate,
            })
            .from(dealActivities)
            .innerJoin(deals, eq(dealActivities.dealId, deals.id))
            .innerJoin(companies, eq(deals.companyId, companies.id))
            .where(
                and(
                    eq(dealActivities.userId, userId),
                    eq(dealActivities.businessUnitId, businessUnitId),
                    eq(dealActivities.activityType, 'VISIT'),
                    gte(dealActivities.activityDate, lastWeekBounds.startDate),
                    lte(dealActivities.activityDate, lastWeekBounds.endDate),
                ),
            )
            .orderBy(desc(dealActivities.activityDate), desc(dealActivities.createdAt)),
        db
            .select({
                companyId: companies.id,
                companyName: companies.displayName,
                dealId: deals.id,
                dealName: deals.title,
                actedAt: dealActivities.activityDate,
            })
            .from(dealActivities)
            .innerJoin(deals, eq(dealActivities.dealId, deals.id))
            .innerJoin(companies, eq(deals.companyId, companies.id))
            .where(
                and(
                    eq(dealActivities.userId, userId),
                    eq(dealActivities.businessUnitId, businessUnitId),
                    eq(dealActivities.activityType, 'ONLINE'),
                    gte(dealActivities.activityDate, lastWeekBounds.startDate),
                    lte(dealActivities.activityDate, lastWeekBounds.endDate),
                ),
            )
            .orderBy(desc(dealActivities.activityDate), desc(dealActivities.createdAt)),
        db
            .select({
                companyId: companies.id,
                companyName: companies.displayName,
                dealId: deals.id,
                dealName: deals.title,
                actedAt: deals.createdAt,
            })
            .from(deals)
            .innerJoin(companies, eq(deals.companyId, companies.id))
            .where(
                and(
                    eq(deals.ownerUserId, userId),
                    eq(deals.businessUnitId, businessUnitId),
                    isNull(deals.deletedAt),
                    gte(deals.createdAt, startDateTime),
                    lte(deals.createdAt, endDateTime),
                ),
            )
            .orderBy(desc(deals.createdAt)),
    ]);

    const contracts =
        contractStages.length === 0
            ? []
            : await db
                  .select({
                      companyId: companies.id,
                      companyName: companies.displayName,
                      dealId: deals.id,
                      dealName: deals.title,
                      actedAt: dealStageHistory.changedAt,
                  })
                  .from(dealStageHistory)
                  .innerJoin(deals, eq(dealStageHistory.dealId, deals.id))
                  .innerJoin(companies, eq(deals.companyId, companies.id))
                  .where(
                      and(
                          eq(deals.ownerUserId, userId),
                          eq(deals.businessUnitId, businessUnitId),
                          inArray(
                              dealStageHistory.toStageId,
                              contractStages.map((stage) => stage.id),
                          ),
                          gte(dealStageHistory.changedAt, startDateTime),
                          lte(dealStageHistory.changedAt, endDateTime),
                      ),
                  )
                  .orderBy(desc(dealStageHistory.changedAt));

    return [
        aggregateLastWeekCompanyActions(
            'VISIT',
            visits.map((row) => ({
                ...row,
                actedAt: row.actedAt,
            })),
        ),
        aggregateLastWeekCompanyActions(
            'ONLINE',
            onlineMeetings.map((row) => ({
                ...row,
                actedAt: row.actedAt,
            })),
        ),
        aggregateLastWeekCompanyActions(
            'APPOINTMENT',
            appointments.map((row) => ({
                ...row,
                actedAt: row.actedAt.toISOString(),
            })),
        ),
        aggregateLastWeekCompanyActions(
            'CONTRACT',
            contracts.map((row) => ({
                ...row,
                actedAt: row.actedAt.toISOString(),
            })),
        ),
    ];
}

export async function getPersonalNextActions(
    userId: string,
    businessUnitId: string,
    today: string,
): Promise<PersonalNextActionItem[]> {
    const endOfWindow = getTokyoWeekEndStr(today);
    return listPersonalDealNextActionTasks(userId, businessUnitId, today, endOfWindow);
}
