import Link from 'next/link';
import type {
    BusinessScopeType,
    DashboardAlert,
    DealDashboardSummary,
    DealStageKey,
    SalesRollingKpiGrid,
} from '@g-dx/contracts';
import { CompanyBarChart } from '@/components/charts/company-bar-chart';
import { StageBarChart } from '@/components/charts/stage-bar-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import type { AiWeeklySummaryData } from '@/modules/sales/deal/application/get-ai-weekly-summary';
import { BusinessGoalOverviewCard } from './business-goal-section';
import { DashboardAlerts } from './dashboard-alerts';
import {
    AiSummaryCard,
    DashboardMetricCard,
    DashboardNarrativeCard,
    TeamTargetOverview,
    formatDashboardAmount,
} from './dashboard-primitives';

interface DealDashboardProps {
    summary: DealDashboardSummary;
    rollingKpiData: SalesRollingKpiGrid;
    teamTargetSummary: TeamKpiTargetSummary;
    alerts: DashboardAlert[];
    businessScope: BusinessScopeType;
    canViewBusinessGoals: boolean;
    teamAiSummary: AiWeeklySummaryData | null;
}

const STAGE_BADGE: Record<DealStageKey, string> = {
    APO_ACQUIRED: 'bg-gray-100 text-gray-700',
    NEGOTIATING: 'bg-gray-200 text-gray-700',
    ALLIANCE: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-gray-100 text-gray-600',
    APO_CANCELLED: 'bg-gray-100 text-gray-500',
    LOST: 'bg-gray-200 text-gray-500',
    CONTRACTED: 'bg-gray-800 text-white',
};

const STAGE_BAR_COLORS: Record<DealStageKey, string> = {
    APO_ACQUIRED: '#475569',
    NEGOTIATING: '#334155',
    ALLIANCE: '#64748b',
    PENDING: '#94a3b8',
    APO_CANCELLED: '#cbd5e1',
    LOST: '#e2e8f0',
    CONTRACTED: '#1e293b',
};

function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function buildNarrativeLines(
    summary: DealDashboardSummary,
    rollingKpiData: SalesRollingKpiGrid,
    teamTargetSummary: TeamKpiTargetSummary,
): string[] {
    const topStage = [...summary.byStage].sort(
        (left, right) => right.count - left.count,
    )[0];
    const thisMonthMetrics = rollingKpiData.find(
        (item) => item.period === 'thisMonth',
    )?.metrics;
    const overdueTargets =
        teamTargetSummary.activeMemberCount -
        teamTargetSummary.membersWithTargetsCount;
    const nextActionTotal =
        summary.nextActionsToday.length +
        summary.nextActionsTomorrow.length +
        summary.nextActionsThisWeek.length;

    return [
        topStage && topStage.count > 0
            ? `${topStage.stageName}が${topStage.count}件で最多です。進行中案件は${summary.activeGroup.count}件です。`
            : '進行中の案件はまだありません。次の打ち手を確認しながら立ち上がりを整えていきます。',
        thisMonthMetrics
            ? `今月は新規面会${thisMonthMetrics.newVisitCount.total}件、新規商談${thisMonthMetrics.negotiationCount.bySegment.new}件、契約${thisMonthMetrics.contractCount.total}件で推移しています。`
            : '今月の活動実績はまだ集計途中です。活動入力が進むとここに流れが反映されます。',
        nextActionTotal > 0
            ? `今日から今週にかけて${nextActionTotal}件のネクストアクションがあります。日付の近いものから順に確認すると動きやすくなります。`
            : '直近のネクストアクションは未設定です。次回接点の登録を進めると案件管理が安定します。',
        overdueTargets > 0
            ? `今月のKPIが未入力のメンバーが${overdueTargets}名います。会社目標とあわせて入力をそろえると比較しやすくなります。`
            : '今月のKPIは全員分そろっています。会社目標との位置関係も見比べやすい状態です。',
    ];
}

export function DealDashboard({
    summary,
    rollingKpiData,
    teamTargetSummary,
    alerts,
    businessScope,
    canViewBusinessGoals,
    teamAiSummary,
}: DealDashboardProps) {
    const currentMonth = getCurrentMonth();
    const maxStageAmount = Math.max(
        ...summary.byStage.map((stage) => stage.totalAmount),
        1,
    );
    const allNextActions = [
        ...summary.nextActionsToday,
        ...summary.nextActionsTomorrow,
        ...summary.nextActionsThisWeek,
    ];
    const winRate =
        summary.totalDeals > 0
            ? Math.round(
                  (summary.contractedGroup.count / summary.totalDeals) * 100,
              )
            : 0;

    const stageChartData = summary.byStage.map((stage) => ({
        stageName: stage.stageName,
        count: stage.count,
        totalAmount: stage.totalAmount,
        color: STAGE_BAR_COLORS[stage.stageKey],
    }));

    const companyChartData = summary.byCompany.map((company) => ({
        companyName:
            company.companyName.length > 10
                ? `${company.companyName.slice(0, 10)}...`
                : company.companyName,
        totalAmount: company.totalAmount,
        activeDeals: company.activeDeals,
    }));

    return (
        <div className="space-y-6">
            {canViewBusinessGoals ? (
                <BusinessGoalOverviewCard
                    businessScope={businessScope}
                    currentMonth={currentMonth}
                />
            ) : null}

            <DashboardAlerts alerts={alerts} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <TeamTargetOverview
                    summary={teamTargetSummary}
                    rollingKpiData={rollingKpiData}
                    title="チームKPIと進捗"
                    description="月次KPI / 実績"
                />

                <div className="flex flex-col gap-4">
                    <AiSummaryCard summary={teamAiSummary} label="チーム" />
                    <DashboardNarrativeCard
                        description="案件サマリー"
                        lines={buildNarrativeLines(
                            summary,
                            rollingKpiData,
                            teamTargetSummary,
                        )}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard
                    title="総案件数"
                    description="現在管理中の全案件"
                    value={`${summary.totalDeals.toLocaleString()}件`}
                    footnote={`成約率 ${winRate}%`}
                />
                <DashboardMetricCard
                    title="進行中案件"
                    description="失注・成約を除く進行案件"
                    value={`${summary.activeGroup.count.toLocaleString()}件`}
                    footnote={`進行中金額 ${formatDashboardAmount(summary.activeGroup.totalAmount)}`}
                />
                <DashboardMetricCard
                    title="停滞案件"
                    description="一定期間更新のない案件"
                    value={`${summary.stalledGroup.count.toLocaleString()}件`}
                    footnote={`対象金額 ${formatDashboardAmount(summary.stalledGroup.totalAmount)}`}
                />
                <DashboardMetricCard
                    title="成約済み"
                    description="契約完了済みの案件"
                    value={`${summary.contractedGroup.count.toLocaleString()}件`}
                    footnote={`成約金額 ${formatDashboardAmount(summary.contractedGroup.totalAmount)}`}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">
                            フェーズ別の件数
                        </CardTitle>
                        <CardDescription>
                            ステージ別件数
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StageBarChart data={stageChartData} />
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">
                            フェーズ別の金額
                        </CardTitle>
                        <CardDescription>
                            件数 / 金額
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {summary.byStage.map((stage) => (
                            <div
                                key={stage.stageKey}
                                className="space-y-2 rounded-lg border border-gray-100 px-3 py-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_BADGE[stage.stageKey]}`}
                                        >
                                            {stage.stageName}
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            件数 / 金額
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {stage.count.toLocaleString()}件
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDashboardAmount(stage.totalAmount)}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-1.5 rounded-full bg-gray-500 transition-all"
                                        style={{
                                            width: `${
                                                maxStageAmount > 0
                                                    ? (stage.totalAmount /
                                                          maxStageAmount) *
                                                      100
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {summary.byStage.every((stage) => stage.count === 0) ? (
                            <p className="py-4 text-center text-sm text-gray-500">
                                集計対象の案件はまだありません。
                            </p>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            {companyChartData.length > 0 ? (
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">
                            会社別の進行中案件金額
                        </CardTitle>
                        <CardDescription>
                            進行中金額 上位
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CompanyBarChart data={companyChartData} />
                    </CardContent>
                </Card>
            ) : null}

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">
                        ネクストアクション
                    </CardTitle>
                    <CardDescription>
                        今週の予定
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {allNextActions.length === 0 ? (
                        <p className="py-4 text-center text-sm text-gray-500">
                            直近のアクションが設定された案件はありません。
                        </p>
                    ) : (
                        <>
                            {summary.nextActionsToday.length > 0 ? (
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-700">
                                        本日 ({summary.nextActionsToday.length}件)
                                    </p>
                                    <div className="space-y-2">
                                        {summary.nextActionsToday.map((item) => (
                                            <NextActionRow
                                                key={item.dealId}
                                                item={item}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {summary.nextActionsTomorrow.length > 0 ? (
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-500">
                                        明日 ({summary.nextActionsTomorrow.length}件)
                                    </p>
                                    <div className="space-y-2">
                                        {summary.nextActionsTomorrow.map((item) => (
                                            <NextActionRow
                                                key={item.dealId}
                                                item={item}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {summary.nextActionsThisWeek.length > 0 ? (
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-500">
                                        今週 ({summary.nextActionsThisWeek.length}件)
                                    </p>
                                    <div className="space-y-2">
                                        {summary.nextActionsThisWeek.map((item) => (
                                            <NextActionRow
                                                key={item.dealId}
                                                item={item}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function NextActionRow({
    item,
}: {
    item: {
        dealId: string;
        dealName: string;
        companyName: string;
        stageName: string;
        stageKey: DealStageKey;
        amount: number | null;
        ownerName: string;
        nextActionDate: string;
        nextActionContent: string | null;
        acquisitionMethod: string | null;
    };
}) {
    return (
        <div className="rounded-lg border border-gray-200 px-3 py-3 text-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                        {item.companyName}
                    </p>
                    <Link
                        href={`/sales/deals/${item.dealId}`}
                        className="mt-1 block truncate text-sm text-gray-600 hover:underline"
                    >
                        {item.dealName}
                    </Link>
                </div>
                <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_BADGE[item.stageKey]}`}
                >
                    {item.stageName}
                </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>担当 {item.ownerName}</span>
                {item.nextActionDate ? (
                    <span>予定 {item.nextActionDate}</span>
                ) : null}
                {item.amount !== null ? (
                    <span>{formatDashboardAmount(item.amount)}</span>
                ) : null}
            </div>
            {item.nextActionContent ? (
                <p className="mt-2 text-xs leading-6 text-gray-600">
                    {item.nextActionContent}
                </p>
            ) : null}
        </div>
    );
}
