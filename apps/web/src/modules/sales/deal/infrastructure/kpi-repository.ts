import { db } from '@g-dx/database';
import { dealActivities, deals, pipelineStages, pipelines } from '@g-dx/database/schema';
import { and, count, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import type { BusinessScopeType } from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';

export type KpiPeriod = 'daily' | 'monthly' | 'quarterly' | 'yearly';

export interface SalesKpiData {
    period: KpiPeriod;
    periodLabel: string;
    callCount: number;
    visitCount: number;
    onlineCount: number;
    appointmentCount: number;
    negotiationCount: number;
    contractCount: number;
}

function getPeriodDates(period: KpiPeriod): { startDate: string; endDate: string; label: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    switch (period) {
        case 'daily': {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { startDate: dateStr, endDate: dateStr, label: `${month + 1}/${day} (本日)` };
        }
        case 'monthly': {
            const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month + 1, 0).getDate();
            const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            return { startDate, endDate, label: `${year}年${month + 1}月` };
        }
        case 'quarterly': {
            const quarter = Math.floor(month / 3);
            const startMonth = quarter * 3;
            const endMonth = startMonth + 2;
            const startDate = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, endMonth + 1, 0).getDate();
            const endDate = `${year}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            return { startDate, endDate, label: `${year}年 Q${quarter + 1}` };
        }
        case 'yearly': {
            return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: `${year}年` };
        }
    }
}

export async function getSalesKpi(businessScope: BusinessScopeType, period: KpiPeriod): Promise<SalesKpiData> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) return emptyKpi(period);

    const { startDate, endDate, label } = getPeriodDates(period);

    const activityCounts = await db
        .select({
            activityType: dealActivities.activityType,
            count: sql<number>`count(*)::int`,
        })
        .from(dealActivities)
        .where(and(
            eq(dealActivities.businessUnitId, businessUnit.id),
            gte(dealActivities.activityDate, startDate),
            lte(dealActivities.activityDate, endDate),
        ))
        .groupBy(dealActivities.activityType);

    let callCount = 0;
    let visitCount = 0;
    let onlineCount = 0;
    for (const row of activityCounts) {
        if (row.activityType === 'CALL') callCount = row.count;
        else if (row.activityType === 'VISIT') visitCount = row.count;
        else if (row.activityType === 'ONLINE') onlineCount = row.count;
    }

    // アポイント数 = APO_ACQUIRED ステージの案件作成数（期間内）
    const apoStages = await db
        .select({ id: pipelineStages.id })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(and(
            eq(pipelines.businessUnitId, businessUnit.id),
            eq(pipelineStages.stageKey, 'APO_ACQUIRED'),
        ));
    const apoStageIds = apoStages.map((s) => s.id);

    let appointmentCount = 0;
    if (apoStageIds.length > 0) {
        const [result] = await db
            .select({ count: count() })
            .from(deals)
            .where(and(
                eq(deals.businessUnitId, businessUnit.id),
                isNull(deals.deletedAt),
                gte(deals.createdAt, new Date(`${startDate}T00:00:00Z`)),
                lte(deals.createdAt, new Date(`${endDate}T23:59:59Z`)),
            ));
        appointmentCount = Number(result?.count ?? 0);
    }

    // 商談数 = NEGOTIATING ステージに到達した案件数
    const negoStages = await db
        .select({ id: pipelineStages.id })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(and(
            eq(pipelines.businessUnitId, businessUnit.id),
            eq(pipelineStages.stageKey, 'NEGOTIATING'),
        ));
    const negoStageIds = negoStages.map((s) => s.id);

    let negotiationCount = 0;
    if (negoStageIds.length > 0) {
        const { dealStageHistory } = await import('@g-dx/database/schema');
        for (const stageId of negoStageIds) {
            const [result] = await db
                .select({ count: count() })
                .from(dealStageHistory)
                .where(and(
                    eq(dealStageHistory.toStageId, stageId),
                    gte(dealStageHistory.changedAt, new Date(`${startDate}T00:00:00Z`)),
                    lte(dealStageHistory.changedAt, new Date(`${endDate}T23:59:59Z`)),
                ));
            negotiationCount += Number(result?.count ?? 0);
        }
    }

    // 契約数 = CONTRACTED ステージに到達した案件数
    const contractedStages = await db
        .select({ id: pipelineStages.id })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(and(
            eq(pipelines.businessUnitId, businessUnit.id),
            eq(pipelineStages.stageKey, 'CONTRACTED'),
        ));

    let contractCount = 0;
    if (contractedStages.length > 0) {
        const { dealStageHistory } = await import('@g-dx/database/schema');
        for (const stageId of contractedStages.map((s) => s.id)) {
            const [result] = await db
                .select({ count: count() })
                .from(dealStageHistory)
                .where(and(
                    eq(dealStageHistory.toStageId, stageId),
                    gte(dealStageHistory.changedAt, new Date(`${startDate}T00:00:00Z`)),
                    lte(dealStageHistory.changedAt, new Date(`${endDate}T23:59:59Z`)),
                ));
            contractCount += Number(result?.count ?? 0);
        }
    }

    return {
        period,
        periodLabel: label,
        callCount,
        visitCount,
        onlineCount,
        appointmentCount,
        negotiationCount,
        contractCount,
    };
}

function emptyKpi(period: KpiPeriod): SalesKpiData {
    const { label } = getPeriodDates(period);
    return { period, periodLabel: label, callCount: 0, visitCount: 0, onlineCount: 0, appointmentCount: 0, negotiationCount: 0, contractCount: 0 };
}
