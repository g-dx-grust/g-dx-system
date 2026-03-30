import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@g-dx/database';
import {
    aiWeeklySummaries,
    users,
    userBusinessMemberships,
    dealActivities,
    dealStageHistory,
    pipelineStages,
    deals,
    businessUnits,
} from '@g-dx/database/schema';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';

/**
 * AI 週次サマリー生成 cron
 *
 * スケジュール: 毎週日曜 22:00 JST（UTC 13:00）→ vercel.json: "0 13 * * 0"
 *
 * 環境変数:
 *   CRON_SECRET          - エンドポイント保護
 *   ANTHROPIC_API_KEY    - Claude API キー
 *   AI_SUMMARY_MODEL     - 使用モデル（省略時: claude-haiku-4-5-20251001）
 *   AI_SUMMARY_PROMPT_VERSION - プロンプトバージョン管理用ラベル（省略時: v1）
 *
 * 処理フロー:
 *   1. 先週（月〜日）の期間を JST で計算
 *   2. 全事業部 × 全アクティブメンバーの週次活動データを収集
 *   3. PERSONAL サマリーを生成（メンバー1人ずつ）
 *   4. TEAM サマリーを生成（事業部ごと）
 *   5. ai_weekly_summaries テーブルに保存
 *
 * 失敗時:
 *   - generationStatus = 'FAILED', errorMessage に詳細を記録
 *   - retryCount をインクリメント（再実行時に使用）
 *   - 既に COMPLETED のレコードがあれば skip（冪等）
 */

const MAX_RETRY = 3;
const PROMPT_VERSION = process.env.AI_SUMMARY_PROMPT_VERSION ?? 'v1';
const MODEL_ID = process.env.AI_SUMMARY_MODEL ?? 'claude-haiku-4-5-20251001';

/** JST で先週の月〜日の範囲を返す */
function getLastWeekRange(): { startDate: string; endDate: string } {
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dayOfWeek = nowJst.getUTCDay(); // 0=Sun, 1=Mon
    // 今週月曜の JST 日付を計算
    const daysToLastMonday = dayOfWeek === 0 ? 13 : dayOfWeek + 6;
    const lastMonday = new Date(nowJst);
    lastMonday.setUTCDate(nowJst.getUTCDate() - daysToLastMonday);
    const lastSunday = new Date(lastMonday);
    lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);

    return {
        startDate: lastMonday.toISOString().slice(0, 10),
        endDate: lastSunday.toISOString().slice(0, 10),
    };
}

interface ActivityRow {
    activityType: string;
    activityDate: string;
    summary: string | null;
    dealTitle: string | null;
    companyName: string | null;
}

interface StageReachRow {
    stageKey: string;
    stageName: string;
    changedAt: string;
    dealTitle: string | null;
    companyName: string | null;
}

async function fetchPersonalActivity(
    userId: string,
    businessUnitId: string,
    startDate: string,
    endDate: string
): Promise<{ activities: ActivityRow[]; stageReaches: StageReachRow[] }> {
    const activities = await db
        .select({
            activityType: sql<string>`${dealActivities.activityType}`,
            activityDate: sql<string>`${dealActivities.activityDate}`,
            summary: sql<string | null>`${dealActivities.summary}`,
            dealTitle: sql<string | null>`${deals.title}`,
            companyName: sql<string | null>`null`,
        })
        .from(dealActivities)
        .innerJoin(deals, and(eq(deals.id, dealActivities.dealId), isNull(deals.deletedAt)))
        .where(
            and(
                eq(dealActivities.userId, userId),
                eq(dealActivities.businessUnitId, businessUnitId),
                gte(dealActivities.activityDate, startDate),
                lte(dealActivities.activityDate, endDate),
            )
        )
        .orderBy(desc(dealActivities.activityDate))
        .limit(50);

    const stageReaches = await db
        .select({
            stageKey: sql<string>`${pipelineStages.stageKey}`,
            stageName: sql<string>`${pipelineStages.name}`,
            changedAt: sql<Date>`${dealStageHistory.changedAt}`,
            dealTitle: sql<string | null>`${deals.title}`,
            companyName: sql<string | null>`null`,
        })
        .from(dealStageHistory)
        .innerJoin(pipelineStages, eq(pipelineStages.id, dealStageHistory.toStageId))
        .innerJoin(deals, and(eq(deals.id, dealStageHistory.dealId), isNull(deals.deletedAt)))
        .where(
            and(
                eq(dealStageHistory.changedByUserId, userId),
                gte(dealStageHistory.changedAt, new Date(`${startDate}T00:00:00+09:00`)),
                lte(dealStageHistory.changedAt, new Date(`${endDate}T23:59:59+09:00`)),
            )
        )
        .limit(20);

    return {
        activities: activities.map((a) => ({
            activityType: a.activityType,
            activityDate: a.activityDate,
            summary: a.summary,
            dealTitle: a.dealTitle,
            companyName: a.companyName,
        })),
        stageReaches: stageReaches.map((s) => ({
            stageKey: s.stageKey,
            stageName: s.stageName,
            changedAt: s.changedAt.toISOString(),
            dealTitle: s.dealTitle,
            companyName: s.companyName,
        })),
    };
}

function buildPersonalPrompt(
    userName: string,
    weekRange: string,
    activities: ActivityRow[],
    stageReaches: StageReachRow[]
): string {
    const activitySummary = activities.length === 0
        ? '活動記録なし'
        : activities.map((a) =>
            `- [${a.activityDate}] ${a.activityType}: ${a.dealTitle ?? '（案件なし）'} — ${a.summary ?? ''}`
        ).join('\n');

    const stageSummary = stageReaches.length === 0
        ? 'ステージ遷移なし'
        : stageReaches.map((s) =>
            `- ${s.stageName}（${s.stageKey}）: ${s.dealTitle ?? '（案件なし）'} ${s.changedAt.slice(0, 10)}`
        ).join('\n');

    return `あなたは営業マネージャーです。以下の先週（${weekRange}）の活動記録をもとに、${userName} さんへの週次フィードバックを200〜300字程度の日本語で作成してください。

良かった点、改善できる点、今週の注力アドバイスを含めてください。

【活動ログ】
${activitySummary}

【ステージ遷移】
${stageSummary}

---
簡潔に、具体的に、励みになる表現で書いてください。`;
}

function buildTeamPrompt(
    buName: string,
    weekRange: string,
    memberSummaries: { name: string; activityCount: number; contractCount: number }[]
): string {
    const memberLines = memberSummaries.map((m) =>
        `- ${m.name}: 活動${m.activityCount}件、契約${m.contractCount}件`
    ).join('\n');

    return `あなたは営業マネージャーです。以下の先週（${weekRange}）の${buName}チーム全体の実績を200〜300字程度の日本語でまとめてください。

チームの傾向、際立った動きがあれば言及し、今週への引き継ぎメッセージを含めてください。

【メンバー別実績】
${memberLines}

---
簡潔に、データに基づいて書いてください。`;
}

export async function GET(req: NextRequest) {
    // cron エンドポイント保護
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate } = getLastWeekRange();
    const weekRange = `${startDate} 〜 ${endDate}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 全事業部を取得
    const allBusinessUnits = await db
        .select({ id: businessUnits.id, name: businessUnits.name, code: businessUnits.code })
        .from(businessUnits)
        .where(eq(businessUnits.isActive, true));

    const results: { type: string; id: string; status: 'completed' | 'skipped' | 'failed'; error?: string }[] = [];

    for (const bu of allBusinessUnits) {
        // アクティブメンバーを取得
        const members = await db
            .select({ id: users.id, displayName: users.displayName })
            .from(userBusinessMemberships)
            .innerJoin(users, and(eq(users.id, userBusinessMemberships.userId), isNull(users.deletedAt)))
            .where(
                and(
                    eq(userBusinessMemberships.businessUnitId, bu.id),
                    eq(userBusinessMemberships.membershipStatus, 'active'),
                )
            );

        const teamMemberSummaries: { name: string; activityCount: number; contractCount: number }[] = [];

        for (const member of members) {
            // 冪等チェック: 既に COMPLETED のレコードがあれば skip
            const [existing] = await db
                .select({ id: aiWeeklySummaries.id, retryCount: aiWeeklySummaries.retryCount })
                .from(aiWeeklySummaries)
                .where(
                    and(
                        eq(aiWeeklySummaries.summaryType, 'PERSONAL'),
                        eq(aiWeeklySummaries.targetUserId, member.id),
                        eq(aiWeeklySummaries.weekStartDate, startDate),
                        eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
                    )
                )
                .limit(1);

            if (existing) {
                results.push({ type: 'PERSONAL', id: member.id, status: 'skipped' });
                continue;
            }

            // PENDING レコードを upsert（retry 時は retryCount を増やす）
            const [pendingRow] = await db
                .insert(aiWeeklySummaries)
                .values({
                    summaryType: 'PERSONAL',
                    businessUnitId: bu.id,
                    targetUserId: member.id,
                    weekStartDate: startDate,
                    weekEndDate: endDate,
                    generationStatus: 'PENDING',
                    modelId: MODEL_ID,
                    promptVersion: PROMPT_VERSION,
                })
                .onConflictDoNothing()
                .returning({ id: aiWeeklySummaries.id });

            const rowId = pendingRow?.id;

            try {
                const { activities, stageReaches } = await fetchPersonalActivity(
                    member.id, bu.id, startDate, endDate
                );

                teamMemberSummaries.push({
                    name: member.displayName ?? member.id,
                    activityCount: activities.length,
                    contractCount: stageReaches.filter((s) => s.stageKey === 'CONTRACTED').length,
                });

                const prompt = buildPersonalPrompt(
                    member.displayName ?? 'あなた',
                    weekRange,
                    activities,
                    stageReaches
                );

                const response = await anthropic.messages.create({
                    model: MODEL_ID,
                    max_tokens: 512,
                    messages: [{ role: 'user', content: prompt }],
                });

                const summaryBody = response.content
                    .filter((c) => c.type === 'text')
                    .map((c) => (c as { type: 'text'; text: string }).text)
                    .join('');

                if (rowId) {
                    await db
                        .update(aiWeeklySummaries)
                        .set({
                            summaryBody,
                            generationStatus: 'COMPLETED',
                            generatedAt: new Date(),
                            inputTokens: response.usage.input_tokens,
                            outputTokens: response.usage.output_tokens,
                            updatedAt: new Date(),
                        })
                        .where(eq(aiWeeklySummaries.id, rowId));
                }

                results.push({ type: 'PERSONAL', id: member.id, status: 'completed' });
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error(`[cron/ai-weekly-summary] PERSONAL failed for user ${member.id}:`, errMsg);

                if (rowId) {
                    await db
                        .update(aiWeeklySummaries)
                        .set({
                            generationStatus: 'FAILED',
                            errorMessage: errMsg.slice(0, 500),
                            retryCount: 1,
                            updatedAt: new Date(),
                        })
                        .where(eq(aiWeeklySummaries.id, rowId));
                }

                results.push({ type: 'PERSONAL', id: member.id, status: 'failed', error: errMsg });
            }
        }

        // TEAM サマリー
        const [existingTeam] = await db
            .select({ id: aiWeeklySummaries.id })
            .from(aiWeeklySummaries)
            .where(
                and(
                    eq(aiWeeklySummaries.summaryType, 'TEAM'),
                    eq(aiWeeklySummaries.businessUnitId, bu.id),
                    eq(aiWeeklySummaries.weekStartDate, startDate),
                    eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
                )
            )
            .limit(1);

        if (existingTeam) {
            results.push({ type: 'TEAM', id: bu.id, status: 'skipped' });
            continue;
        }

        const [teamPendingRow] = await db
            .insert(aiWeeklySummaries)
            .values({
                summaryType: 'TEAM',
                businessUnitId: bu.id,
                weekStartDate: startDate,
                weekEndDate: endDate,
                generationStatus: 'PENDING',
                modelId: MODEL_ID,
                promptVersion: PROMPT_VERSION,
            })
            .onConflictDoNothing()
            .returning({ id: aiWeeklySummaries.id });

        const teamRowId = teamPendingRow?.id;

        try {
            const teamPrompt = buildTeamPrompt(bu.name, weekRange, teamMemberSummaries);

            const teamResponse = await anthropic.messages.create({
                model: MODEL_ID,
                max_tokens: 512,
                messages: [{ role: 'user', content: teamPrompt }],
            });

            const teamSummaryBody = teamResponse.content
                .filter((c) => c.type === 'text')
                .map((c) => (c as { type: 'text'; text: string }).text)
                .join('');

            if (teamRowId) {
                await db
                    .update(aiWeeklySummaries)
                    .set({
                        summaryBody: teamSummaryBody,
                        generationStatus: 'COMPLETED',
                        generatedAt: new Date(),
                        inputTokens: teamResponse.usage.input_tokens,
                        outputTokens: teamResponse.usage.output_tokens,
                        updatedAt: new Date(),
                    })
                    .where(eq(aiWeeklySummaries.id, teamRowId));
            }

            results.push({ type: 'TEAM', id: bu.id, status: 'completed' });
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`[cron/ai-weekly-summary] TEAM failed for BU ${bu.id}:`, errMsg);

            if (teamRowId) {
                await db
                    .update(aiWeeklySummaries)
                    .set({
                        generationStatus: 'FAILED',
                        errorMessage: errMsg.slice(0, 500),
                        retryCount: 1,
                        updatedAt: new Date(),
                    })
                    .where(eq(aiWeeklySummaries.id, teamRowId));
            }

            results.push({ type: 'TEAM', id: bu.id, status: 'failed', error: errMsg });
        }
    }

    const summary = {
        week: weekRange,
        completed: results.filter((r) => r.status === 'completed').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
        failed: results.filter((r) => r.status === 'failed').length,
        results,
    };

    console.log('[cron/ai-weekly-summary] 完了:', JSON.stringify(summary, null, 2));

    return NextResponse.json(summary);
}
