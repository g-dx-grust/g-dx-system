import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Role, BusinessScope } from '@g-dx/contracts';
import type {
    BusinessScopeType,
    DealDashboardSummary,
    DealOwnerStat,
    DealStageSummary,
    DealCompanyStat,
    DealNextActionItem,
    SalesRollingKpiGrid,
    SalesRollingKpiColumn,
} from '@g-dx/contracts';

import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getExcludedMemberIds } from '@/modules/sales/deal/application/get-activity-member-ids';
import { getMonthlyActivityStats } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { getPersonalActionList } from '@/modules/sales/deal/application/get-personal-action-list';
import { getPersonalDashboardData } from '@/modules/sales/deal/application/get-personal-dashboard-data';
import { getRollingKpi } from '@/modules/sales/deal/application/get-rolling-kpi';
import { getTeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { getTeamAiWeeklySummary } from '@/modules/sales/deal/application/get-ai-weekly-summary';
import type { TeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { NextActionList } from '@/modules/sales/deal/ui/next-action-list';
import { ActivityDashboard } from '@/modules/sales/deal/ui/dashboard-activity';
import { SalesKpiDashboard } from '@/modules/sales/deal/ui/sales-kpi-dashboard';
import { AiSummaryCard, TeamTargetOverview } from '@/modules/sales/deal/ui/dashboard-primitives';
import { AllMembersActivitySection } from '@/modules/sales/deal/ui/all-members-activity-section';
import type { MemberActivityData } from '@/modules/sales/deal/ui/all-members-activity-section';
import { DashboardScopeTabs } from '@/modules/sales/deal/ui/dashboard-scope-tabs';
import type { DashboardTabKey } from '@/modules/sales/deal/ui/dashboard-scope-tabs';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';

// ─── マージユーティリティ ──────────────────────────────────────────────────────

function mergeDashboardSummaries(
    a: DealDashboardSummary,
    b: DealDashboardSummary,
): DealDashboardSummary {
    // byOwner: userId でマージ・合算
    const ownerMap = new Map<string, DealOwnerStat>();
    for (const owner of [...a.byOwner, ...b.byOwner]) {
        const existing = ownerMap.get(owner.ownerUserId);
        if (!existing) {
            ownerMap.set(owner.ownerUserId, { ...owner });
        } else {
            ownerMap.set(owner.ownerUserId, {
                ...existing,
                totalDeals: existing.totalDeals + owner.totalDeals,
                activeDeals: existing.activeDeals + owner.activeDeals,
                contractedDeals: existing.contractedDeals + owner.contractedDeals,
                totalAmount: existing.totalAmount + owner.totalAmount,
            });
        }
    }

    // byStage: stageKey でマージ・合算
    const stageMap = new Map<string, DealStageSummary>();
    for (const stage of [...a.byStage, ...b.byStage]) {
        const existing = stageMap.get(stage.stageKey);
        if (!existing) {
            stageMap.set(stage.stageKey, { ...stage });
        } else {
            stageMap.set(stage.stageKey, {
                ...existing,
                count: existing.count + stage.count,
                totalAmount: existing.totalAmount + stage.totalAmount,
            });
        }
    }

    // byCompany: companyId でマージ・合算
    const companyMap = new Map<string, DealCompanyStat>();
    for (const company of [...a.byCompany, ...b.byCompany]) {
        const existing = companyMap.get(company.companyId);
        if (!existing) {
            companyMap.set(company.companyId, { ...company });
        } else {
            companyMap.set(company.companyId, {
                ...existing,
                totalDeals: existing.totalDeals + company.totalDeals,
                activeDeals: existing.activeDeals + company.activeDeals,
                totalAmount: existing.totalAmount + company.totalAmount,
            });
        }
    }

    const sortByDate = (x: DealNextActionItem, y: DealNextActionItem) =>
        x.nextActionDate > y.nextActionDate ? 1 : -1;

    return {
        totalDeals: a.totalDeals + b.totalDeals,
        activeGroup: {
            count: a.activeGroup.count + b.activeGroup.count,
            totalAmount: a.activeGroup.totalAmount + b.activeGroup.totalAmount,
        },
        stalledGroup: {
            count: a.stalledGroup.count + b.stalledGroup.count,
            totalAmount: a.stalledGroup.totalAmount + b.stalledGroup.totalAmount,
        },
        contractedGroup: {
            count: a.contractedGroup.count + b.contractedGroup.count,
            totalAmount: a.contractedGroup.totalAmount + b.contractedGroup.totalAmount,
        },
        byStage: Array.from(stageMap.values()),
        byOwner: Array.from(ownerMap.values()).sort(
            (x, y) => y.totalDeals - x.totalDeals || y.totalAmount - x.totalAmount,
        ),
        byCompany: Array.from(companyMap.values())
            .sort((x, y) => y.totalAmount - x.totalAmount)
            .slice(0, 10),
        nextActionsToday: [...a.nextActionsToday, ...b.nextActionsToday].sort(sortByDate),
        nextActionsTomorrow: [...a.nextActionsTomorrow, ...b.nextActionsTomorrow].sort(sortByDate),
        nextActionsThisWeek: [...a.nextActionsThisWeek, ...b.nextActionsThisWeek].sort(sortByDate),
    };
}

function mergeTeamKpiSummaries(
    a: TeamKpiTargetSummary,
    b: TeamKpiTargetSummary,
): TeamKpiTargetSummary {
    return {
        targetMonth: a.targetMonth,
        activeMemberCount: a.activeMemberCount + b.activeMemberCount,
        membersWithTargetsCount: a.membersWithTargetsCount + b.membersWithTargetsCount,
        totals: {
            callTarget: a.totals.callTarget + b.totals.callTarget,
            visitTarget: a.totals.visitTarget + b.totals.visitTarget,
            newVisitTarget: a.totals.newVisitTarget + b.totals.newVisitTarget,
            appointmentTarget: a.totals.appointmentTarget + b.totals.appointmentTarget,
            negotiationTarget: a.totals.negotiationTarget + b.totals.negotiationTarget,
            newNegotiationTarget: a.totals.newNegotiationTarget + b.totals.newNegotiationTarget,
            contractTarget: a.totals.contractTarget + b.totals.contractTarget,
            revenueTarget: a.totals.revenueTarget + b.totals.revenueTarget,
            kmContactTarget: a.totals.kmContactTarget + b.totals.kmContactTarget,
            onlineTarget: a.totals.onlineTarget + b.totals.onlineTarget,
        },
        revenueActual: a.revenueActual + b.revenueActual,
    };
}

function mergeRollingKpiGrids(a: SalesRollingKpiGrid, b: SalesRollingKpiGrid): SalesRollingKpiGrid {
    const periodMap = new Map<string, SalesRollingKpiColumn>();
    for (const col of [...a, ...b]) {
        const existing = periodMap.get(col.period);
        if (!existing) {
            periodMap.set(col.period, { ...col, metrics: { ...col.metrics } });
        } else {
            const merged = { ...existing };
            for (const key of Object.keys(col.metrics) as (keyof typeof col.metrics)[]) {
                merged.metrics = {
                    ...merged.metrics,
                    [key]: {
                        total: existing.metrics[key].total + col.metrics[key].total,
                        bySegment: {
                            new:
                                existing.metrics[key].bySegment.new +
                                col.metrics[key].bySegment.new,
                            existing:
                                existing.metrics[key].bySegment.existing +
                                col.metrics[key].bySegment.existing,
                        },
                    },
                };
            }
            periodMap.set(col.period, merged);
        }
    }
    // 元の順序を保持
    const periodOrder = ['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'];
    return periodOrder
        .map((p) => periodMap.get(p))
        .filter((c): c is SalesRollingKpiColumn => !!c);
}

// ─── ページ本体 ──────────────────────────────────────────────────────────────

const TAB_LABEL: Record<string, string> = {
    LARK_SUPPORT: 'G-DX',
    WATER_SAVING: 'JET',
    ALL: '全案件',
};

export default async function ActivityDashboardPage({
    searchParams,
}: {
    searchParams?: { tab?: string };
}) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    const canReadPersonalKpi = permissions.has('dashboard.kpi.read');
    const isAdminOrAbove = session.user.roles.some(
        (r) => r === Role.SUPER_ADMIN || r === Role.ADMIN,
    );

    // アクセス可能なスコープ
    const accessibleScopes = session.businessMemberships.map((m) => m.code);
    const hasMultipleScopes = accessibleScopes.length >= 2;

    // タブ設定（複数スコープを持つ場合のみタブ表示）
    const tabs = hasMultipleScopes
        ? [
              ...accessibleScopes.map((code) => ({
                  key: code as DashboardTabKey,
                  label: TAB_LABEL[code] ?? code,
              })),
              { key: 'ALL' as DashboardTabKey, label: '全案件' },
          ]
        : [];

    // 現在のタブを決定
    const rawTab = searchParams?.tab;
    const validTabKeys = new Set<string>([...accessibleScopes, 'ALL']);
    const activeTab: DashboardTabKey =
        rawTab && validTabKeys.has(rawTab)
            ? (rawTab as DashboardTabKey)
            : (session.activeBusinessScope as DashboardTabKey);

    const isAllTab = activeTab === 'ALL';
    const scopeA = BusinessScope.LARK_SUPPORT;
    const scopeB = BusinessScope.WATER_SAVING;
    const singleScope = isAllTab ? session.activeBusinessScope : (activeTab as BusinessScopeType);

    let summary: DealDashboardSummary;
    let monthlyStats: Awaited<ReturnType<typeof getMonthlyActivityStats>>;
    let rollingKpiData: SalesRollingKpiGrid;
    let teamTargetSummary: TeamKpiTargetSummary;
    let teamAiSummary: Awaited<ReturnType<typeof getTeamAiWeeklySummary>> = null;

    try {
        if (isAllTab) {
            const [
                summaryA,
                summaryB,
                statsA,
                statsB,
                rollingA,
                rollingB,
                teamKpiA,
                teamKpiB,
            ] = await Promise.all([
                getDashboardSummary(scopeA),
                getDashboardSummary(scopeB),
                getMonthlyActivityStats(scopeA),
                getMonthlyActivityStats(scopeB),
                getRollingKpi(scopeA),
                getRollingKpi(scopeB),
                getTeamKpiTargetSummary(undefined, scopeA),
                getTeamKpiTargetSummary(undefined, scopeB),
            ]);
            summary = mergeDashboardSummaries(summaryA, summaryB);
            // monthlyStats: userId でマージ（同一ユーザーが両スコープに存在する可能性）
            const statsMap = new Map<string, typeof statsA[number]>();
            for (const s of [...statsA, ...statsB]) {
                const existing = statsMap.get(s.userId);
                if (!existing) {
                    statsMap.set(s.userId, { ...s });
                } else {
                    statsMap.set(s.userId, {
                        ...existing,
                        visitCount: existing.visitCount + s.visitCount,
                        onlineCount: existing.onlineCount + s.onlineCount,
                        totalCount: existing.totalCount + s.totalCount,
                    });
                }
            }
            monthlyStats = Array.from(statsMap.values());
            rollingKpiData = mergeRollingKpiGrids(rollingA, rollingB);
            teamTargetSummary = mergeTeamKpiSummaries(teamKpiA, teamKpiB);
            // AI サマリーは全案件タブでは非表示（スコープ固有のため）
            teamAiSummary = null;
        } else {
            [summary, monthlyStats, rollingKpiData, teamTargetSummary, teamAiSummary] =
                await Promise.all([
                    getDashboardSummary(singleScope),
                    getMonthlyActivityStats(singleScope),
                    getRollingKpi(singleScope),
                    getTeamKpiTargetSummary(undefined, singleScope),
                    getTeamAiWeeklySummary(singleScope).catch(() => null),
                ]);
        }
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (
            isAppError(error, 'FORBIDDEN') ||
            isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')
        ) {
            redirect('/unauthorized');
        }
        throw error;
    }

    // 全メンバーのリストを取得
    const memberList =
        summary.byOwner.length > 0
            ? summary.byOwner.map((owner) => ({
                  userId: owner.ownerUserId,
                  userName: owner.ownerName,
              }))
            : [{ userId: session.user.id, userName: session.user.name }];

    // 全メンバーの個人データを並列取得
    // 全案件タブ時は両スコープから action items を取得してマージ
    let allMembersData: MemberActivityData[] = [];
    try {
        const memberDataResults = await Promise.all(
            memberList.map(async (member) => {
                if (isAllTab) {
                    // 両スコープの action items をマージ
                    const [dashboardData, actionsA, actionsB] = await Promise.all([
                        (canReadPersonalKpi || isAdminOrAbove)
                            ? getPersonalDashboardData({
                                  userId: member.userId,
                                  scope: scopeA,
                              }).catch(() => null)
                            : Promise.resolve(null),
                        getPersonalActionList({ userId: member.userId, scope: scopeA }).catch(
                            () => [],
                        ),
                        getPersonalActionList({ userId: member.userId, scope: scopeB }).catch(
                            () => [],
                        ),
                    ]);
                    // アクションは dealId で重複除去しつつマージ
                    const actionMap = new Map<string, typeof actionsA[number]>();
                    for (const item of [...actionsA, ...actionsB]) {
                        actionMap.set(item.dealId, item);
                    }
                    return {
                        userId: member.userId,
                        userName: member.userName,
                        dashboardData,
                        actionItems: Array.from(actionMap.values()),
                    } satisfies MemberActivityData;
                } else {
                    const [dashboardData, actionItems] = await Promise.all([
                        (canReadPersonalKpi || isAdminOrAbove)
                            ? getPersonalDashboardData({
                                  userId: member.userId,
                                  scope: singleScope,
                              }).catch(() => null)
                            : Promise.resolve(null),
                        getPersonalActionList({ userId: member.userId, scope: singleScope }).catch(
                            () => [],
                        ),
                    ]);
                    return {
                        userId: member.userId,
                        userName: member.userName,
                        dashboardData,
                        actionItems,
                    } satisfies MemberActivityData;
                }
            }),
        );
        allMembersData = memberDataResults;

        // SUPER_ADMIN・TECH ロールを持つユーザーを除外
        const excludedIds = isAllTab
            ? new Set([
                  ...(await getExcludedMemberIds(scopeA)),
                  ...(await getExcludedMemberIds(scopeB)),
              ])
            : await getExcludedMemberIds(singleScope);
        allMembersData = allMembersData.filter((m) => !excludedIds.has(m.userId));
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (
            isAppError(error, 'FORBIDDEN') ||
            isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')
        ) {
            redirect('/unauthorized');
        }
        throw error;
    }

    const tabLabel = isAllTab
        ? '全案件'
        : TAB_LABEL[activeTab] ?? activeTab;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        活動ダッシュボード
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isAllTab ? '全ビジネスユニット合算' : `${tabLabel} の活動状況`}
                    </p>
                </div>

                {hasMultipleScopes ? (
                    <Suspense fallback={null}>
                        <DashboardScopeTabs tabs={tabs} activeTab={activeTab} />
                    </Suspense>
                ) : null}
            </div>

            <TeamTargetOverview
                summary={teamTargetSummary}
                rollingKpiData={rollingKpiData}
                title="チームKPI"
                description="月次KPI / 実績"
                businessScope={isAllTab ? undefined : singleScope}
            />

            {!isAllTab ? <AiSummaryCard summary={teamAiSummary} label="チーム" /> : null}

            <SalesKpiDashboard rollingKpiData={rollingKpiData} businessScope={isAllTab ? undefined : singleScope} />

            <div className="space-y-4">
                <NextActionList
                    title="今日のネクストアクション"
                    items={summary.nextActionsToday}
                />
                <NextActionList
                    title="明日のネクストアクション"
                    items={summary.nextActionsTomorrow}
                />
                <NextActionList
                    title="今週のネクストアクション"
                    items={summary.nextActionsThisWeek}
                />
            </div>

            <AllMembersActivitySection
                members={allMembersData}
                suppressTargetAlert={isAdminOrAbove}
            />

            <ActivityDashboard summary={summary} monthlyStats={monthlyStats} />
        </div>
    );
}
