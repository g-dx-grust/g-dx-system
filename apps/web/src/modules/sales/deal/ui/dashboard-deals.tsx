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
import type { DashboardSectionsConfig } from '@/modules/admin/infrastructure/app-settings-repository';
import { DEFAULT_DASHBOARD_SECTIONS } from '@/modules/admin/infrastructure/app-settings-repository';
import { BusinessGoalOverviewCard } from './business-goal-section';
import { DashboardAlerts } from './dashboard-alerts';
import {
    AiSummaryCard,
    DashboardMetricCard,
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
    sectionsConfig?: DashboardSectionsConfig;
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

export function DealDashboard({
    summary,
    rollingKpiData,
    teamTargetSummary,
    alerts,
    businessScope,
    canViewBusinessGoals,
    teamAiSummary,
    sectionsConfig,
}: DealDashboardProps) {
    const sec = { ...DEFAULT_DASHBOARD_SECTIONS, ...sectionsConfig };
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

    // teamKpi か aiSummary の少なくとも一方が表示される場合のみグリッドを描画
    const showKpiAiRow = sec.teamKpi || sec.aiSummary;

    return (
        <div className="space-y-6">
            {sec.businessGoals && canViewBusinessGoals ? (
                <BusinessGoalOverviewCard
                    businessScope={businessScope}
                    currentMonth={currentMonth}
                />
            ) : null}

            {sec.alerts ? <DashboardAlerts alerts={alerts} /> : null}

            {showKpiAiRow ? (
                sec.teamKpi && sec.aiSummary ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
                        <TeamTargetOverview
                            summary={teamTargetSummary}
                            rollingKpiData={rollingKpiData}
                            title="チームKPIと進捗"
                            description="月次KPI / 実績"
                        />
                        <AiSummaryCard summary={teamAiSummary} label="チーム" />
                    </div>
                ) : sec.teamKpi ? (
                    <TeamTargetOverview
                        summary={teamTargetSummary}
                        rollingKpiData={rollingKpiData}
                        title="チームKPIと進捗"
                        description="月次KPI / 実績"
                    />
                ) : (
                    <AiSummaryCard summary={teamAiSummary} label="チーム" />
                )
            ) : null}

            {sec.metricCards ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <DashboardMetricCard
                        title="総案件数"
                        description="現在管理中の全案件"
                        value={`${summary.totalDeals.toLocaleString()}件`}
                        footnote={`成約率 ${winRate}%`}
                        href="/sales/deals"
                    />
                    <DashboardMetricCard
                        title="進行中案件"
                        description="失注・成約を除く進行案件"
                        value={`${summary.activeGroup.count.toLocaleString()}件`}
                        footnote={`進行中金額 ${formatDashboardAmount(summary.activeGroup.totalAmount)}`}
                        href="/sales/deals"
                    />
                    <DashboardMetricCard
                        title="停滞案件"
                        description="一定期間更新のない案件"
                        value={`${summary.stalledGroup.count.toLocaleString()}件`}
                        footnote={`対象金額 ${formatDashboardAmount(summary.stalledGroup.totalAmount)}`}
                        href="/sales/deals"
                    />
                    <DashboardMetricCard
                        title="成約済み"
                        description="契約完了済みの案件"
                        value={`${summary.contractedGroup.count.toLocaleString()}件`}
                        footnote={`成約金額 ${formatDashboardAmount(summary.contractedGroup.totalAmount)}`}
                        href="/sales/contracts"
                    />
                </div>
            ) : null}

            {sec.stageCharts ? (
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
                                                        ? (stage.totalAmount / maxStageAmount) * 100
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
            ) : null}

            {sec.companyChart && companyChartData.length > 0 ? (
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

            {sec.nextActions ? (
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
                                                <NextActionRow key={item.dealId} item={item} />
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
                                                <NextActionRow key={item.dealId} item={item} />
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
                                                <NextActionRow key={item.dealId} item={item} />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </CardContent>
                </Card>
            ) : null}
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
