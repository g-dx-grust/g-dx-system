import type { DealDashboardSummary } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OwnerBarChart } from '@/components/charts/owner-bar-chart';

interface MonthlyActivityStat {
    userId: string;
    userName: string;
    visitCount: number;
    onlineCount: number;
    totalCount: number;
}

interface ActivityDashboardProps {
    summary: DealDashboardSummary;
    monthlyStats?: MonthlyActivityStat[];
}

function formatAmount(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

export function ActivityDashboard({ summary, monthlyStats = [] }: ActivityDashboardProps) {
    const chartData = summary.byOwner.map((o) => ({
        ownerName: o.ownerName,
        totalDeals: o.totalDeals,
        activeDeals: o.activeDeals,
        contractedDeals: o.contractedDeals,
    }));

    return (
        <div className="space-y-6">
            {/* Overall stats row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">担当者数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-gray-900">{summary.byOwner.length}<span className="ml-1 text-base font-normal text-gray-500">名</span></div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">全案件の進行中金額合計</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-gray-900">{formatAmount(summary.activeGroup.totalAmount)}</div>
                        <div className="mt-1 text-xs text-gray-500">進行中案件 {summary.activeGroup.count}件</div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">契約金額合計</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-emerald-700">{formatAmount(summary.contractedGroup.totalAmount)}</div>
                        <div className="mt-1 text-xs text-gray-500">契約済み {summary.contractedGroup.count}件</div>
                    </CardContent>
                </Card>
            </div>

            {/* Owner bar chart */}
            {chartData.length > 0 && (
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">担当者別 案件数比較</CardTitle>
                        <CardDescription>全案件・進行中・契約済みの比較</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OwnerBarChart data={chartData} />
                    </CardContent>
                </Card>
            )}

            {/* Owner cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {summary.byOwner.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-sm text-gray-500">担当者データがありません</div>
                ) : (
                    summary.byOwner.map((owner) => {
                        const winRate = owner.totalDeals > 0 ? Math.round((owner.contractedDeals / owner.totalDeals) * 100) : 0;
                        const stat = monthlyStats.find((s) => s.userId === owner.ownerUserId);
                        return (
                            <Card key={owner.ownerUserId} className="border-gray-200 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-gray-900">{owner.ownerName}</CardTitle>
                                    <CardDescription>担当者別活動状況</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-md bg-gray-50 px-2 py-2">
                                            <div className="text-xl font-semibold text-gray-900">{owner.totalDeals}</div>
                                            <div className="text-xs text-gray-500">全案件</div>
                                        </div>
                                        <div className="rounded-md bg-gray-100 px-2 py-2">
                                            <div className="text-xl font-semibold text-gray-700">{owner.activeDeals}</div>
                                            <div className="text-xs text-gray-500">進行中</div>
                                        </div>
                                        <div className="rounded-md bg-gray-100 px-2 py-2">
                                            <div className="text-xl font-semibold text-gray-900">{owner.contractedDeals}</div>
                                            <div className="text-xs text-gray-600">契約済</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">進行中金額</span>
                                            <span className="font-medium text-gray-900">{formatAmount(owner.totalAmount)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">受注率</span>
                                            <span className="font-medium text-gray-900">{winRate}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                            <div className="h-1.5 rounded-full bg-gray-700" style={{ width: `${winRate}%` }} />
                                        </div>
                                    </div>
                                    <div className="rounded-md border border-gray-200 p-3">
                                        <p className="mb-2 text-xs font-medium text-gray-500">活動件数（今月）</p>
                                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                            <div className="rounded bg-gray-50 px-2 py-1.5">
                                                <div className="font-semibold text-gray-900">{stat ? stat.visitCount : 0}</div>
                                                <div className="text-gray-500">訪問</div>
                                            </div>
                                            <div className="rounded bg-gray-50 px-2 py-1.5">
                                                <div className="font-semibold text-gray-900">{stat ? stat.onlineCount : 0}</div>
                                                <div className="text-gray-500">オンライン</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
