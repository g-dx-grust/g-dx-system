import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getSalesKpi as getSalesKpiFromRepository, type KpiPeriod, type SalesKpiData } from '../infrastructure/kpi-repository';

export type { KpiPeriod, SalesKpiData };

export async function getSalesKpi(period: KpiPeriod): Promise<SalesKpiData> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.read');
    return getSalesKpiFromRepository(session.activeBusinessScope, period);
}
