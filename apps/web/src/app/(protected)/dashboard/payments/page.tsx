import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ContractStatus } from '@g-dx/contracts';
import { getContractDashboard } from '@/modules/sales/contract/application/get-contract-dashboard';
import { DashboardMetricCard } from '@/modules/sales/deal/ui/dashboard-primitives';
import { isAppError } from '@/shared/server/errors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_LABELS: Record<ContractStatus, string> = {
    CONTRACTED: '契約',
    INVOICED: '請求書発行',
    PAID: '入金済み',
    SERVICE_STARTED: 'サービス開始',
    SERVICE_ENDED: 'サービス終了',
};

const STATUS_DESCRIPTIONS: Record<ContractStatus, string> = {
    CONTRACTED: '契約済 / 請求前',
    INVOICED: '請求済 / 入金待ち',
    PAID: '入金完了',
    SERVICE_STARTED: '提供中',
    SERVICE_ENDED: '提供終了',
};

const STATUS_BADGES: Record<ContractStatus, string> = {
    CONTRACTED: 'bg-gray-100 text-gray-700',
    INVOICED: 'bg-gray-200 text-gray-700',
    PAID: 'bg-gray-900 text-white',
    SERVICE_STARTED: 'bg-gray-700 text-white',
    SERVICE_ENDED: 'bg-gray-100 text-gray-600',
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
        if (
            isAppError(error, 'FORBIDDEN') ||
            isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')
        ) {
            redirect('/unauthorized');
        }
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        入金関連ダッシュボード
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        契約 / 請求 / 入金 / 提供状況
                    </p>
                </div>
                <Link href="/sales/contracts" className="text-sm text-gray-600 hover:underline">
                    契約一覧を見る →
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <DashboardMetricCard
                    title="入金済み合計"
                    description="入金完了総額"
                    value={formatAmount(summary.paidGroup.totalAmount)}
                    footnote={`${summary.paidGroup.count.toLocaleString()}件`}
                    href="/sales/contracts"
                />
                <DashboardMetricCard
                    title="サービス稼働中"
                    description="提供中件数 / 金額"
                    value={`${summary.activeServiceGroup.count.toLocaleString()}件`}
                    footnote={formatAmount(summary.activeServiceGroup.totalAmount)}
                    href="/sales/contracts"
                />
            </div>

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">
                        契約ステータス一覧
                    </CardTitle>
                    <CardDescription>
                        ステータス別件数 / 金額
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {summary.byStatus.map((status) => (
                        <section
                            key={status.status}
                            className="rounded-xl border border-gray-200 px-4 py-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[status.status]}`}
                                        >
                                            {STATUS_LABELS[status.status]}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-500">
                                        {STATUS_DESCRIPTIONS[status.status]}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-gray-900">
                                        {status.count.toLocaleString()}件
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatAmount(status.totalAmount)}
                                    </p>
                                </div>
                            </div>
                        </section>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">最近の契約</CardTitle>
                    <CardDescription>直近10件</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {summary.recentContracts.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            契約データがありません
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                                        <th className="px-4 py-3">タイトル</th>
                                        <th className="px-4 py-3">会社</th>
                                        <th className="px-4 py-3">ステータス</th>
                                        <th className="px-4 py-3">金額</th>
                                        <th className="px-4 py-3">契約日</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summary.recentContracts.map((contract) => (
                                        <tr key={contract.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/sales/contracts/${contract.id}`}
                                                    className="font-medium text-gray-900 hover:underline"
                                                >
                                                    {contract.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {contract.company.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[contract.contractStatus]}`}
                                                >
                                                    {STATUS_LABELS[contract.contractStatus]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {contract.amount !== null
                                                    ? formatAmount(contract.amount)
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {contract.contractDate ?? '-'}
                                            </td>
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
