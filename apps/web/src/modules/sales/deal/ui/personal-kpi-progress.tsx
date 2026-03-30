import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
    PersonalDashboardData,
    PersonalRollingKpiBlock,
    KpiSegmentedCounts,
} from '@g-dx/contracts';
import { formatDashboardAmount } from './dashboard-primitives';

interface PersonalKpiProgressProps {
    data: PersonalDashboardData;
    className?: string;
}

function achievementBadgeVariant(pct: number): 'success' | 'default' | 'warning' {
    if (pct >= 100) return 'success';
    if (pct >= 70) return 'default';
    return 'warning';
}

function getWeeksInMonth(targetMonth: string): number {
    const [year, month] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Math.max(1, Math.ceil(daysInMonth / 7));
}

function formatWeeklyCount(value: number): string {
    return `${value.toLocaleString()}件`;
}

function getThisWeekMetricTotal(
    data: PersonalDashboardData,
    key: keyof PersonalDashboardData['rollingKpis'][number]['metrics'],
): number {
    return (
        data.rollingKpis.find((block) => block.period === 'thisWeek')?.metrics[key].total ??
        0
    );
}

interface SummaryBlockProps {
    title: string;
    description: string;
    actualLabel: string;
    targetLabel: string;
    weeklyLabel: string;
    progress: number;
    footer?: string;
}

function SummaryBlock({
    title,
    description,
    actualLabel,
    targetLabel,
    weeklyLabel,
    progress,
    footer,
}: SummaryBlockProps) {
    return (
        <section className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
                </div>
                <Badge variant={achievementBadgeVariant(progress)}>{progress}%</Badge>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900">{actualLabel}</p>
            <p className="mt-2 text-xs text-gray-500">
                目標 {targetLabel} / 週あたり目安 {weeklyLabel}
            </p>
            {footer ? <p className="mt-1 text-xs text-gray-500">{footer}</p> : null}
            <div className="mt-3">
                <Progress value={Math.min(progress, 100)} max={100} />
            </div>
        </section>
    );
}

const ROLLING_METRIC_LABELS: Record<string, string> = {
    callCount: 'コール数',
    visitCount: '訪問数',
    onlineCount: 'オンライン商談数',
    appointmentCount: 'アポイント数',
    negotiationCount: '商談化数',
    contractCount: '契約数',
};

const ROLLING_METRIC_KEYS = [
    'callCount',
    'visitCount',
    'onlineCount',
    'appointmentCount',
    'negotiationCount',
    'contractCount',
] as const;

function SegmentedCell({ counts }: { counts: KpiSegmentedCounts }) {
    const { total, bySegment } = counts;
    return (
        <div className="text-right tabular-nums">
            <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
            {total > 0 ? (
                <div className="text-[11px] leading-tight text-gray-400">
                    <span className="text-blue-500">新{bySegment.new}</span>
                    {' / '}
                    <span className="text-orange-500">既{bySegment.existing}</span>
                </div>
            ) : null}
        </div>
    );
}

function RollingKpiTable({ blocks }: { blocks: PersonalRollingKpiBlock[] }) {
    if (blocks.length === 0) return null;

    return (
        <div>
            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-900">期間別実績</p>
                <p className="text-xs text-gray-500">
                    今週・先週・今月・先月を、新規 / 既存の内訳つきで見返せます。
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                            <th className="sticky left-0 bg-gray-50 px-3 py-2.5 text-left">
                                KPI指標
                            </th>
                            {blocks.map((block) => (
                                <th
                                    key={block.period}
                                    className="px-3 py-2.5 text-right whitespace-nowrap"
                                >
                                    <div>{block.periodLabel.split(' ')[0]}</div>
                                    <div className="text-[10px] font-normal text-gray-400">
                                        {block.startDate.slice(5)} 〜 {block.endDate.slice(5)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ROLLING_METRIC_KEYS.map((key) => (
                            <tr key={key} className="hover:bg-gray-50">
                                <td className="sticky left-0 bg-white px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                                    {ROLLING_METRIC_LABELS[key]}
                                </td>
                                {blocks.map((block) => (
                                    <td key={block.period} className="px-3 py-2.5">
                                        <SegmentedCell counts={block.metrics[key]} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-right text-[11px] text-gray-400">
                <span className="text-blue-500">新</span> = 新規案件（顧客初回）
                {' '}
                <span className="text-orange-500">既</span> = 既存案件（リピート）
            </p>
        </div>
    );
}

export function PersonalKpiProgress({ data, className }: PersonalKpiProgressProps) {
    const contractItem = data.kpiItems.find((item) => item.key === 'contractCount');
    const activityItems = data.kpiItems.filter((item) => item.key !== 'contractCount');
    const weeksInMonth = getWeeksInMonth(data.targetMonth);

    return (
        <div className={className}>
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-base text-gray-900">
                                今月のKPI達成状況
                            </CardTitle>
                            <CardDescription>{data.periodLabel}</CardDescription>
                        </div>
                        <Link
                            href="/dashboard/settings/kpi"
                            className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
                        >
                            目標を設定 →
                        </Link>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {!data.hasTargets ? (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                            今月の目標が設定されていません。
                            <Link
                                href="/dashboard/settings/kpi"
                                className="ml-1 font-medium underline"
                            >
                                設定ページで入力してください。
                            </Link>
                        </div>
                    ) : null}

                    <div className="grid gap-4 xl:grid-cols-2">
                        <SummaryBlock
                            title="売上進捗"
                            description="今月目標と週あたりの目安を並べています。"
                            actualLabel={formatDashboardAmount(data.revenueActual)}
                            targetLabel={formatDashboardAmount(data.revenueTarget)}
                            weeklyLabel={formatDashboardAmount(
                                Math.round(data.revenueTarget / weeksInMonth),
                            )}
                            progress={data.revenueAchievementPct}
                        />

                        {contractItem ? (
                            <SummaryBlock
                                title="契約進捗"
                                description="契約目標に対する今月の到達状況です。"
                                actualLabel={`${contractItem.actual.toLocaleString()}件`}
                                targetLabel={`${contractItem.target.toLocaleString()}件`}
                                weeklyLabel={formatWeeklyCount(
                                    Math.ceil(contractItem.target / weeksInMonth),
                                )}
                                progress={contractItem.achievementPct}
                                footer={`今週実績 ${getThisWeekMetricTotal(
                                    data,
                                    'contractCount',
                                ).toLocaleString()}件`}
                            />
                        ) : null}
                    </div>

                    <div>
                        <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-900">活動量KPI</p>
                            <p className="text-xs text-gray-500">
                                月次目標を週あたりの目安に換算して、今週実績と並べています。
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {activityItems.map((item) => {
                                const weeklyTarget = Math.ceil(item.target / weeksInMonth);
                                const thisWeekActual = getThisWeekMetricTotal(data, item.key);

                                return (
                                    <section
                                        key={item.key}
                                        className="rounded-xl border border-gray-200 bg-white px-4 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                                    今月目標 {item.target.toLocaleString()}件 / 週あたり目安{' '}
                                                    {weeklyTarget.toLocaleString()}件
                                                </p>
                                            </div>
                                            <Badge variant={achievementBadgeVariant(item.achievementPct)}>
                                                {item.achievementPct}%
                                            </Badge>
                                        </div>

                                        <p className="mt-4 text-xl font-semibold text-gray-900">
                                            {item.actual.toLocaleString()}件
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500">
                                            今週実績 {thisWeekActual.toLocaleString()}件
                                        </p>
                                        <div className="mt-3">
                                            <Progress
                                                value={item.actual}
                                                max={item.target > 0 ? item.target : 1}
                                            />
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>

                    <RollingKpiTable blocks={data.rollingKpis} />
                </CardContent>
            </Card>
        </div>
    );
}
