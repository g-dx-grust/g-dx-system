import { NextRequest } from 'next/server';
import { db } from '@g-dx/database';
import { userKpiTargets, userBusinessMemberships, users } from '@g-dx/database/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { assertPermission } from '@/shared/server/authorization';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { errorResponse, successResponse } from '@/shared/server/http';
import type { TeamKpiSummaryResponse } from '@g-dx/contracts';

/**
 * GET /api/v1/dashboard/team-kpi
 * 指定月の事業部全体 KPI 目標の合計と、メンバー別内訳を返す。
 *
 * クエリパラメータ:
 *   businessScope  例: LARK_SUPPORT（省略時はセッションのデフォルト）
 *   targetMonth    例: 2025-04（省略時は当月）
 */
export async function GET(req: NextRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) return errorResponse(401, 'UNAUTHORIZED', '認証が必要です');

    try {
        assertPermission(session, 'dashboard.kpi.read');
    } catch {
        return errorResponse(403, 'FORBIDDEN', '権限がありません');
    }

    const { searchParams } = new URL(req.url);
    const businessScope = (searchParams.get('businessScope') ?? session.user.businessScopes[0]) as string;

    // 当月を JST で計算
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const defaultMonth = nowJst.toISOString().slice(0, 7); // 'YYYY-MM'
    const targetMonth = searchParams.get('targetMonth') ?? defaultMonth;

    const bu = await findBusinessUnitByScope(businessScope as never);
    if (!bu) return errorResponse(400, 'VALIDATION_ERROR', '事業部が見つかりません');

    // 事業部のアクティブメンバー全員を取得（case件数が0でも表示するため）
    const members = await db
        .select({
            userId: users.id,
            displayName: users.displayName,
        })
        .from(userBusinessMemberships)
        .innerJoin(users, and(eq(users.id, userBusinessMemberships.userId), isNull(users.deletedAt)))
        .where(
            and(
                eq(userBusinessMemberships.businessUnitId, bu.id),
                eq(userBusinessMemberships.membershipStatus, 'active'),
            )
        );

    // メンバーの KPI 目標を取得
    const targets = await db
        .select()
        .from(userKpiTargets)
        .where(
            and(
                eq(userKpiTargets.businessUnitId, bu.id),
                eq(userKpiTargets.targetMonth, targetMonth),
            )
        );

    const targetByUserId = new Map(targets.map((t) => [t.userId, t]));

    // メンバー別内訳
    const memberRows = members.map((m) => {
        const t = targetByUserId.get(m.userId);
        return {
            userId: m.userId,
            displayName: m.displayName ?? '',
            callTarget: t?.callTarget ?? 0,
            visitTarget: t?.visitTarget ?? 0,
            appointmentTarget: t?.appointmentTarget ?? 0,
            negotiationTarget: t?.negotiationTarget ?? 0,
            contractTarget: t?.contractTarget ?? 0,
            revenueTarget: t ? Number(t.revenueTarget) : 0,
        };
    });

    // チーム合計
    const teamTotal = memberRows.reduce(
        (acc, row) => ({
            callTarget: acc.callTarget + row.callTarget,
            visitTarget: acc.visitTarget + row.visitTarget,
            appointmentTarget: acc.appointmentTarget + row.appointmentTarget,
            negotiationTarget: acc.negotiationTarget + row.negotiationTarget,
            contractTarget: acc.contractTarget + row.contractTarget,
            revenueTarget: acc.revenueTarget + row.revenueTarget,
        }),
        { callTarget: 0, visitTarget: 0, appointmentTarget: 0, negotiationTarget: 0, contractTarget: 0, revenueTarget: 0 }
    );

    return successResponse<TeamKpiSummaryResponse['data']>({
        targetMonth,
        businessUnitId: bu.id,
        teamTotal,
        memberTargets: memberRows,
    });
}
