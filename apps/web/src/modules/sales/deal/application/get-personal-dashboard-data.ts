import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import {
    getKpiTargetRow,
    getPersonalActuals,
    getPersonalLastWeekCompanyActions,
    getPersonalRollingKpis,
} from '../infrastructure/personal-kpi-repository';
import type { PersonalDashboardData, PersonalKpiItem } from '@g-dx/contracts';

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
    { key: 'visitCount', label: '訪問数' },
    { key: 'appointmentCount', label: 'アポイント数' },
    { key: 'negotiationCount', label: '商談化数' },
    { key: 'contractCount', label: '契約数' },
];

export async function getPersonalDashboardData(options?: {
    targetMonth?: string;
    userId?: string;
}): Promise<PersonalDashboardData> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'dashboard.kpi.read');

    const month = options?.targetMonth ?? getCurrentMonth();
    const targetUserId = options?.userId ?? session.user.id;
    const businessUnit = await findBusinessUnitByScope(session.activeBusinessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const [target, actuals, rollingKpis, lastWeekCompanyActions] = await Promise.all([
        getKpiTargetRow(targetUserId, businessUnit.id, month),
        getPersonalActuals(targetUserId, businessUnit.id, month),
        getPersonalRollingKpis(targetUserId, businessUnit.id),
        getPersonalLastWeekCompanyActions(targetUserId, businessUnit.id),
    ]);

    const hasTargets = target !== null;

    const actualsMap: Record<PersonalKpiItem['key'], number> = {
        callCount: actuals.callCount,
        visitCount: actuals.visitCount,
        appointmentCount: actuals.appointmentCount,
        negotiationCount: actuals.negotiationCount,
        contractCount: actuals.contractCount,
    };

    const targetMap: Record<PersonalKpiItem['key'], number> = {
        callCount: target?.callTarget ?? 0,
        visitCount: target?.visitTarget ?? 0,
        appointmentCount: target?.appointmentTarget ?? 0,
        negotiationCount: target?.negotiationTarget ?? 0,
        contractCount: target?.contractTarget ?? 0,
    };

    const kpiItems: PersonalKpiItem[] = KPI_ITEM_DEFS.map(({ key, label }) => {
        const actual = actualsMap[key];
        const t = targetMap[key];
        const achievementPct = t > 0 ? Math.round((actual / t) * 100) : 0;
        return { key, label, actual, target: t, achievementPct };
    });

    const revenueActual = actuals.revenueTotal;
    const revenueTarget = target?.revenueTarget ?? 0;
    const revenueAchievementPct = revenueTarget > 0 ? Math.round((revenueActual / revenueTarget) * 100) : 0;

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
}
