import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@g-dx/database';
import { getDashboardAlertLarkChatId } from '@/modules/admin/infrastructure/app-settings-repository';
import { sendGroupMessage } from '@/lib/lark/larkMessaging';
import {
    aiWeeklySummaries,
    users,
    userBusinessMemberships,
    userRoleAssignments,
    roles,
    dealActivities,
    dealStageHistory,
    pipelineStages,
    deals,
    businessUnits,
    contractActivities,
    contracts,
} from '@g-dx/database/schema';
import { and, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';

/**
 * AI 週次サマリー生成 cron (v2)
 *
 * スケジュール: 毎週月曜 9:00 JST（UTC 0:00）→ vercel.json: "0 0 * * 1"
 *
 * 環境変数:
 *   CRON_SECRET              - エンドポイント保護
 *   ANTHROPIC_API_KEY        - Claude API キー
 *   AI_SUMMARY_MODEL         - 使用モデル（省略時: claude-haiku-4-5-20251001）
 *   AI_SUMMARY_PROMPT_VERSION - プロンプトバージョン管理用ラベル（省略時: v2）
 *
 * v2 変更点:
 *   - ロール別プロンプト: IS系 / TECH系 / 管理系
 *   - VIEWERはスキップ
 *   - 活動ログの summary 文言をプロンプトに含める
 *   - 先月比活動件数をコンテキストに追加
 *   - マークダウン出力禁止・3ブロック構成（先週実態/先月比/今週行動指針）
 *   - Lark送信: BUごとに1メッセージずつ送信
 *   - TECH: contractActivities も集計対象
 */

const PROMPT_VERSION = process.env.AI_SUMMARY_PROMPT_VERSION ?? 'v2';
const MODEL_ID = process.env.AI_SUMMARY_MODEL ?? 'claude-haiku-4-5-20251001';

// ─── ロール分類 ───────────────────────────────────────────────────────────────

type RoleGroup = 'IS' | 'TECH' | 'MANAGER' | 'SKIP';

/** ロールの優先度（複数ロール保持時は最高優先度で分類） */
const ROLE_PRIORITY: Record<string, number> = {
    SUPER_ADMIN: 3, ADMIN: 3, MANAGER: 3,
    TECH: 2,
    IS_MEMBER: 1, OPERATOR: 1,
    VIEWER: 0,
};

function classifyRoleGroup(roleCodes: string[]): RoleGroup {
    if (roleCodes.length === 0) return 'IS';
    const maxPriority = Math.max(...roleCodes.map(c => ROLE_PRIORITY[c] ?? 0));
    if (maxPriority >= 3) return 'MANAGER';
    if (maxPriority === 2) return 'TECH';
    if (maxPriority === 1) return 'IS';
    return 'SKIP'; // VIEWER のみ
}

// ─── 期間計算 ─────────────────────────────────────────────────────────────────

/** JST で先週の月〜日の範囲を返す */
function getLastWeekRange(): { startDate: string; endDate: string } {
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dayOfWeek = nowJst.getUTCDay(); // 0=Sun, 1=Mon
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

/** JST で先月の1日〜末日の範囲を返す */
function getLastMonthRange(): { startDate: string; endDate: string } {
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const year = nowJst.getUTCFullYear();
    const month = nowJst.getUTCMonth(); // 0-indexed
    const prevMonthStart = new Date(Date.UTC(year, month - 1, 1));
    const prevMonthEnd = new Date(Date.UTC(year, month, 0)); // 先月の末日
    return {
        startDate: prevMonthStart.toISOString().slice(0, 10),
        endDate: prevMonthEnd.toISOString().slice(0, 10),
    };
}

// ─── データ型 ─────────────────────────────────────────────────────────────────

interface DealActivityRow {
    activityType: string;
    activityDate: string;
    summary: string | null;
    dealTitle: string | null;
    isNegotiation: boolean;
    negotiationOutcome: string | null;
}

interface StageReachRow {
    stageKey: string;
    stageName: string;
    changedAt: string;
    dealTitle: string | null;
    amount: string | null;
}

interface ContractActivityRow {
    activityType: string;
    activityDate: string;
    summary: string | null;
    contractTitle: string | null;
}

// ─── データ取得 ───────────────────────────────────────────────────────────────

async function fetchDealActivities(
    userId: string,
    businessUnitId: string,
    startDate: string,
    endDate: string,
): Promise<DealActivityRow[]> {
    return db
        .select({
            activityType: dealActivities.activityType,
            activityDate: sql<string>`${dealActivities.activityDate}`,
            summary: dealActivities.summary,
            dealTitle: deals.title,
            isNegotiation: dealActivities.isNegotiation,
            negotiationOutcome: dealActivities.negotiationOutcome,
        })
        .from(dealActivities)
        .innerJoin(deals, and(eq(deals.id, dealActivities.dealId), isNull(deals.deletedAt)))
        .where(
            and(
                eq(dealActivities.userId, userId),
                eq(dealActivities.businessUnitId, businessUnitId),
                gte(dealActivities.activityDate, startDate),
                lte(dealActivities.activityDate, endDate),
            ),
        )
        .orderBy(desc(dealActivities.activityDate))
        .limit(30);
}

async function fetchStageReaches(
    userId: string,
    startDate: string,
    endDate: string,
): Promise<StageReachRow[]> {
    const rows = await db
        .select({
            stageKey: pipelineStages.stageKey,
            stageName: pipelineStages.name,
            changedAt: dealStageHistory.changedAt,
            dealTitle: deals.title,
            amount: deals.amount,
        })
        .from(dealStageHistory)
        .innerJoin(pipelineStages, eq(pipelineStages.id, dealStageHistory.toStageId))
        .innerJoin(deals, and(eq(deals.id, dealStageHistory.dealId), isNull(deals.deletedAt)))
        .where(
            and(
                eq(dealStageHistory.changedByUserId, userId),
                gte(dealStageHistory.changedAt, new Date(`${startDate}T00:00:00+09:00`)),
                lte(dealStageHistory.changedAt, new Date(`${endDate}T23:59:59+09:00`)),
            ),
        )
        .limit(20);

    return rows.map(r => ({
        stageKey: r.stageKey,
        stageName: r.stageName,
        changedAt: r.changedAt.toISOString().slice(0, 10),
        dealTitle: r.dealTitle,
        amount: r.amount,
    }));
}

async function fetchContractActivitiesForUser(
    userId: string,
    businessUnitId: string,
    startDate: string,
    endDate: string,
): Promise<ContractActivityRow[]> {
    return db
        .select({
            activityType: contractActivities.activityType,
            activityDate: sql<string>`${contractActivities.activityDate}`,
            summary: contractActivities.summary,
            contractTitle: contracts.title,
        })
        .from(contractActivities)
        .innerJoin(
            contracts,
            and(eq(contracts.id, contractActivities.contractId), isNull(contracts.deletedAt)),
        )
        .where(
            and(
                eq(contractActivities.userId, userId),
                eq(contractActivities.businessUnitId, businessUnitId),
                gte(contractActivities.activityDate, startDate),
                lte(contractActivities.activityDate, endDate),
            ),
        )
        .orderBy(desc(contractActivities.activityDate))
        .limit(20);
}

async function fetchLastMonthDealActivityCount(
    userId: string,
    businessUnitId: string,
): Promise<number> {
    const { startDate, endDate } = getLastMonthRange();
    const [row] = await db
        .select({ cnt: sql<number>`count(*)` })
        .from(dealActivities)
        .where(
            and(
                eq(dealActivities.userId, userId),
                eq(dealActivities.businessUnitId, businessUnitId),
                gte(dealActivities.activityDate, startDate),
                lte(dealActivities.activityDate, endDate),
            ),
        );
    return Number(row?.cnt ?? 0);
}

async function fetchLastMonthContractActivityCount(
    userId: string,
    businessUnitId: string,
): Promise<number> {
    const { startDate, endDate } = getLastMonthRange();
    const [row] = await db
        .select({ cnt: sql<number>`count(*)` })
        .from(contractActivities)
        .where(
            and(
                eq(contractActivities.userId, userId),
                eq(contractActivities.businessUnitId, businessUnitId),
                gte(contractActivities.activityDate, startDate),
                lte(contractActivities.activityDate, endDate),
            ),
        );
    return Number(row?.cnt ?? 0);
}

async function fetchOpenDealsCount(
    userId: string,
    businessUnitId: string,
): Promise<number> {
    const [row] = await db
        .select({ cnt: sql<number>`count(*)` })
        .from(deals)
        .where(
            and(
                eq(deals.ownerUserId, userId),
                eq(deals.businessUnitId, businessUnitId),
                eq(deals.dealStatus, 'open'),
                isNull(deals.deletedAt),
            ),
        );
    return Number(row?.cnt ?? 0);
}

// ─── プロンプト共通ルール ────────────────────────────────────────────────────

const OUTPUT_RULES = [
    '【出力ルール・必ず守ること】',
    '・マークダウン記号（# ## * ** _ ` > --- など）を一切使わないこと',
    '・箇条書きは全角「・」のみ使用すること',
    '・フォントの装飾（太字・斜体など）は一切しないこと',
    '・見出しは「先週の実態」「先月比トレンド」「今週の行動指針」の3ブロックで、',
    '  各ブロックの頭にそのラベルを置くこと',
    '・全体250〜350字の日本語',
    '・断定的でドラスティックな表現を使うこと。「〜かもしれません」などの曖昧表現は禁止',
].join('\n');

// ─── ロール別プロンプト ────────────────────────────────────────────────────

function buildISPrompt(
    userName: string,
    weekRange: string,
    activities: DealActivityRow[],
    stageReaches: StageReachRow[],
    openDealsCount: number,
    lastMonthCount: number,
): string {
    const activityLines = activities.length === 0
        ? '活動記録なし'
        : activities.map(a => {
            const negotiation = a.isNegotiation
                ? `（商談: ${a.negotiationOutcome ?? '結果未記録'}）`
                : '';
            const summary = a.summary ? ` → ${a.summary}` : '';
            return `・[${a.activityDate}] ${a.activityType}${negotiation}: ${a.dealTitle ?? '（案件なし）'}${summary}`;
        }).join('\n');

    const stageLines = stageReaches.length === 0
        ? 'ステージ変化なし'
        : stageReaches.map(s => {
            const amt = s.amount ? ` ${Number(s.amount).toLocaleString()}円` : '';
            return `・${s.changedAt} ${s.stageName}（${s.stageKey}）: ${s.dealTitle ?? '（案件なし）'}${amt}`;
        }).join('\n');

    const weekAvg = lastMonthCount > 0 ? (lastMonthCount / 4).toFixed(1) : '0';

    return `あなたはスパルタ式の営業マネージャーです。以下のデータをもとに、${userName}さん（IS担当）への週次フィードバックを作成してください。

${OUTPUT_RULES}

【対象者】${userName}（IS担当）
【期間】先週: ${weekRange}
【オープン案件数】現在${openDealsCount}件
【先月の活動件数】${lastMonthCount}件（週平均 ${weekAvg}件）

【先週の活動ログ】
${activityLines}

【先週のステージ遷移】
${stageLines}`;
}

function buildTechPrompt(
    userName: string,
    weekRange: string,
    dealActs: DealActivityRow[],
    contractActs: ContractActivityRow[],
    lastMonthCount: number,
): string {
    const dealLines = dealActs.length === 0
        ? '案件活動記録なし'
        : dealActs.map(a => {
            const summary = a.summary ? ` → ${a.summary}` : '';
            return `・[${a.activityDate}] ${a.activityType}: ${a.dealTitle ?? '（案件なし）'}${summary}`;
        }).join('\n');

    const contractLines = contractActs.length === 0
        ? '契約サポート活動記録なし'
        : contractActs.map(a => {
            const summary = a.summary ? ` → ${a.summary}` : '';
            return `・[${a.activityDate}] ${a.activityType}: ${a.contractTitle ?? '（契約なし）'}${summary}`;
        }).join('\n');

    const totalLastWeek = dealActs.length + contractActs.length;
    const weekAvg = lastMonthCount > 0 ? (lastMonthCount / 4).toFixed(1) : '0';

    return `あなたは現場叩き上げのプロジェクトマネージャーです。以下のデータをもとに、${userName}さん（技術担当）への週次フィードバックを作成してください。

${OUTPUT_RULES}

データが少ない場合でも、ある情報から最大限の示唆を導き出してください。

【対象者】${userName}（TECH担当）
【期間】先週: ${weekRange}
【先週の活動合計】${totalLastWeek}件（案件${dealActs.length}件・契約サポート${contractActs.length}件）
【先月の合計活動件数】${lastMonthCount}件（週平均 ${weekAvg}件）

【先週の案件活動ログ】
${dealLines}

【先週の契約サポート活動ログ】
${contractLines}`;
}

function buildManagerPrompt(
    userName: string,
    weekRange: string,
    activities: DealActivityRow[],
    stageReaches: StageReachRow[],
    openDealsCount: number,
    lastMonthCount: number,
): string {
    const activityLines = activities.length === 0
        ? '活動記録なし'
        : activities.map(a => {
            const negotiation = a.isNegotiation
                ? `（商談: ${a.negotiationOutcome ?? '結果未記録'}）`
                : '';
            const summary = a.summary ? ` → ${a.summary}` : '';
            return `・[${a.activityDate}] ${a.activityType}${negotiation}: ${a.dealTitle ?? '（案件なし）'}${summary}`;
        }).join('\n');

    const stageLines = stageReaches.length === 0
        ? 'ステージ関与なし'
        : stageReaches.map(s => {
            const amt = s.amount ? ` ${Number(s.amount).toLocaleString()}円` : '';
            return `・${s.changedAt} ${s.stageName}: ${s.dealTitle ?? '（案件なし）'}${amt}`;
        }).join('\n');

    const weekAvg = lastMonthCount > 0 ? (lastMonthCount / 4).toFixed(1) : '0';

    return `あなたは鋭いビジネス視点を持つ経営コンサルタントです。以下のデータをもとに、${userName}さん（管理職）への週次フィードバックを作成してください。

${OUTPUT_RULES}

「自分の動きがチームに与える影響」と「自分がボトルネックになっていないか」の視点を必ず盛り込んでください。

【対象者】${userName}（管理職）
【期間】先週: ${weekRange}
【自担当オープン案件数】現在${openDealsCount}件
【先月の活動件数】${lastMonthCount}件（週平均 ${weekAvg}件）

【先週の活動ログ】
${activityLines}

【先週のステージ関与】
${stageLines}`;
}

function buildTeamPrompt(
    buName: string,
    weekRange: string,
    memberStats: { name: string; roleGroup: RoleGroup; activityCount: number; stageCount: number }[],
    lastMonthTeamCount: number,
): string {
    const memberLines = memberStats.length === 0
        ? 'メンバーデータなし'
        : memberStats.map(m => {
            const role = m.roleGroup === 'MANAGER' ? '管理職' : m.roleGroup === 'TECH' ? 'TECH' : 'IS';
            return `・${m.name}（${role}）: 活動${m.activityCount}件、ステージ遷移${m.stageCount}件`;
        }).join('\n');

    const weekAvg = lastMonthTeamCount > 0 ? (lastMonthTeamCount / 4).toFixed(1) : '0';

    return `あなたは厳しくも的確な営業本部長です。以下のデータをもとに、${buName}チーム全体の週次サマリーを作成してください。

${OUTPUT_RULES}

チームの傾向、際立った動きを言及し、今週のチームへの指針を断言してください。

【チーム】${buName}
【期間】先週: ${weekRange}
【先月のチーム活動合計】${lastMonthTeamCount}件（週平均 ${weekAvg}件）

【メンバー別実績（先週）】
${memberLines}`;
}

// ─── メインハンドラ ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate } = getLastWeekRange();
    const weekRange = `${startDate} 〜 ${endDate}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const allBusinessUnits = await db
        .select({ id: businessUnits.id, name: businessUnits.name, code: businessUnits.code })
        .from(businessUnits)
        .where(eq(businessUnits.isActive, true));

    const results: { type: string; id: string; status: 'completed' | 'skipped' | 'failed'; error?: string }[] = [];

    for (const bu of allBusinessUnits) {
        // ── アクティブメンバー取得 ──────────────────────────────────────
        const members = await db
            .select({ id: users.id, displayName: users.displayName })
            .from(userBusinessMemberships)
            .innerJoin(users, and(eq(users.id, userBusinessMemberships.userId), isNull(users.deletedAt)))
            .where(
                and(
                    eq(userBusinessMemberships.businessUnitId, bu.id),
                    eq(userBusinessMemberships.membershipStatus, 'active'),
                ),
            );

        if (members.length === 0) continue;

        // ── 全メンバーのロールを一括取得 ──────────────────────────────
        const memberIds = members.map(m => m.id);
        const roleRows = await db
            .select({ userId: userRoleAssignments.userId, roleCode: roles.code })
            .from(userRoleAssignments)
            .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
            .where(inArray(userRoleAssignments.userId, memberIds));

        const rolesByUser = new Map<string, string[]>();
        for (const r of roleRows) {
            const existing = rolesByUser.get(r.userId) ?? [];
            existing.push(r.roleCode);
            rolesByUser.set(r.userId, existing);
        }

        // ── 個人サマリー生成 ───────────────────────────────────────────
        const teamMemberStats: { name: string; roleGroup: RoleGroup; activityCount: number; stageCount: number }[] = [];
        let lastMonthTeamCount = 0;

        for (const member of members) {
            const roleCodes = rolesByUser.get(member.id) ?? [];
            const roleGroup = classifyRoleGroup(roleCodes);

            if (roleGroup === 'SKIP') {
                results.push({ type: 'PERSONAL', id: member.id, status: 'skipped' });
                continue;
            }

            // 冪等チェック
            const [existing] = await db
                .select({ id: aiWeeklySummaries.id })
                .from(aiWeeklySummaries)
                .where(
                    and(
                        eq(aiWeeklySummaries.summaryType, 'PERSONAL'),
                        eq(aiWeeklySummaries.targetUserId, member.id),
                        eq(aiWeeklySummaries.weekStartDate, startDate),
                        eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
                    ),
                )
                .limit(1);

            if (existing) {
                results.push({ type: 'PERSONAL', id: member.id, status: 'skipped' });
                // チーム集計用のデータは取得しておく（スキップでも）
                const prevActs = await fetchDealActivities(member.id, bu.id, startDate, endDate);
                const prevStages = await fetchStageReaches(member.id, startDate, endDate);
                teamMemberStats.push({
                    name: member.displayName ?? member.id,
                    roleGroup,
                    activityCount: prevActs.length,
                    stageCount: prevStages.length,
                });
                continue;
            }

            // PENDING レコード挿入
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
                // データ取得（ロールに応じて並行フェッチ）
                let prompt: string;

                if (roleGroup === 'TECH') {
                    const [dealActs, contractActs, lastMonthCount] = await Promise.all([
                        fetchDealActivities(member.id, bu.id, startDate, endDate),
                        fetchContractActivitiesForUser(member.id, bu.id, startDate, endDate),
                        fetchLastMonthContractActivityCount(member.id, bu.id),
                    ]);

                    teamMemberStats.push({
                        name: member.displayName ?? member.id,
                        roleGroup,
                        activityCount: dealActs.length + contractActs.length,
                        stageCount: 0,
                    });
                    lastMonthTeamCount += lastMonthCount;

                    prompt = buildTechPrompt(
                        member.displayName ?? 'あなた',
                        weekRange,
                        dealActs,
                        contractActs,
                        lastMonthCount,
                    );
                } else {
                    // IS / MANAGER 共通データ取得
                    const [dealActs, stageReaches, openDealsCount, lastMonthCount] = await Promise.all([
                        fetchDealActivities(member.id, bu.id, startDate, endDate),
                        fetchStageReaches(member.id, startDate, endDate),
                        fetchOpenDealsCount(member.id, bu.id),
                        fetchLastMonthDealActivityCount(member.id, bu.id),
                    ]);

                    teamMemberStats.push({
                        name: member.displayName ?? member.id,
                        roleGroup,
                        activityCount: dealActs.length,
                        stageCount: stageReaches.length,
                    });
                    lastMonthTeamCount += lastMonthCount;

                    if (roleGroup === 'MANAGER') {
                        prompt = buildManagerPrompt(
                            member.displayName ?? 'あなた',
                            weekRange,
                            dealActs,
                            stageReaches,
                            openDealsCount,
                            lastMonthCount,
                        );
                    } else {
                        prompt = buildISPrompt(
                            member.displayName ?? 'あなた',
                            weekRange,
                            dealActs,
                            stageReaches,
                            openDealsCount,
                            lastMonthCount,
                        );
                    }
                }

                const response = await anthropic.messages.create({
                    model: MODEL_ID,
                    max_tokens: 600,
                    messages: [{ role: 'user', content: prompt }],
                });

                const summaryBody = response.content
                    .filter(c => c.type === 'text')
                    .map(c => (c as { type: 'text'; text: string }).text)
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

        // ── チームサマリー生成 ──────────────────────────────────────────
        const [existingTeam] = await db
            .select({ id: aiWeeklySummaries.id })
            .from(aiWeeklySummaries)
            .where(
                and(
                    eq(aiWeeklySummaries.summaryType, 'TEAM'),
                    eq(aiWeeklySummaries.businessUnitId, bu.id),
                    eq(aiWeeklySummaries.weekStartDate, startDate),
                    eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
                ),
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
            const teamPrompt = buildTeamPrompt(bu.name, weekRange, teamMemberStats, lastMonthTeamCount);

            const teamResponse = await anthropic.messages.create({
                model: MODEL_ID,
                max_tokens: 600,
                messages: [{ role: 'user', content: teamPrompt }],
            });

            const teamSummaryBody = teamResponse.content
                .filter(c => c.type === 'text')
                .map(c => (c as { type: 'text'; text: string }).text)
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

    // ── Lark 送信: BUごとに1メッセージずつ ─────────────────────────────
    try {
        // app_settings テーブルが未マイグレーションの場合は null を返してフォールバック
        const dbChatId = await getDashboardAlertLarkChatId().catch(() => null);
        const chatId = dbChatId ?? process.env.LARK_ALERT_GROUP_CHAT_ID ?? null;

        if (chatId) {
            // BU順に1件ずつ取得して送信
            const completedTeamSummaries = await db
                .select({
                    buName: businessUnits.name,
                    summaryBody: aiWeeklySummaries.summaryBody,
                })
                .from(aiWeeklySummaries)
                .innerJoin(businessUnits, eq(businessUnits.id, aiWeeklySummaries.businessUnitId))
                .where(
                    and(
                        eq(aiWeeklySummaries.summaryType, 'TEAM'),
                        eq(aiWeeklySummaries.weekStartDate, startDate),
                        eq(aiWeeklySummaries.generationStatus, 'COMPLETED'),
                        isNull(aiWeeklySummaries.targetUserId),
                    ),
                )
                .orderBy(businessUnits.sortOrder, businessUnits.name);

            for (const s of completedTeamSummaries) {
                const message = [
                    `【AI週次サマリー】${weekRange}`,
                    `${s.buName}`,
                    '==============================',
                    '',
                    s.summaryBody ?? '（サマリーなし）',
                ].join('\n');

                await sendGroupMessage(chatId, message);
                console.log(`[cron/ai-weekly-summary] Lark送信完了: ${s.buName}`);
            }
        }
    } catch (err) {
        console.error('[cron/ai-weekly-summary] Lark送信エラー:', err);
    }

    const summary = {
        week: weekRange,
        promptVersion: PROMPT_VERSION,
        completed: results.filter(r => r.status === 'completed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
    };

    console.log('[cron/ai-weekly-summary] 完了:', JSON.stringify(summary, null, 2));
    return NextResponse.json(summary);
}
