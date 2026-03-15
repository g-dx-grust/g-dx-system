import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PersonalDashboardData } from '@g-dx/contracts';

interface PersonalKpiProgressProps {
    data: PersonalDashboardData;
    className?: string;
}

function formatRevenue(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

function achievementBadgeVariant(pct: number): 'success' | 'default' | 'warning' {
    if (pct >= 100) return 'success';
    if (pct >= 70) return 'default';
    return 'warning';
}

function ringColorClass(pct: number): string {
    if (pct >= 100) return 'text-emerald-500';
    if (pct >= 70) return 'text-blue-600';
    return 'text-amber-400';
}

interface RingGaugeProps {
    label: string;
    actualLabel: string;
    targetLabel: string;
    pct: number;
}

function RingGauge({ label, actualLabel, targetLabel, pct }: RingGaugeProps) {
    const r = 46;
    const circ = 2 * Math.PI * r;
    const clamped = Math.min(100, Math.max(0, pct));
    const offset = circ * (1 - clamped / 100);
    const color = ringColorClass(pct);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    {/* トラック */}
                    <circle
                        cx="60" cy="60" r={r}
                        className="fill-none stroke-gray-100"
                        strokeWidth="10"
                    />
                    {/* フィル */}
                    <circle
                        cx="60" cy="60" r={r}
                        className={`fill-none stroke-current transition-all duration-500 ${color}`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold leading-none ${color}`}>{pct}%</span>
                    {pct >= 100 && (
                        <span className="mt-1 text-[10px] font-medium text-emerald-500">達成</span>
                    )}
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{actualLabel}</p>
                <p className="text-xs text-gray-400">目標: {targetLabel}</p>
            </div>
        </div>
    );
}

export function PersonalKpiProgress({ data, className }: PersonalKpiProgressProps) {
    const contractItem = data.kpiItems.find((k) => k.key === 'contractCount');
    const activityItems = data.kpiItems.filter((k) => k.key !== 'contractCount');

    return (
        <div className={className}>
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base text-gray-900">今月のKPI達成状況</CardTitle>
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
                    {!data.hasTargets && (
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                            今月の目標が設定されていません。
                            <Link href="/dashboard/settings/kpi" className="ml-1 font-medium underline">
                                設定ページで入力してください。
                            </Link>
                        </div>
                    )}

                    {/* ─── ヒーロー: リングゲージ ─────────────────────────────── */}
                    <div className="flex items-start justify-center gap-12 py-2">
                        <RingGauge
                            label="売上KPI"
                            actualLabel={formatRevenue(data.revenueActual)}
                            targetLabel={formatRevenue(data.revenueTarget)}
                            pct={data.revenueAchievementPct}
                        />
                        {contractItem && (
                            <RingGauge
                                label="契約数"
                                actualLabel={`${contractItem.actual}件`}
                                targetLabel={`${contractItem.target}件`}
                                pct={contractItem.achievementPct}
                            />
                        )}
                    </div>

                    {/* ─── 活動量KPI: プログレスバー ───────────────────────────── */}
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <div className="h-px flex-1 bg-gray-100" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                活動量KPI
                            </span>
                            <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {activityItems.map((item) => (
                                <div key={item.key} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">{item.label}</span>
                                        <Badge variant={achievementBadgeVariant(item.achievementPct)}>
                                            {item.achievementPct}%
                                        </Badge>
                                    </div>
                                    <Progress value={item.actual} max={item.target > 0 ? item.target : 1} />
                                    <div className="text-right text-xs text-gray-500">
                                        {item.actual.toLocaleString()} / {item.target.toLocaleString()}件
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
