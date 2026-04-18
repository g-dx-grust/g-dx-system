import { db } from '@g-dx/database';
import { contracts, userBusinessMemberships, userKpiTargets, users } from '@g-dx/database/schema';
import { and, eq, isNull, lte, gte, sql } from 'drizzle-orm';
import type { BusinessScopeType } from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { AppError } from '@/shared/server/errors';
import { hasSegmentTargetColumns } from './kpi-target-columns';

export interface TeamKpiTargetSummary {
    targetMonth: string;
    activeMemberCount: number;
    membersWithTargetsCount: number;
    totals: {
        callTarget: number;
        visitTarget: number;
        newVisitTarget: number;
        appointmentTarget: number;
        negotiationTarget: number;
        newNegotiationTarget: number;
        contractTarget: number;
        revenueTarget: number;
    };
    revenueActual: number;
}

function getMonthBounds(targetMonth: string): { startDate: string; endDate: string } {
    const [year, month] = targetMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
}

export async function getTeamKpiTargetSummaryByScope(
    businessScope: BusinessScopeType,
    targetMonth: string,
): Promise<TeamKpiTargetSummary> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const { startDate, endDate } = getMonthBounds(targetMonth);
    const supportsSegmentTargets = await hasSegmentTargetColumns();

    const [targetTotalsRow, activeMemberRow, configuredMemberRow, revenueActualRow] =
        await Promise.all([
            supportsSegmentTargets
                ? db
                      .select({
                          callTarget: sql<number>`coalesce(sum(${userKpiTargets.callTarget}), 0)::int`,
                          visitTarget: sql<number>`coalesce(sum(${userKpiTargets.visitTarget}), 0)::int`,
                          newVisitTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.newVisitTarget}), 0)::int`,
                          appointmentTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.appointmentTarget}), 0)::int`,
                          negotiationTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.negotiationTarget}), 0)::int`,
                          newNegotiationTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.newNegotiationTarget}), 0)::int`,
                          contractTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.contractTarget}), 0)::int`,
                          revenueTarget: sql<string>`coalesce(sum(${userKpiTargets.revenueTarget}), 0)`,
                      })
                      .from(userKpiTargets)
                      .where(
                          and(
                              eq(userKpiTargets.businessUnitId, businessUnit.id),
                              eq(userKpiTargets.targetMonth, targetMonth),
                          ),
                      )
                : db
                      .select({
                          callTarget: sql<number>`coalesce(sum(${userKpiTargets.callTarget}), 0)::int`,
                          visitTarget: sql<number>`coalesce(sum(${userKpiTargets.visitTarget}), 0)::int`,
                          newVisitTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.visitTarget}), 0)::int`,
                          appointmentTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.appointmentTarget}), 0)::int`,
                          negotiationTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.negotiationTarget}), 0)::int`,
                          newNegotiationTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.negotiationTarget}), 0)::int`,
                          contractTarget:
                              sql<number>`coalesce(sum(${userKpiTargets.contractTarget}), 0)::int`,
                          revenueTarget: sql<string>`coalesce(sum(${userKpiTargets.revenueTarget}), 0)`,
                      })
                      .from(userKpiTargets)
                      .where(
                          and(
                              eq(userKpiTargets.businessUnitId, businessUnit.id),
                              eq(userKpiTargets.targetMonth, targetMonth),
                          ),
                      ),
            db
                .select({
                    count: sql<number>`count(distinct ${userBusinessMemberships.userId})::int`,
                })
                .from(userBusinessMemberships)
                .innerJoin(users, and(
                    eq(userBusinessMemberships.userId, users.id),
                    isNull(users.deletedAt),
                    eq(users.status, 'active'),
                ))
                .where(
                    and(
                        eq(userBusinessMemberships.businessUnitId, businessUnit.id),
                        eq(userBusinessMemberships.membershipStatus, 'active'),
                    ),
                ),
            db
                .select({
                    count: sql<number>`count(distinct ${userKpiTargets.userId})::int`,
                })
                .from(userKpiTargets)
                .where(
                    and(
                        eq(userKpiTargets.businessUnitId, businessUnit.id),
                        eq(userKpiTargets.targetMonth, targetMonth),
                    ),
                ),
            db
                .select({
                    total: sql<string>`coalesce(sum(${contracts.amount}), 0)`,
                })
                .from(contracts)
                .where(
                    and(
                        eq(contracts.businessUnitId, businessUnit.id),
                        isNull(contracts.deletedAt),
                        gte(contracts.contractDate, startDate),
                        lte(contracts.contractDate, endDate),
                    ),
                ),
        ]);

    return {
        targetMonth,
        activeMemberCount: Number(activeMemberRow[0]?.count ?? 0),
        membersWithTargetsCount: Number(configuredMemberRow[0]?.count ?? 0),
        totals: {
            callTarget: Number(targetTotalsRow[0]?.callTarget ?? 0),
            visitTarget: Number(targetTotalsRow[0]?.visitTarget ?? 0),
            newVisitTarget: Number(targetTotalsRow[0]?.newVisitTarget ?? 0),
            appointmentTarget: Number(targetTotalsRow[0]?.appointmentTarget ?? 0),
            negotiationTarget: Number(targetTotalsRow[0]?.negotiationTarget ?? 0),
            newNegotiationTarget: Number(targetTotalsRow[0]?.newNegotiationTarget ?? 0),
            contractTarget: Number(targetTotalsRow[0]?.contractTarget ?? 0),
            revenueTarget: parseFloat(targetTotalsRow[0]?.revenueTarget ?? '0'),
        },
        revenueActual: parseFloat(revenueActualRow[0]?.total ?? '0'),
    };
}
