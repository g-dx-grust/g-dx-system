import Link from 'next/link';
import type { DealDashboardSummary, DealStageKey } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StageBarChart } from '@/components/charts/stage-bar-chart';
import { CompanyBarChart } from '@/components/charts/company-bar-chart';

interface DealDashboardProps {
    summary: DealDashboardSummary;
}

// ワントーン：slateグレー系に統一
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

function formatAmount(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

export function DealDashboard({ summary }: DealDashboardProps) {
    const maxStageAmount = Math.max(...summary.byStage.map((s) => s.totalAmount), 1);
    const allNextActions = [...summary.nextActionsToday, ...summary.nextActionsTomorrow, ...summary.nextActionsThisWeek];
    const winRate = summary.totalDeals > 0 ? Math.round((summary.contractedGroup.count / summary.totalDeals) * 100) : 0;

    const stageChartData = summary.byStage.map((s) => ({
        stageName: s.stageName,
        count: s.count,
        totalAmount: s.totalAmount,
        color: STAGE_BAR_COLORS[s.stageKey],
    }));

    const companyChartData = summary.byCompany.map((c) => ({
        companyName: c.companyName.length > 10 ? c.companyName.slice(0, 10) + '…' : c.companyName,
        totalAmount: c.totalAmount,
        activeDeals: c.activeDeals,
    }));

    return (
        <div className="space-y-6">
            {/* サマリーカード 5列 */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">累計案件数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-gray-900">{summary.totalDeals}<span className="ml-1 text-base font-normal text-gray-500">件</span></div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">進行中案件</CardTitle>
                        <CardDescription className="text-xs text-gray-400">アポ獲得・商談中・アライアンス</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-gray-800">{summary.activeGroup.count}<span className="ml-1 text-sm font-normal text-gray-500">件</span></div>
                        <div className="mt-1 text-sm font-medium text-gray-600">{formatAmount(summary.activeGroup.totalAmount)}</div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">失注・停滞案件</CardTitle>
                        <CardDescription className="text-xs text-gray-400">ペンディング・失注・アポキャン</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-gray-800">{summary.stalledGroup.count}<span className="ml-1 text-sm font-normal text-gray-500">件</span></div>
                        <div className="mt-1 text-sm font-medium text-gray-600">{formatAmount(summary.stalledGroup.totalAmount)}</div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">契約済み</CardTitle>
                        <CardDescription className="text-xs text-gray-400">受注・契約確定</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-gray-800">{summary.contractedGroup.count}<span className="ml-1 text-sm font-normal text-gray-500">件</span></div>
                        <div className="mt-1 text-sm font-medium text-gray-600">{formatAmount(summary.contractedGroup.totalAmount)}</div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">受注率</CardTitle>
                        <CardDescription className="text-xs text-gray-400">契約済み / 累計案件数</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-gray-900">{winRate}<span className="ml-0.5 text-base font-normal">%</span></div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-gray-400 transition-all" style={{ width: `${winRate}%` }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* チャート行 */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">フェーズ別案件数</CardTitle>
                        <CardDescription>ステージごとの案件件数グラフ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StageBarChart data={stageChartData} />
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">フェーズ別内訳</CardTitle>
                        <CardDescription>各ステージの件数と金額</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {summary.byStage.map((stage) => (
                            <div key={stage.stageKey} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_BADGE[stage.stageKey]}`}>
                                            {stage.stageName}
                                        </span>
                                        <span className="font-medium text-gray-900">{stage.count}件</span>
                                    </div>
                                    <span className="text-gray-600">{formatAmount(stage.totalAmount)}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-1.5 rounded-full bg-gray-400 transition-all"
                                        style={{ width: `${maxStageAmount > 0 ? (stage.totalAmount / maxStageAmount) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {summary.byStage.every((s) => s.count === 0) && (
                            <p className="py-4 text-center text-sm text-gray-500">案件データがありません</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 会社別チャート */}
            {companyChartData.length > 0 && (
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">会社別 進行中案件金額 Top10</CardTitle>
                        <CardDescription>アポ獲得・商談中・アライアンスの案件金額（会社別）</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CompanyBarChart data={companyChartData} />
                    </CardContent>
                </Card>
            )}

            {/* ネクストアクション */}
            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">ネクストアクション</CardTitle>
                    <CardDescription>今日・明日・今週のアクション予定</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {allNextActions.length === 0 ? (
                        <p className="py-4 text-center text-sm text-gray-500">次回アクション日が設定された案件はありません</p>
                    ) : (
                        <>
                            {summary.nextActionsToday.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-700">本日 ({summary.nextActionsToday.length}件)</p>
                                    <div className="space-y-2">
                                        {summary.nextActionsToday.map((item) => (
                                            <NextActionRow key={item.dealId} item={item} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {summary.nextActionsTomorrow.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-500">明日 ({summary.nextActionsTomorrow.length}件)</p>
                                    <div className="space-y-2">
                                        {summary.nextActionsTomorrow.map((item) => (
                                            <NextActionRow key={item.dealId} item={item} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {summary.nextActionsThisWeek.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-400">今週 ({summary.nextActionsThisWeek.length}件)</p>
                                    <div className="space-y-2">
                                        {summary.nextActionsThisWeek.map((item) => (
                                            <NextActionRow key={item.dealId} item={item} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function NextActionRow({ item }: { item: { dealId: string; dealName: string; companyName: string; stageName: string; stageKey: DealStageKey; amount: number | null; ownerName: string; nextActionDate: string; nextActionContent: string | null; acquisitionMethod: string | null } }) {
    return (
        <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-2">
                <Link href={`/sales/deals/${item.dealId}`} className="font-medium text-gray-900 hover:underline">
                    {item.dealName}
                </Link>
                <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_BADGE[item.stageKey]}`}>
                    {item.stageName}
                </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                <span>{item.companyName}</span>
                <span>{item.ownerName}</span>
                {item.nextActionDate && <span>{item.nextActionDate}</span>}
                {item.amount !== null && <span>{formatAmount(item.amount)}</span>}
            </div>
            {item.nextActionContent && (
                <p className="mt-1 text-xs text-gray-600">{item.nextActionContent}</p>
            )}
        </div>
    );
}
