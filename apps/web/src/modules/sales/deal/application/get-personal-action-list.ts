import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { getPersonalNextActions } from '../infrastructure/personal-kpi-repository';
import type { PersonalNextActionItem } from '@g-dx/contracts';

export async function getPersonalActionList(): Promise<PersonalNextActionItem[]> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.read');

    const businessUnit = await findBusinessUnitByScope(session.activeBusinessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return getPersonalNextActions(session.user.id, businessUnit.id, today);
}
