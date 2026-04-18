import { NextRequest } from 'next/server';
import { db } from '@g-dx/database';
import { aiWeeklySummaries } from '@g-dx/database/schema';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { assertPermission } from '@/shared/server/authorization';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { errorResponse, successResponse } from '@/shared/server/http';
import type { AiWeeklySummaryResponse } from '@g-dx/contracts';

/**
 * GET /api/v1/dashboard/ai-summary
 * 最新の AI 週次サマリーを返す。
 *
 * クエリパラメータ:
 *   type           'PERSONAL' | 'TEAM'（省略時: PERSONAL）
 *   businessScope  例: LARK_SUPPORT（省略時はセッションのデフォルト）
 *   userId         type=PERSONAL 時のターゲットユーザー（省略時: 自分）
 *   weekStartDate  例: 2025-04-07（省略時: 最新週）
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
    const summaryType = (searchParams.get('type') ?? 'PERSONAL') as 'PERSONAL' | 'TEAM';
    const businessScope = (searchParams.get('businessScope') ?? session.user.businessScopes[0]) as string;
    const targetUserId = summaryType === 'PERSONAL'
        ? (searchParams.get('userId') ?? session.user.id)
        : null;
    const weekStartDate = searchParams.get('weekStartDate');

    const bu = await findBusinessUnitByScope(businessScope as never);
    if (!bu) return errorResponse(400, 'VALIDATION_ERROR', '事業部が見つかりません');

    const conditions = [
        eq(aiWeeklySummaries.summaryType, summaryType),
        eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
    ];

    if (summaryType === 'PERSONAL' && targetUserId) {
        conditions.push(eq(aiWeeklySummaries.targetUserId, targetUserId));
    } else if (summaryType === 'TEAM') {
        conditions.push(eq(aiWeeklySummaries.businessUnitId, bu.id));
    }

    if (weekStartDate) {
        conditions.push(eq(aiWeeklySummaries.weekStartDate, weekStartDate));
    }

    const [row] = await db
        .select()
        .from(aiWeeklySummaries)
        .where(and(...conditions))
        .orderBy(desc(aiWeeklySummaries.weekStartDate))
        .limit(1);

    if (!row) {
        return successResponse<AiWeeklySummaryResponse['data']>(null);
    }

    return successResponse<AiWeeklySummaryResponse['data']>({
        id: row.id,
        summaryType: row.summaryType as 'PERSONAL' | 'TEAM',
        weekStartDate: row.weekStartDate,
        weekEndDate: row.weekEndDate,
        summaryBody: row.summaryBody,
        modelId: row.modelId,
        generatedAt: row.generatedAt?.toISOString() ?? null,
    });
}
