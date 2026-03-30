import { NextRequest } from 'next/server';
import type { TeamKpiSummaryResponse } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import {
    userBusinessMemberships,
    userKpiTargets,
    users,
} from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { hasSegmentTargetColumns } from '@/modules/sales/deal/infrastructure/kpi-target-columns';
import { assertPermission } from '@/shared/server/authorization';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { errorResponse, successResponse } from '@/shared/server/http';
import { getAuthenticatedAppSession } from '@/shared/server/session';

type MemberTargetRow = TeamKpiSummaryResponse['data']['memberTargets'][number];

function getDefaultMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        return errorResponse(401, 'UNAUTHORIZED', '認証が必要です');
    }

    try {
        assertPermission(session, 'dashboard.kpi.read');
    } catch {
        return errorResponse(403, 'FORBIDDEN', '権限がありません');
    }

    const { searchParams } = new URL(req.url);
    const businessScope =
        (searchParams.get('businessScope') ??
            session.user.businessScopes[0]) as string;
    const targetMonth = searchParams.get('targetMonth') ?? getDefaultMonth();

    const businessUnit = await findBusinessUnitByScope(businessScope as never);
    if (!businessUnit) {
        return errorResponse(
            400,
            'VALIDATION_ERROR',
            '事業部が見つかりません',
        );
    }

    const supportsSegmentTargets = await hasSegmentTargetColumns();

    const [members, rawTargets] = await Promise.all([
        db
            .select({
                userId: users.id,
                displayName: users.displayName,
            })
            .from(userBusinessMemberships)
            .innerJoin(
                users,
                and(
                    eq(users.id, userBusinessMemberships.userId),
                    isNull(users.deletedAt),
                ),
            )
            .where(
                and(
                    eq(userBusinessMemberships.businessUnitId, businessUnit.id),
                    eq(userBusinessMemberships.membershipStatus, 'active'),
                ),
            ),
        supportsSegmentTargets
            ? db
                  .select()
                  .from(userKpiTargets)
                  .where(
                      and(
                          eq(userKpiTargets.businessUnitId, businessUnit.id),
                          eq(userKpiTargets.targetMonth, targetMonth),
                      ),
                  )
            : db
                  .select({
                      userId: userKpiTargets.userId,
                      callTarget: userKpiTargets.callTarget,
                      visitTarget: userKpiTargets.visitTarget,
                      appointmentTarget: userKpiTargets.appointmentTarget,
                      negotiationTarget: userKpiTargets.negotiationTarget,
                      contractTarget: userKpiTargets.contractTarget,
                      revenueTarget: userKpiTargets.revenueTarget,
                  })
                  .from(userKpiTargets)
                  .where(
                      and(
                          eq(userKpiTargets.businessUnitId, businessUnit.id),
                          eq(userKpiTargets.targetMonth, targetMonth),
                      ),
                  ),
    ]);

    const normalizedTargets = new Map(
        rawTargets.map((row) => [
            row.userId,
            {
                userId: row.userId,
                callTarget: row.callTarget,
                visitTarget: row.visitTarget,
                newVisitTarget:
                    'newVisitTarget' in row
                        ? row.newVisitTarget
                        : row.visitTarget,
                appointmentTarget: row.appointmentTarget,
                negotiationTarget: row.negotiationTarget,
                newNegotiationTarget:
                    'newNegotiationTarget' in row
                        ? row.newNegotiationTarget
                        : row.negotiationTarget,
                contractTarget: row.contractTarget,
                revenueTarget: Number(row.revenueTarget ?? 0),
            },
        ]),
    );

    const memberTargets: MemberTargetRow[] = members.map((member) => {
        const target = normalizedTargets.get(member.userId);
        return {
            userId: member.userId,
            displayName: member.displayName ?? '',
            callTarget: target?.callTarget ?? 0,
            visitTarget: target?.visitTarget ?? 0,
            newVisitTarget: target?.newVisitTarget ?? 0,
            appointmentTarget: target?.appointmentTarget ?? 0,
            negotiationTarget: target?.negotiationTarget ?? 0,
            newNegotiationTarget: target?.newNegotiationTarget ?? 0,
            contractTarget: target?.contractTarget ?? 0,
            revenueTarget: target?.revenueTarget ?? 0,
        };
    });

    const teamTotal = memberTargets.reduce(
        (acc, row) => ({
            callTarget: acc.callTarget + row.callTarget,
            visitTarget: acc.visitTarget + row.visitTarget,
            newVisitTarget: acc.newVisitTarget + row.newVisitTarget,
            appointmentTarget: acc.appointmentTarget + row.appointmentTarget,
            negotiationTarget: acc.negotiationTarget + row.negotiationTarget,
            newNegotiationTarget:
                acc.newNegotiationTarget + row.newNegotiationTarget,
            contractTarget: acc.contractTarget + row.contractTarget,
            revenueTarget: acc.revenueTarget + row.revenueTarget,
        }),
        {
            callTarget: 0,
            visitTarget: 0,
            newVisitTarget: 0,
            appointmentTarget: 0,
            negotiationTarget: 0,
            newNegotiationTarget: 0,
            contractTarget: 0,
            revenueTarget: 0,
        },
    );

    return successResponse<TeamKpiSummaryResponse['data']>({
        targetMonth,
        businessUnitId: businessUnit.id,
        teamTotal,
        memberTargets,
    });
}
