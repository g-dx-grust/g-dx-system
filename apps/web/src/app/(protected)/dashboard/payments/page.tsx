import { redirect } from 'next/navigation';
import { getContractDashboard } from '@/modules/sales/contract/application/get-contract-dashboard';
import { isAppError } from '@/shared/server/errors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { ContractStatus } from '@g-dx/contracts';

const STATUS_LABELS: Record<ContractStatus, string> = {
    CONTRACTED: '契約',
    INVOICED: '請求書発行',
    PAID: '入金済み',
    SERVICE_STARTED: 'サービス開始',
    SERVICE_ENDED: 'サービス終了',
};

const STATUS_COLORS: Record<ContractStatus, { card: string; badge: string }> = {
    CONTRACTED: { card: 'border-gray-200 bg-gray-50', badge: 'bg-gray-200 text-gray-700' },
    INVOICED: { card: 'border-gray-200 bg-gray-50', badge: 'bg-gray-300 text-gray-700' },
    PAID: { card: 'border-gray-200 bg-white', badge: 'bg-gray-900 text-white' },
    SERVICE_STARTED: { card: 'border-gray-200 bg-white', badge: 'bg-gray-700 text-white' },
    SERVICE_ENDED: { card: 'border-gray-200 bg-gray-50', badge: 'bg-gray-100 text-gray-600' },
};

function formatAmount(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

export default async function PaymentDashboardPage() {
    let summary;
    try {
        summary = await getContractDashboard();
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">入金関連ダッシュボード</h1>
                    <p className="mt-1 text-sm text-gray-500">契約・請求・入金・サービス提供状況のトラッキング</p>
                </div>
                <Link href="/sales/contracts" className="text-sm text-gray-600 hover:underline">
                    契約一覧を見る →
                </Link>
            </div>

            {/* Status cards */}
            <div className="grid gap-4 md:grid-cols-5">
                {summary.byStatus.map((s) => (
                    <Card key={s.status} className={`shadow-sm ${STATUS_COLORS[s.status].card}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{s.count}<span className="ml-1 text-sm font-normal">件</span></div>
                            <div className="mt-1 text-xs font-medium">{formatAmount(s.totalAmount)}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Summary cards row */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">入金済み合計</CardTitle>
                        <CardDescription className="text-xs text-gray-500">入金確認済みの総額</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-gray-900">{formatAmount(summary.paidGroup.totalAmount)}</div>
                        <div className="mt-1 text-sm text-gray-500">{summary.paidGroup.count}件</div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">サービス稼働中</CardTitle>
                        <CardDescription className="text-xs text-gray-500">現在サービス提供中の契約</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-gray-900">{summary.activeServiceGroup.count}<span className="ml-1 text-base font-normal">件</span></div>
                        <div className="mt-1 text-sm text-gray-500">{formatAmount(summary.activeServiceGroup.totalAmount)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent contracts */}
            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">最近の契約 (直近10件)</CardTitle>
                    <CardDescription>登録日順</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {summary.recentContracts.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">契約データがありません</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                        <th className="px-4 py-3">タイトル</th>
                                        <th className="px-4 py-3">会社</th>
                                        <th className="px-4 py-3">ステータス</th>
                                        <th className="px-4 py-3">金額</th>
                                        <th className="px-4 py-3">契約日</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summary.recentContracts.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link href={`/sales/contracts/${c.id}`} className="font-medium text-gray-900 hover:underline">
                                                    {c.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{c.company.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contractStatus].badge}`}>
                                                    {STATUS_LABELS[c.contractStatus]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{c.amount !== null ? formatAmount(c.amount) : '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{c.contractDate ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
