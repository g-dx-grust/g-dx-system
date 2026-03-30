import Link from 'next/link';
import type { DealDashboardSummary, DealStageKey, SalesRollingKpiGrid } from '@g-dx/contracts';
import type { TeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StageBarChart } from '@/components/charts/stage-bar-chart';
import { CompanyBarChart } from '@/components/charts/company-bar-chart';
import {
    DashboardMetricCard,
    DashboardNarrativeCard,
    TeamTargetOverview,
    formatDashboardAmount,
} from './dashboard-primitives';

interface DealDashboardProps {
    summary: DealDashboardSummary;
    rollingKpiData: SalesRollingKpiGrid;
    teamTargetSummary: TeamKpiTargetSummary;
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

function buildNarrativeLines(
    summary: DealDashboardSummary,
    rollingKpiData: SalesRollingKpiGrid,
    teamTargetSummary: TeamKpiTargetSummary,
): string[] {
    const topStage = [...summary.byStage].sort((left, right) => right.count - left.count)[0];
    const thisMonthMetrics = rollingKpiData.find((item) => item.period === 'thisMonth')?.metrics;
    const overdueTargets = teamTargetSummary.activeMemberCount - teamTargetSummary.membersWithTargetsCount;
    const nextActionTotal =
        summary.nextActionsToday.length +
        summary.nextActionsTomorrow.length +
        summary.nextActionsThisWeek.length;

    return [
        topStage && topStage.count > 0
            ? `${topStage.stageName} が ${topStage.count}件で最も厚く、進行中案件は ${summary.activeGroup.count}件です。`
            : '案件ステージの偏りはまだ小さく、これからの積み上げを確認する段階です。',
        thisMonthMetrics
            ? `今月はアポイント ${thisMonthMetrics.appointmentCount.total}件、商談化 ${thisMonthMetrics.negotiationCount.total}件、契約 ${thisMonthMetrics.contractCount.total}件で推移しています。`
            : '今月の活動実績は、活動ダッシュボードの期間別実績で確認できます。',
        nextActionTotal > 0
            ? `今日から今週にかけて ${nextActionTotal}件のネクストアクションがあります。今日分から順に整えると進行が安定します。`
            : '今週のネクストアクションは未登録です。次回予定の入力を揃えると見通しが立ちやすくなります。',
        overdueTargets > 0
            ? `月次目標が未入力のメンバーが ${overdueTargets}名います。入力を揃えると会社目標との比較が安定します。`
            : '月次目標は登録メンバー分が揃っており、会社目標との比較がしやすい状態です。',
    ];
}

export function DealDashboard({
    summary,
    rollingKpiData,
    teamTargetSummary,
}: DealDashboardProps) {
    const maxStageAmount = Math.max(...summary.byStage.map((stage) => stage.totalAmount), 1);
    const allNextActions = [
        ...summary.nextActionsToday,
        ...summary.nextActionsTomorrow,
        ...summary.nextActionsThisWeek,
    ];
    const winRate =
        summary.totalDeals > 0
            ? Math.round((summary.contractedGroup.count / summary.totalDeals) * 100)
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
                ? `${company.companyName.slice(0, 10)}…`
                : company.companyName,
        totalAmount: company.totalAmount,
        activeDeals: company.activeDeals,
    }));

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <TeamTargetOverview
                    summary={teamTargetSummary}
                    rollingKpiData={rollingKpiData}
                    title="会社目標と実績比較"
                    description="今月の月次目標合計と、現在の実績を同じ視点で並べています。"
                />

                <DashboardNarrativeCard
                    description="案件の厚みと次の打ち手を、読み物として短く整理しています。"
                    lines={buildNarrativeLines(summary, rollingKpiData, teamTargetSummary)}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard
                    title="累計案件数"
                    description="現在管理している案件全体の母数です。"
                    value={`${summary.totalDeals.toLocaleString()}件`}
                    footnote={`受注率は ${winRate}% です。`}
                />
                <DashboardMetricCard
                    title="進行中案件"
                    description="アポ獲得・商談中・アライアンスの合計です。"
                    value={`${summary.activeGroup.count.toLocaleString()}件`}
                    footnote={`進行中総額 ${formatDashboardAmount(summary.activeGroup.totalAmount)}`}
                />
                <DashboardMetricCard
                    title="停滞案件"
                    description="ペンディング・失注・アポキャンの確認対象です。"
                    value={`${summary.stalledGroup.count.toLocaleString()}件`}
                    footnote={`対象総額 ${formatDashboardAmount(summary.stalledGroup.totalAmount)}`}
                />
                <DashboardMetricCard
                    title="契約済み"
                    description="成約まで到達した案件の累計です。"
                    value={`${summary.contractedGroup.count.toLocaleString()}件`}
                    footnote={`契約総額 ${formatDashboardAmount(summary.contractedGroup.totalAmount)}`}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">フェーズ別案件数</CardTitle>
                        <CardDescription>案件の厚みをステージごとに確認します。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StageBarChart data={stageChartData} />
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">フェーズ別内訳</CardTitle>
                        <CardDescription>件数と金額を同じ並びで比較します。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {summary.byStage.map((stage) => (
                            <div key={stage.stageKey} className="space-y-2 rounded-lg border border-gray-100 px-3 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_BADGE[stage.stageKey]}`}
                                        >
                                            {stage.stageName}
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            件数と金額の両方を確認できます。
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
                                案件データがありません
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
                            進行中案件の金額が大きい会社から確認できます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CompanyBarChart data={companyChartData} />
                    </CardContent>
                </Card>
            ) : null}

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">ネクストアクション</CardTitle>
                    <CardDescription>今日・明日・今週の予定をまとめて確認します。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {allNextActions.length === 0 ? (
                        <p className="py-4 text-center text-sm text-gray-500">
                            次回アクション日が設定された案件はありません
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
                    <p className="text-sm font-semibold text-gray-900">{item.companyName}</p>
                    <Link
                        href={`/sales/deals/${item.dealId}`}
                        className="mt-1 block truncate text-sm text-gray-600 hover:underline"
                    >
                        {item.dealName}
                    </Link>
                </div>
                <span
                    className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_BADGE[item.stageKey]}`}
                >
                    {item.stageName}
                </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>担当 {item.ownerName}</span>
                {item.nextActionDate ? <span>予定 {item.nextActionDate}</span> : null}
                {item.amount !== null ? <span>{formatDashboardAmount(item.amount)}</span> : null}
            </div>
            {item.nextActionContent ? (
                <p className="mt-2 text-xs leading-6 text-gray-600">{item.nextActionContent}</p>
            ) : null}
        </div>
    );
}
