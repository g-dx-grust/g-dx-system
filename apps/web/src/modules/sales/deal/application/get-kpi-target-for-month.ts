import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { getKpiTargetRow } from '../infrastructure/personal-kpi-repository';
import type { UserKpiTarget } from '@g-dx/contracts';

export async function getKpiTargetForMonth(targetMonth?: string): Promise<UserKpiTarget | null> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'dashboard.kpi.read');

    const businessUnit = await findBusinessUnitByScope(session.activeBusinessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const now = new Date();
    const month =
        targetMonth ??
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return getKpiTargetRow(session.user.id, businessUnit.id, month);
}
