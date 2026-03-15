import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { upsertKpiTarget } from '../infrastructure/personal-kpi-repository';
import type { SaveKpiTargetInput } from '@g-dx/contracts';

const TARGET_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function saveKpiTarget(input: SaveKpiTargetInput): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'dashboard.personal.kpi_write');

    if (!TARGET_MONTH_PATTERN.test(input.targetMonth)) {
        throw new AppError('VALIDATION_ERROR');
    }

    const numericFields = [
        input.callTarget,
        input.visitTarget,
        input.appointmentTarget,
        input.negotiationTarget,
        input.contractTarget,
        input.revenueTarget,
    ];
    if (numericFields.some((v) => isNaN(v) || v < 0)) {
        throw new AppError('VALIDATION_ERROR');
    }

    const businessUnit = await findBusinessUnitByScope(session.activeBusinessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    await upsertKpiTarget(session.user.id, businessUnit.id, input);
}
