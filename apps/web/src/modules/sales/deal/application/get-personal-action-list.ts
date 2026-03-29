import { unstable_cache } from 'next/cache';
import type { BusinessScopeType, PersonalNextActionItem } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { DASHBOARD_DATA_REVALIDATE_SECONDS } from '@/shared/server/cache';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getPersonalNextActions } from '../infrastructure/personal-kpi-repository';

const getPersonalActionListCached = unstable_cache(
    async (
        businessScope: BusinessScopeType,
        userId: string,
        today: string,
    ): Promise<PersonalNextActionItem[]> => {
        const businessUnit = await findBusinessUnitByScope(businessScope);
        if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

        return getPersonalNextActions(userId, businessUnit.id, today);
    },
    ['dashboard-personal-action-list'],
    { revalidate: DASHBOARD_DATA_REVALIDATE_SECONDS },
);

export async function getPersonalActionList(options?: {
    userId?: string;
}): Promise<PersonalNextActionItem[]> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return getPersonalActionListCached(
        session.activeBusinessScope,
        options?.userId ?? session.user.id,
        today,
    );
}
