import { unstable_cache } from 'next/cache';
import type { BusinessScopeType, PersonalDashboardData, PersonalKpiItem } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import {
    getKpiTargetRow,
    getPersonalActuals,
    getPersonalLastWeekCompanyActions,
    getPersonalRollingKpis,
} from '../infrastructure/personal-kpi-repository';

function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
}

function buildPeriodLabel(targetMonth: string): string {
    const [year, month] = targetMonth.split('-').map(Number);
    return `${year}年${month}月`;
}

const KPI_ITEM_DEFS: Array<{ key: PersonalKpiItem['key']; label: string }> = [
    { key: 'callCount', label: 'コール数' },
    { key: 'newVisitCount', label: '新規面会数' },
    { key: 'appointmentCount', label: 'アポイント数' },
    { key: 'newNegotiationCount', label: '新規商談数' },
    { key: 'contractCount', label: '成約数' },
];

const getPersonalDashboardDataCached = unstable_cache(
    async (
        businessScope: BusinessScopeType,
        targetUserId: string,
        month: string,
    ): Promise<PersonalDashboardData> => {
        const businessUnit = await findBusinessUnitByScope(businessScope);
        if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

        const [target, actuals, rollingKpis, lastWeekCompanyActions] = await Promise.all([
            getKpiTargetRow(targetUserId, businessUnit.id, month),
            getPersonalActuals(targetUserId, businessUnit.id, month),
            getPersonalRollingKpis(targetUserId, businessUnit.id),
            getPersonalLastWeekCompanyActions(targetUserId, businessUnit.id),
        ]);

        const hasTargets = target !== null;
        const thisMonthMetrics = rollingKpis.find(
            (block) => block.period === 'thisMonth',
        )?.metrics;

        const actualsMap: Record<PersonalKpiItem['key'], number> = {
            callCount: actuals.callCount,
            newVisitCount: thisMonthMetrics?.newVisitCount.total ?? 0,
            appointmentCount: actuals.appointmentCount,
            newNegotiationCount:
                thisMonthMetrics?.negotiationCount.bySegment.new ?? 0,
            contractCount: actuals.contractCount,
        };

        const targetMap: Record<PersonalKpiItem['key'], number> = {
            callCount: target?.callTarget ?? 0,
            newVisitCount: target?.newVisitTarget ?? target?.visitTarget ?? 0,
            appointmentCount: target?.appointmentTarget ?? 0,
            newNegotiationCount:
                target?.newNegotiationTarget ??
                target?.negotiationTarget ??
                0,
            contractCount: target?.contractTarget ?? 0,
        };

        const kpiItems: PersonalKpiItem[] = KPI_ITEM_DEFS.map(({ key, label }) => {
            const actual = actualsMap[key];
            const targetValue = targetMap[key];
            const achievementPct =
                targetValue > 0 ? Math.round((actual / targetValue) * 100) : 0;
            return { key, label, actual, target: targetValue, achievementPct };
        });

        const revenueActual = actuals.revenueTotal;
        const revenueTarget = target?.revenueTarget ?? 0;
        const revenueAchievementPct =
            revenueTarget > 0 ? Math.round((revenueActual / revenueTarget) * 100) : 0;

        return {
            targetMonth: month,
            periodLabel: buildPeriodLabel(month),
            kpiItems,
            revenueActual,
            revenueTarget,
            revenueAchievementPct,
            hasTargets,
            rollingKpis,
            lastWeekCompanyActions,
        };
    },
    ['dashboard-personal-data'],
    { revalidate: DASHBOARD_DATA_REVALIDATE_SECONDS },
);

export async function getPersonalDashboardData(options?: {
    targetMonth?: string;
    userId?: string;
}): Promise<PersonalDashboardData> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'dashboard.kpi.read');

    const month = options?.targetMonth ?? getCurrentMonth();
    const targetUserId = options?.userId ?? session.user.id;

    return getPersonalDashboardDataCached(
        session.activeBusinessScope,
        targetUserId,
        month,
    );
}
