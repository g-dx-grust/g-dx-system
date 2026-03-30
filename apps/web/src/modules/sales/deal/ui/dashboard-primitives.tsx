import type { SalesRollingKpiGrid } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TeamKpiTargetSummary } from '../application/get-team-kpi-target-summary';

export function formatDashboardAmount(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

function formatTargetMonthLabel(targetMonth: string): string {
    const [year, month] = targetMonth.split('-').map(Number);
    if (!year || !month) return targetMonth;
    return `${year}年${month}月`;
}

interface DashboardMetricCardProps {
    title: string;
    description: string;
    value: string;
    footnote?: string;
    className?: string;
    valueClassName?: string;
}

export function DashboardMetricCard({
    title,
    description,
    value,
    footnote,
    className,
    valueClassName,
}: DashboardMetricCardProps) {
    return (
        <Card className={cn('border-gray-200 bg-white shadow-sm', className)}>
            <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
                <CardDescription className="text-xs leading-5 text-gray-500">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className={cn('text-2xl font-semibold tracking-tight text-gray-900', valueClassName)}>
                    {value}
                </p>
                {footnote ? <p className="text-xs leading-5 text-gray-500">{footnote}</p> : null}
            </CardContent>
        </Card>
    );
}

interface DashboardNarrativeCardProps {
    title?: string;
    description: string;
    lines: string[];
    className?: string;
}

export function DashboardNarrativeCard({
    title = 'AIサマリー',
    description,
    lines,
    className,
}: DashboardNarrativeCardProps) {
    return (
        <Card className={cn('border-gray-200 bg-white shadow-sm', className)}>
            <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
                <CardDescription className="text-xs leading-5 text-gray-500">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {lines.map((line) => (
                    <p key={line} className="text-sm leading-7 text-gray-700">
                        {line}
                    </p>
                ))}
            </CardContent>
        </Card>
    );
}

interface TeamTargetOverviewProps {
    summary: TeamKpiTargetSummary;
    rollingKpiData?: SalesRollingKpiGrid;
    title?: string;
    description?: string;
    className?: string;
}

export function TeamTargetOverview({
    summary,
    rollingKpiData,
    title = '今月の目標合計',
    description = '登録済みの月次KPIを合算して確認できます。',
    className,
}: TeamTargetOverviewProps) {
    const thisMonthMetrics = rollingKpiData?.find((item) => item.period === 'thisMonth')?.metrics;
    const coverageText =
        summary.activeMemberCount > 0
            ? `${summary.membersWithTargetsCount} / ${summary.activeMemberCount}名が入力済み`
            : '対象メンバーは未登録です';

    const metricCards = [
        {
            key: 'callTarget',
            title: 'コール目標',
            description: '月次の活動目標合計',
            target: summary.totals.callTarget,
            actual: thisMonthMetrics?.callCount.total,
            unit: '件',
        },
        {
            key: 'visitTarget',
            title: '訪問目標',
            description: '対面訪問の目標合計',
            target: summary.totals.visitTarget,
            actual: thisMonthMetrics?.visitCount.total,
            unit: '件',
        },
        {
            key: 'appointmentTarget',
            title: 'アポイント目標',
            description: '案件化の入口を確認',
            target: summary.totals.appointmentTarget,
            actual: thisMonthMetrics?.appointmentCount.total,
            unit: '件',
        },
        {
            key: 'negotiationTarget',
            title: '商談化目標',
            description: '提案化までの進み具合',
            target: summary.totals.negotiationTarget,
            actual: thisMonthMetrics?.negotiationCount.total,
            unit: '件',
        },
        {
            key: 'contractTarget',
            title: '契約目標',
            description: '今月の契約到達件数',
            target: summary.totals.contractTarget,
            actual: thisMonthMetrics?.contractCount.total,
            unit: '件',
        },
        {
            key: 'revenueTarget',
            title: '売上目標',
            description: '契約実績金額との比較',
            target: summary.totals.revenueTarget,
            actual: summary.revenueActual,
            unit: '円',
            isRevenue: true,
        },
    ];

    return (
        <Card className={cn('border-gray-200 bg-white shadow-sm', className)}>
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-base text-gray-900">{title}</CardTitle>
                <CardDescription className="text-sm leading-6 text-gray-500">
                    {description}
                </CardDescription>
                <p className="text-xs text-gray-400">
                    {formatTargetMonthLabel(summary.targetMonth)} / {coverageText}
                </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {metricCards.map((metric) => {
                    const actual = metric.actual ?? null;
                    const progress =
                        metric.target > 0 && actual !== null
                            ? Math.min(100, Math.round((actual / metric.target) * 100))
                            : null;
                    const targetLabel = metric.isRevenue
                        ? formatDashboardAmount(metric.target)
                        : `${metric.target.toLocaleString()}${metric.unit}`;
                    const actualLabel =
                        actual === null
                            ? '実績は別画面で確認'
                            : metric.isRevenue
                                ? formatDashboardAmount(actual)
                                : `${actual.toLocaleString()}${metric.unit}`;

                    return (
                        <section
                            key={metric.key}
                            className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-4"
                        >
                            <p className="text-sm font-semibold text-gray-900">{metric.title}</p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">
                                {metric.description}
                            </p>
                            <p className="mt-4 text-xl font-semibold text-gray-900">{targetLabel}</p>
                            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                                <span>実績 {actualLabel}</span>
                                {progress !== null ? <span>{progress}%</span> : null}
                            </div>
                            {progress !== null ? (
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-full rounded-full bg-gray-700"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            ) : null}
                        </section>
                    );
                })}
            </CardContent>
        </Card>
    );
}
