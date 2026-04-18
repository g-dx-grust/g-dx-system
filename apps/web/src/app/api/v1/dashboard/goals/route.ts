import { NextRequest } from 'next/server';
import { db } from '@g-dx/database';
import { businessGoals } from '@g-dx/database/schema';
import { and, eq } from 'drizzle-orm';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { assertPermission } from '@/shared/server/authorization';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { errorResponse, successResponse } from '@/shared/server/http';
import { AppError } from '@/shared/server/errors';
import type { BusinessGoalListResponse, UpsertBusinessGoalRequest } from '@g-dx/contracts';

/**
 * GET /api/v1/dashboard/goals
 * 事業部の目標一覧を返す。クエリ: ?businessScope=LARK_SUPPORT&periodType=MONTHLY
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
    const periodType = searchParams.get('periodType');

    const bu = await findBusinessUnitByScope(businessScope as never);
    if (!bu) return errorResponse(400, 'VALIDATION_ERROR', '事業部が見つかりません');

    const conditions = [eq(businessGoals.businessUnitId, bu.id)];
    if (periodType) {
        conditions.push(eq(businessGoals.periodType, periodType));
    }

    const rows = await db
        .select()
        .from(businessGoals)
        .where(and(...conditions))
        .orderBy(businessGoals.periodKey);

    return successResponse<BusinessGoalListResponse['data']>(
        rows.map((r) => ({
            id: r.id,
            businessUnitId: r.businessUnitId,
            periodType: r.periodType as never,
            periodKey: r.periodKey,
            revenueTarget: r.revenueTarget ? Number(r.revenueTarget) : null,
            grossProfitTarget: r.grossProfitTarget ? Number(r.grossProfitTarget) : null,
            contractCountTarget: r.contractCountTarget,
        }))
    );
}

/**
 * PUT /api/v1/dashboard/goals
 * 目標を upsert（作成 or 更新）する。ADMIN 以上の権限が必要。
 */
export async function PUT(req: NextRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) return errorResponse(401, 'UNAUTHORIZED', '認証が必要です');

    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) return errorResponse(403, 'FORBIDDEN', 'ADMIN 以上の権限が必要です');

    let body: UpsertBusinessGoalRequest;
    try {
        body = await req.json();
    } catch {
        return errorResponse(400, 'VALIDATION_ERROR', 'リクエストボディが不正です');
    }

    const { businessScope, periodType, periodKey, revenueTarget, grossProfitTarget, contractCountTarget } = body;

    if (!businessScope || !periodType || !periodKey) {
        return errorResponse(400, 'VALIDATION_ERROR', 'businessScope / periodType / periodKey は必須です');
    }

    const bu = await findBusinessUnitByScope(businessScope as never);
    if (!bu) return errorResponse(400, 'VALIDATION_ERROR', '事業部が見つかりません');

    const now = new Date();
    const [upserted] = await db
        .insert(businessGoals)
        .values({
            businessUnitId: bu.id,
            periodType,
            periodKey,
            revenueTarget: revenueTarget != null ? String(revenueTarget) : null,
            grossProfitTarget: grossProfitTarget != null ? String(grossProfitTarget) : null,
            contractCountTarget: contractCountTarget ?? null,
            createdByUserId: session.user.id,
        })
        .onConflictDoUpdate({
            target: [businessGoals.businessUnitId, businessGoals.periodType, businessGoals.periodKey],
            set: {
                revenueTarget: revenueTarget != null ? String(revenueTarget) : null,
                grossProfitTarget: grossProfitTarget != null ? String(grossProfitTarget) : null,
                contractCountTarget: contractCountTarget ?? null,
                updatedAt: now,
            },
        })
        .returning({ id: businessGoals.id });

    return successResponse({ id: upserted.id });
}
