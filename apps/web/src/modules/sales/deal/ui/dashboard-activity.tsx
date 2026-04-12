import type { DealDashboardSummary } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OwnerBarChart } from '@/components/charts/owner-bar-chart';
import {
    DashboardMetricCard,
    formatDashboardAmount,
} from './dashboard-primitives';

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

export function ActivityDashboard({
    summary,
    monthlyStats = [],
}: ActivityDashboardProps) {
    const chartData = summary.byOwner.map((owner) => ({
        ownerName: owner.ownerName,
        totalDeals: owner.totalDeals,
        activeDeals: owner.activeDeals,
        contractedDeals: owner.contractedDeals,
    }));
    const monthlyActivityTotal = monthlyStats.reduce(
        (sum, stat) => sum + stat.totalCount,
        0,
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard
                    title="登録メンバー"
                    description="稼働メンバー数"
                    value={`${summary.byOwner.length.toLocaleString()}名`}
                />
                <DashboardMetricCard
                    title="今月活動総数"
                    description="活動件数"
                    value={`${monthlyActivityTotal.toLocaleString()}件`}
                    footnote="メンバー別内訳"
                />
                <DashboardMetricCard
                    title="進行中案件"
                    description="進行中件数 / 金額"
                    value={`${summary.activeGroup.count.toLocaleString()}件`}
                    footnote={`進行中総額 ${formatDashboardAmount(summary.activeGroup.totalAmount)}`}
                    href="/sales/deals"
                />
                <DashboardMetricCard
                    title="契約済み案件"
                    description="契約累計"
                    value={`${summary.contractedGroup.count.toLocaleString()}件`}
                    footnote={`契約総額 ${formatDashboardAmount(summary.contractedGroup.totalAmount)}`}
                    href="/sales/contracts"
                />
            </div>

            {chartData.length > 0 ? (
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">
                            担当者別の案件比較
                        </CardTitle>
                        <CardDescription>
                            案件数 / 活動 / 金額
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OwnerBarChart data={chartData} />
                    </CardContent>
                </Card>
            ) : null}

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">
                        メンバー別の状況
                    </CardTitle>
                    <CardDescription>
                        メンバー一覧
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {summary.byOwner.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-gray-500">
                            担当者データがありません
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100 md:hidden">
                                {summary.byOwner.map((owner) => {
                                    const stat = monthlyStats.find(
                                        (item) => item.userId === owner.ownerUserId,
                                    );
                                    const winRate =
                                        owner.totalDeals > 0
                                            ? Math.round(
                                                  (owner.contractedDeals / owner.totalDeals) * 100,
                                              )
                                            : 0;

                                    return (
                                        <section
                                            key={owner.ownerUserId}
                                            className="space-y-2 px-4 py-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {owner.ownerName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        全案件 {owner.totalDeals}件 / 今月活動{' '}
                                                        {stat?.totalCount ?? 0}件
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    受注率 {winRate}%
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                                    <p className="text-gray-500">進行中</p>
                                                    <p className="mt-1 font-semibold text-gray-900">
                                                        {owner.activeDeals}件
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                                    <p className="text-gray-500">契約済み</p>
                                                    <p className="mt-1 font-semibold text-gray-900">
                                                        {owner.contractedDeals}件
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                                    <p className="text-gray-500">進行中金額</p>
                                                    <p className="mt-1 font-semibold text-gray-900">
                                                        {formatDashboardAmount(owner.totalAmount)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                訪問 {stat?.visitCount ?? 0}件 / オンライン{' '}
                                                {stat?.onlineCount ?? 0}件
                                            </p>
                                        </section>
                                    );
                                })}
                            </div>

                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                                            <th className="px-4 py-3">担当者</th>
                                            <th className="px-4 py-3">案件状況</th>
                                            <th className="px-4 py-3">今月活動</th>
                                            <th className="px-4 py-3">進行中金額</th>
                                            <th className="px-4 py-3 text-right">受注率</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {summary.byOwner.map((owner) => {
                                            const stat = monthlyStats.find(
                                                (item) => item.userId === owner.ownerUserId,
                                            );
                                            const winRate =
                                                owner.totalDeals > 0
                                                    ? Math.round(
                                                          (owner.contractedDeals /
                                                              owner.totalDeals) *
                                                              100,
                                                      )
                                                    : 0;

                                            return (
                                                <tr
                                                    key={owner.ownerUserId}
                                                    className="align-top hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-900">
                                                            {owner.ownerName}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            全案件 {owner.totalDeals}件
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        <p>進行中 {owner.activeDeals}件</p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            契約済み {owner.contractedDeals}件
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        <p>{stat?.totalCount ?? 0}件</p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            訪問 {stat?.visitCount ?? 0}件 / オンライン{' '}
                                                            {stat?.onlineCount ?? 0}件
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {formatDashboardAmount(owner.totalAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                                                        {winRate}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
