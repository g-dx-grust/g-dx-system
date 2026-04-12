import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { AllianceListItem, AllianceStatus, AllianceType } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AllianceListProps {
    alliances: AllianceListItem[];
    total: number;
    keyword?: string;
    status?: string;
    created?: boolean;
}

const TYPE_LABELS: Record<AllianceType, string> = {
    COMPANY: '法人',
    INDIVIDUAL: '個人',
};

const STATUS_LABELS: Record<AllianceStatus, string> = {
    PROSPECT: '候補',
    ACTIVE: 'アクティブ',
    INACTIVE: '非アクティブ',
};

const STATUS_COLORS: Record<AllianceStatus, string> = {
    PROSPECT: 'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-blue-100 text-blue-700',
    INACTIVE: 'bg-gray-50 text-gray-400',
};

export function AllianceList({ alliances, total, keyword, status, created = false }: AllianceListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">アライアンス一覧</h1>
                    <p className="text-sm text-gray-500">{total}件</p>
                </div>
                <Button asChild size="icon" className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700" title="新規アライアンス登録">
                    <Link href="/sales/alliances/new"><Plus className="h-5 w-5" /></Link>
                </Button>
            </div>

            {created ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    アライアンスを登録しました。
                </div>
            ) : null}

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form action="/sales/alliances" className="flex flex-col gap-3 md:flex-row">
                        <input
                            type="search"
                            name="keyword"
                            defaultValue={keyword ?? ''}
                            placeholder="名前で検索"
                            className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <select
                            name="status"
                            defaultValue={status ?? ''}
                            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-auto"
                        >
                            <option value="">すべてのステータス</option>
                            {(Object.entries(STATUS_LABELS) as [AllianceStatus, string][]).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="h-10 rounded-md bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            絞り込み
                        </button>
                    </form>
                </CardContent>
            </Card>

            {alliances.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
                    アライアンスがありません
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* モバイル: カード表示 */}
                    <div className="divide-y divide-gray-100 md:hidden">
                        {alliances.map((alliance) => (
                            <div key={alliance.id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/sales/alliances/${alliance.id}`}
                                            className="block truncate font-medium text-gray-900 hover:underline"
                                        >
                                            {alliance.name}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-gray-500">{alliance.contactPersonName ?? '-'}</p>
                                    </div>
                                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[alliance.relationshipStatus]}`}>
                                        {STATUS_LABELS[alliance.relationshipStatus]}
                                    </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                    <span>{TYPE_LABELS[alliance.allianceType]}</span>
                                    <span>案件 {alliance.linkedDealCount}件</span>
                                    <span>{new Date(alliance.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* デスクトップ: テーブル表示 */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">名前</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">種別</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">担当者</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ステータス</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">紐付き案件</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">登録日</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {alliances.map((alliance) => (
                                    <tr key={alliance.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/sales/alliances/${alliance.id}`}
                                                className="font-medium text-gray-900 hover:underline"
                                            >
                                                {alliance.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[alliance.allianceType]}</td>
                                        <td className="px-4 py-3 text-gray-600">{alliance.contactPersonName ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[alliance.relationshipStatus]}`}>
                                                {STATUS_LABELS[alliance.relationshipStatus]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">{alliance.linkedDealCount}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {new Date(alliance.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
