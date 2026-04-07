import { db } from '@g-dx/database';
import { pipelineStages, pipelines } from '@g-dx/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { BusinessScopeType, KpiSegmentedCounts, RollingKpiMetricKey, SalesRollingKpiColumn, SalesRollingKpiGrid } from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { getRollingPeriodBounds, ALL_ROLLING_PERIODS, type RollingPeriodBounds } from './rolling-period';

function emptySegmented(): KpiSegmentedCounts {
    return { total: 0, bySegment: { new: 0, existing: 0 } };
}

function emptyMetrics(): Record<RollingKpiMetricKey, KpiSegmentedCounts> {
    return {
        callCount: emptySegmented(),
        visitCount: emptySegmented(),
        onlineCount: emptySegmented(),
        newVisitCount: emptySegmented(),
        appointmentCount: emptySegmented(),
        negotiationCount: emptySegmented(),
        contractCount: emptySegmented(),
    };
}

function buildUuidArraySql(values: string[]) {
    return sql`ARRAY[${sql.join(values.map((value) => sql`${value}`), sql`, `)}]::uuid[]`;
}

async function getTeamPeriodMetrics(
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

    // 1. Activities from deal_activities (CALL, VISIT, ONLINE) — all users in BU
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
            CASE
                WHEN da.activity_type = 'VISIT'
                    THEN SUM(COALESCE(da.meeting_count, 1))::int
                ELSE COUNT(*)::int
            END AS cnt
        FROM deal_activities da
        JOIN deals d ON da.deal_id = d.id
        WHERE da.business_unit_id = ${businessUnitId}
        AND da.activity_date >= ${startDate}
        AND da.activity_date <= ${endDate}
        GROUP BY da.activity_type, 2
    `);

    const newVisitRows = await db.execute<NewVisitRow>(sql`
        SELECT
            da.activity_type,
            CASE
                WHEN da.activity_type = 'VISIT'
                    THEN SUM(COALESCE(da.meeting_count, 1))::int
                ELSE COUNT(*)::int
            END AS cnt
        FROM deal_activities da
        WHERE da.business_unit_id = ${businessUnitId}
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

    // 2. Call logs (all users in BU)
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
        WHERE cl.business_unit_id = ${businessUnitId}
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

    // 3. Appointments (deals created in period for this BU)
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
        WHERE d.business_unit_id = ${businessUnitId}
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

    // 4. Negotiation (NEGOTIATING stage transitions)
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
            WHERE dsh.to_stage_id = ANY(${buildUuidArraySql(negoStageIds)})
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

    // 5. Contracts (CONTRACTED stage transitions)
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
            WHERE dsh.to_stage_id = ANY(${buildUuidArraySql(contractStageIds)})
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

export async function getTeamRollingKpi(businessScope: BusinessScopeType): Promise<SalesRollingKpiGrid> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) return [];

    const [negoStages, contractStages] = await Promise.all([
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(and(eq(pipelines.businessUnitId, businessUnit.id), eq(pipelineStages.stageKey, 'NEGOTIATING'))),
        db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(and(eq(pipelines.businessUnitId, businessUnit.id), eq(pipelineStages.stageKey, 'CONTRACTED'))),
    ]);
    const negoStageIds = negoStages.map((s) => s.id);
    const contractStageIds = contractStages.map((s) => s.id);

    const results = await Promise.all(
        ALL_ROLLING_PERIODS.map(async (period) => {
            const bounds = getRollingPeriodBounds(period);
            const metrics = await getTeamPeriodMetrics(businessUnit.id, bounds, negoStageIds, contractStageIds);
            return {
                period,
                periodLabel: bounds.label,
                startDate: bounds.startDate,
                endDate: bounds.endDate,
                metrics,
            } satisfies SalesRollingKpiColumn;
        }),
    );
    return results;
}
