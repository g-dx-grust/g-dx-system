import { NotificationType, type SaveKpiTargetInput } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import {
    userBusinessMemberships,
    users,
} from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { createNotification } from '@/modules/notifications/infrastructure/notification-repository';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { upsertKpiTarget } from '../infrastructure/personal-kpi-repository';

const TARGET_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const KPI_NOTIFICATION_RECIPIENT_NAME = '宮本 勇彦';

async function notifyKpiSubmission(params: {
    actorUserId: string;
    actorName: string;
    businessUnitId: string;
    targetMonth: string;
}): Promise<void> {
    const [recipient] = await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(
            userBusinessMemberships,
            and(
                eq(userBusinessMemberships.userId, users.id),
                eq(userBusinessMemberships.businessUnitId, params.businessUnitId),
                eq(userBusinessMemberships.membershipStatus, 'active'),
            ),
        )
        .where(
            and(
                eq(users.displayName, KPI_NOTIFICATION_RECIPIENT_NAME),
                isNull(users.deletedAt),
            ),
        )
        .limit(1);

    if (!recipient || recipient.id === params.actorUserId) return;

    await createNotification({
        businessUnitId: params.businessUnitId,
        recipientUserId: recipient.id,
        notificationType: NotificationType.KPI_SUBMITTED,
        title: `${params.actorName}さんがKPIを入力しました`,
        body: `${params.targetMonth} の個人KPIが保存されました。`,
        relatedEntityType: 'kpi_target',
        linkUrl: '/dashboard/settings/kpi',
    });
}

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
        input.newVisitTarget,
        input.appointmentTarget,
        input.negotiationTarget,
        input.newNegotiationTarget,
        input.contractTarget,
        input.revenueTarget,
    ];
    if (numericFields.some((value) => isNaN(value) || value < 0)) {
        throw new AppError('VALIDATION_ERROR');
    }

    const businessUnit = await findBusinessUnitByScope(
        session.activeBusinessScope,
    );
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    await upsertKpiTarget(session.user.id, businessUnit.id, input);

    await notifyKpiSubmission({
        actorUserId: session.user.id,
        actorName: session.user.name,
        businessUnitId: businessUnit.id,
        targetMonth: input.targetMonth,
    }).catch((error) => {
        console.error('[KPI] submission notification failed:', error);
    });
}
