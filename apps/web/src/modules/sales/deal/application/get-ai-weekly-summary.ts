import { db } from '@g-dx/database';
import { aiWeeklySummaries } from '@g-dx/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { BusinessScopeType } from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { assertPermission } from '@/shared/server/authorization';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';

export interface AiWeeklySummaryData {
    id: string;
    summaryType: 'PERSONAL' | 'TEAM';
    weekStartDate: string;
    weekEndDate: string;
    summaryBody: string | null;
    generatedAt: string | null;
}

/** 最新の TEAM サマリーを返す。ない場合は null。 */
export async function getTeamAiWeeklySummary(overrideScope?: BusinessScopeType): Promise<AiWeeklySummaryData | null> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'dashboard.kpi.read');

    const scope = overrideScope ?? session.activeBusinessScope;
    const bu = await findBusinessUnitByScope(scope);
    if (!bu) return null;

    const [row] = await db
        .select()
        .from(aiWeeklySummaries)
        .where(
            and(
                eq(aiWeeklySummaries.summaryType, 'TEAM'),
                eq(aiWeeklySummaries.businessUnitId, bu.id),
                eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
            ),
        )
        .orderBy(desc(aiWeeklySummaries.weekStartDate))
        .limit(1);

    if (!row) return null;

    return {
        id: row.id,
        summaryType: 'TEAM',
        weekStartDate: row.weekStartDate,
        weekEndDate: row.weekEndDate ?? '',
        summaryBody: row.summaryBody,
        generatedAt: row.generatedAt?.toISOString() ?? null,
    };
}

/** 最新の PERSONAL サマリーを返す。targetUserId 省略時はログインユーザー。 */
export async function getPersonalAiWeeklySummary(
    targetUserId?: string,
): Promise<AiWeeklySummaryData | null> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'dashboard.kpi.read');

    const userId = targetUserId ?? session.user.id;

    const [row] = await db
        .select()
        .from(aiWeeklySummaries)
        .where(
            and(
                eq(aiWeeklySummaries.summaryType, 'PERSONAL'),
                eq(aiWeeklySummaries.targetUserId, userId),
                eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
            ),
        )
        .orderBy(desc(aiWeeklySummaries.weekStartDate))
        .limit(1);

    if (!row) return null;

    return {
        id: row.id,
        summaryType: 'PERSONAL',
        weekStartDate: row.weekStartDate,
        weekEndDate: row.weekEndDate ?? '',
        summaryBody: row.summaryBody,
        generatedAt: row.generatedAt?.toISOString() ?? null,
    };
}
