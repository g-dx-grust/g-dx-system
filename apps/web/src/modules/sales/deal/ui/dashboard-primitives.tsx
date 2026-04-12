import Link from 'next/link';
import type { SalesRollingKpiGrid } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TeamKpiTargetSummary } from '../application/get-team-kpi-target-summary';
import type { AiWeeklySummaryData } from '../application/get-ai-weekly-summary';

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
    href?: string;
}

export function DashboardMetricCard({
    title,
    description,
    value,
    footnote,
    className,
    valueClassName,
    href,
}: DashboardMetricCardProps) {
    const card = (
        <Card className={cn('border-gray-200 bg-white shadow-sm', href && 'transition-shadow hover:shadow-md cursor-pointer', className)}>
            <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">
                    {title}
                </CardTitle>
                <CardDescription className="text-xs leading-5 text-gray-500">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <p
                    className={cn(
                        'text-2xl font-semibold tracking-tight text-gray-900',
                        valueClassName,
                    )}
                >
                    {value}
                </p>
                {footnote ? (
                    <p className="text-sm leading-5 text-gray-500">{footnote}</p>
                ) : null}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block">{card}</Link>;
    }
    return card;
}

interface DashboardNarrativeCardProps {
    title?: string;
    description: string;
    lines: string[];
    className?: string;
}

export function DashboardNarrativeCard({
    title = '状況メモ',
    description,
    lines,
    className,
}: DashboardNarrativeCardProps) {
    return (
        <Card className={cn('border-gray-200 bg-white shadow-sm', className)}>
            <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">
                    {title}
                </CardTitle>
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

interface TeamMetricCard {
    key: string;
    title: string;
    description: string;
    target: number;
    actual: number | null;
    unit: string;
    isRevenue?: boolean;
}

export function TeamTargetOverview({
    summary,
    rollingKpiData,
    title = 'チームKPIと進捗',
    description = '月次KPI / 実績',
    className,
}: TeamTargetOverviewProps) {
    const thisMonthMetrics = rollingKpiData?.find(
        (item) => item.period === 'thisMonth',
    )?.metrics;
    const coverageText =
        summary.activeMemberCount > 0
            ? `${summary.membersWithTargetsCount} / ${summary.activeMemberCount}名が入力済み`
            : '対象メンバーは未設定です';

    const metricCards: TeamMetricCard[] = [
        {
            key: 'newVisitTarget',
            title: '新規面会数',
            description: '新規面会目標',
            target: summary.totals.newVisitTarget,
            actual: thisMonthMetrics?.newVisitCount.total ?? null,
            unit: '件',
        },
        {
            key: 'newNegotiationTarget',
            title: '新規商談数',
            description: '新規商談目標',
            target: summary.totals.newNegotiationTarget,
            actual: thisMonthMetrics?.negotiationCount.bySegment.new ?? null,
            unit: '件',
        },
        {
            key: 'contractTarget',
            title: '契約数',
            description: '契約目標',
            target: summary.totals.contractTarget,
            actual: thisMonthMetrics?.contractCount.total ?? null,
            unit: '件',
        },
        {
            key: 'revenueTarget',
            title: '売上',
            description: '月次売上目標',
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
            <CardContent className="grid gap-3 md:grid-cols-2">
                {metricCards.map((metric) => {
                    const actual = metric.actual;
                    const progress =
                        metric.target > 0 && actual !== null
                            ? Math.min(100, Math.round((actual / metric.target) * 100))
                            : null;
                    const targetLabel = metric.isRevenue
                        ? formatDashboardAmount(metric.target)
                        : `${metric.target.toLocaleString()}${metric.unit}`;
                    const actualLabel =
                        actual === null
                            ? '実績は表示できません'
                            : metric.isRevenue
                              ? formatDashboardAmount(actual)
                              : `${actual.toLocaleString()}${metric.unit}`;

                    return (
                        <section
                            key={metric.key}
                            className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-4"
                        >
                            <p className="text-sm font-semibold text-gray-900">
                                {metric.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">
                                {metric.description}
                            </p>
                            <p className="mt-4 text-xl font-semibold text-gray-900">
                                {targetLabel}
                            </p>
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

interface AiSummaryCardProps {
    summary: AiWeeklySummaryData | null;
    /** "PERSONAL" | "TEAM" */
    label?: string;
    className?: string;
}

/** AI週次サマリーを表示するカード。summary が null の場合はプレースホルダーを表示。 */
export function AiSummaryCard({ summary, label, className }: AiSummaryCardProps) {
    const weekLabel = summary
        ? `${summary.weekStartDate} 〜 ${summary.weekEndDate}`
        : null;

    const defaultLabel = summary?.summaryType === 'TEAM' ? 'チームサマリー' : '個人サマリー';
    const title = label ?? defaultLabel;

    return (
        <Card className={cn('border-gray-200 bg-white shadow-sm', className)}>
            <CardHeader className="space-y-1 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                    <CardTitle className="text-sm font-semibold text-gray-900">
                        AI週次サマリー — {title}
                    </CardTitle>
                    {weekLabel ? (
                        <span className="shrink-0 text-xs text-gray-400">{weekLabel}</span>
                    ) : null}
                </div>
                <CardDescription className="text-xs leading-5 text-gray-500">
                    毎週月曜更新 / Claude Haiku 生成
                </CardDescription>
            </CardHeader>
            <CardContent>
                {summary?.summaryBody ? (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                        {summary.summaryBody}
                    </p>
                ) : (
                    <p className="text-sm leading-6 text-gray-400">
                        今週のサマリーはまだ生成されていません。毎週月曜朝に自動生成されます。
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
