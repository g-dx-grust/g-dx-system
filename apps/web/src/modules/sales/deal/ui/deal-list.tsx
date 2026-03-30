import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { DealListItem, DealStageKey } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DealListProps {
    deals: DealListItem[];
    total: number;
    keyword?: string;
    stage?: string;
    created?: boolean;
}

const STAGE_LABELS: Record<DealStageKey, string> = {
    APO_ACQUIRED: 'アポ獲得',
    NEGOTIATING: '商談中・見積提示',
    ALLIANCE: 'アライアンス',
    PENDING: 'ペンディング',
    APO_CANCELLED: 'アポキャン',
    LOST: '失注・不明',
    CONTRACTED: '契約済み',
};

const STAGE_COLORS: Record<DealStageKey, string> = {
    APO_ACQUIRED: 'bg-gray-200 text-gray-700',
    NEGOTIATING: 'bg-gray-300 text-gray-700',
    ALLIANCE: 'bg-gray-200 text-gray-600',
    PENDING: 'bg-gray-100 text-gray-500',
    APO_CANCELLED: 'bg-gray-200 text-gray-500',
    LOST: 'bg-red-100 text-red-700',
    CONTRACTED: 'bg-gray-900 text-white',
};

export function DealList({ deals, total, keyword, stage, created = false }: DealListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">案件一覧</h1>
                    <p className="text-sm text-gray-500">
                        案件 {total}件
                    </p>
                </div>
                <Button asChild size="icon" className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700" title="新規案件登録">
                    <Link href="/sales/deals/new"><Plus className="h-5 w-5" /></Link>
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form action="/sales/deals" className="flex flex-col gap-3 md:flex-row">
                        <input
                            type="search"
                            name="keyword"
                            defaultValue={keyword ?? ''}
                            placeholder="案件名で検索"
                            className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <select
                            name="stage"
                            defaultValue={stage ?? ''}
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">すべてのステージ</option>
                            {(Object.entries(STAGE_LABELS) as [DealStageKey, string][]).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1 bg-blue-600 px-6 text-white hover:bg-blue-700 md:flex-none">
                                検索
                            </Button>
                            {(keyword || stage) ? (
                                <Button asChild variant="outline" className="flex-1 px-5 md:flex-none">
                                    <Link href="/sales/deals">クリア</Link>
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {created ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    案件を作成しました。
                </div>
            ) : null}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">案件リスト</CardTitle>
                    <CardDescription>案件一覧</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {deals.length === 0 ? (
                        <div className="px-6 py-12 text-sm text-gray-500">
                            {keyword || stage
                                ? '条件に一致する案件はありません。'
                                : 'このビジネスにはまだ案件がありません。'}
                        </div>
                    ) : (
                        <>
                            {/* モバイル: カード表示 */}
                            <div className="divide-y divide-gray-100 md:hidden">
                                {deals.map((deal) => (
                                    <div key={deal.id} className="px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/sales/deals/${deal.id}`}
                                                    className="block truncate font-medium text-gray-900 hover:underline"
                                                >
                                                    {deal.name}
                                                </Link>
                                                <Link
                                                    href={`/customers/companies/${deal.company.id}`}
                                                    className="mt-0.5 block text-xs text-gray-500 hover:underline"
                                                >
                                                    {deal.company.name}
                                                </Link>
                                            </div>
                                            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[deal.stage]}`}>
                                                {STAGE_LABELS[deal.stage]}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                            <span>{deal.ownerUser.name}</span>
                                            {deal.amount !== null && (
                                                <span className="font-medium text-gray-700">¥{deal.amount.toLocaleString()}</span>
                                            )}
                                            {deal.expectedCloseDate && (
                                                <span>〆{deal.expectedCloseDate}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* デスクトップ: テーブル表示 */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 text-left text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">案件名</th>
                                            <th className="px-6 py-3 font-medium">会社</th>
                                            <th className="px-6 py-3 font-medium">ステージ</th>
                                            <th className="px-6 py-3 font-medium">金額</th>
                                            <th className="px-6 py-3 font-medium">担当者</th>
                                            <th className="px-6 py-3 font-medium">クローズ予定</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                        {deals.map((deal) => (
                                            <tr key={deal.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <Link
                                                        href={`/sales/deals/${deal.id}`}
                                                        className="hover:text-gray-700 hover:underline"
                                                    >
                                                        {deal.name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link
                                                        href={`/customers/companies/${deal.company.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {deal.company.name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[deal.stage]}`}>
                                                        {STAGE_LABELS[deal.stage]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {deal.amount !== null
                                                        ? `¥${deal.amount.toLocaleString()}`
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4">{deal.ownerUser.name}</td>
                                                <td className="px-6 py-4">{deal.expectedCloseDate ?? '-'}</td>
                                            </tr>
                                        ))}
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
