import type { DealOwnerStat } from '@g-dx/contracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MonthlyActivityStat {
    userId: string;
    userName: string;
    visitCount: number;
    onlineCount: number;
    totalCount: number;
}

interface MemberViewTabsProps {
    owners: DealOwnerStat[];
    monthlyStats: MonthlyActivityStat[];
}

function formatAmount(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

export function MemberViewTabs({ owners, monthlyStats }: MemberViewTabsProps) {
    if (owners.length === 0) {
        return (
            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">メンバービュー</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">担当者データがありません</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">メンバービュー</CardTitle>
                <CardDescription>チーム全体の活動状況サマリー</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {owners.map((owner) => {
                        const winRate = owner.totalDeals > 0 ? Math.round((owner.contractedDeals / owner.totalDeals) * 100) : 0;
                        const stat = monthlyStats.find((s) => s.userId === owner.ownerUserId);
                        return (
                            <div key={owner.ownerUserId} className="rounded-lg border border-gray-200 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900">{owner.ownerName}</h3>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                        {winRate}%受注
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="rounded bg-gray-50 px-1.5 py-1.5">
                                        <div className="text-lg font-semibold text-gray-900">{owner.activeDeals}</div>
                                        <div className="text-gray-500">進行中</div>
                                    </div>
                                    <div className="rounded bg-gray-50 px-1.5 py-1.5">
                                        <div className="text-lg font-semibold text-gray-900">{owner.contractedDeals}</div>
                                        <div className="text-gray-500">契約済</div>
                                    </div>
                                    <div className="rounded bg-gray-50 px-1.5 py-1.5">
                                        <div className="text-lg font-semibold text-gray-900">{stat?.totalCount ?? 0}</div>
                                        <div className="text-gray-500">今月活動</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-right text-xs text-gray-500">
                                    進行中金額: {formatAmount(owner.totalAmount)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
