'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ContractListItem, ContractStatus } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ContractListProps {
    contracts: ContractListItem[];
    total: number;
    keyword?: string;
    status?: string;
    created?: boolean;
}

const STATUS_LABELS: Record<ContractStatus, string> = {
    CONTRACTED: '契約',
    INVOICED: '請求書発行',
    PAID: '入金済み',
    SERVICE_STARTED: 'サービス開始',
    SERVICE_ENDED: 'サービス終了',
};

const STATUS_COLORS: Record<ContractStatus, string> = {
    CONTRACTED: 'bg-gray-200 text-gray-700',
    INVOICED: 'bg-gray-300 text-gray-700',
    PAID: 'bg-gray-900 text-white',
    SERVICE_STARTED: 'bg-gray-700 text-white',
    SERVICE_ENDED: 'bg-gray-100 text-gray-600',
};

function formatAmount(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

export function ContractList({ contracts, total, keyword, status, created = false }: ContractListProps) {
    const router = useRouter();
    const [kw, setKw] = useState(keyword ?? '');
    const [selectedStatus, setSelectedStatus] = useState(status ?? '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (kw) params.set('keyword', kw);
        if (selectedStatus) params.set('status', selectedStatus);
        router.push(`/sales/contracts?${params.toString()}`);
    }

    function handleClear() {
        setKw('');
        setSelectedStatus('');
        router.push('/sales/contracts');
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">契約一覧</h1>
                    <p className="text-sm text-gray-500">全 {total} 件の契約</p>
                </div>
                <Button asChild size="icon" className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700" title="新規契約登録">
                    <Link href="/sales/contracts/new"><Plus className="h-5 w-5" /></Link>
                </Button>
            </div>

            {created && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    契約を登録しました。
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="flex flex-col gap-2 md:flex-row md:flex-wrap">
                <Input
                    value={kw}
                    onChange={(e) => setKw(e.target.value)}
                    placeholder="会社名・契約タイトルで検索..."
                    className="w-full md:w-64"
                />
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-auto"
                >
                    <option value="">全ステータス</option>
                    {(Object.entries(STATUS_LABELS) as [ContractStatus, string][]).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-blue-600 px-6 text-white hover:bg-blue-700 md:flex-none">検索</Button>
                    {(kw || selectedStatus) && (
                        <Button type="button" variant="outline" onClick={handleClear} className="flex-1 px-5 md:flex-none">クリア</Button>
                    )}
                </div>
            </form>

            {/* Status summary cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {(Object.entries(STATUS_LABELS) as [ContractStatus, string][]).map(([s, label]) => {
                    const count = contracts.filter((c) => c.contractStatus === s).length;
                    return (
                        <div key={s} className={`rounded-md border px-3 py-2 text-center ${STATUS_COLORS[s as ContractStatus]}`}>
                            <div className="text-lg font-semibold">{count}</div>
                            <div className="text-xs">{label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <Card className="shadow-sm">
                <CardContent className="p-0">
                    {contracts.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-500">契約データがありません</div>
                    ) : (
                        <>
                            {/* モバイル: カード表示 */}
                            <div className="divide-y divide-gray-100 md:hidden">
                                {contracts.map((c) => (
                                    <div key={c.id} className="px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/sales/contracts/${c.id}`}
                                                    className="block truncate font-medium text-gray-900 hover:underline"
                                                >
                                                    {c.title}
                                                </Link>
                                                <p className="mt-0.5 truncate text-xs text-gray-500">{c.company.name}</p>
                                            </div>
                                            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contractStatus]}`}>
                                                {STATUS_LABELS[c.contractStatus]}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                            {c.amount !== null && (
                                                <span className="font-medium text-gray-700">{formatAmount(c.amount)}</span>
                                            )}
                                            {c.contractDate && <span>契約 {c.contractDate}</span>}
                                            {c.serviceStartDate && <span>開始 {c.serviceStartDate}</span>}
                                            <span>{c.ownerUser.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* デスクトップ: テーブル表示 */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                            <th className="px-4 py-3">タイトル</th>
                                            <th className="px-4 py-3">会社名</th>
                                            <th className="px-4 py-3">ステータス</th>
                                            <th className="px-4 py-3">金額</th>
                                            <th className="px-4 py-3">契約日</th>
                                            <th className="px-4 py-3">サービス開始</th>
                                            <th className="px-4 py-3">担当者</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {contracts.map((c) => (
                                            <tr key={c.id} className="transition-colors hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <Link href={`/sales/contracts/${c.id}`} className="font-medium text-gray-900 hover:text-gray-700 hover:underline">
                                                        {c.title}
                                                    </Link>
                                                    {c.contractNumber && (
                                                        <div className="text-xs text-gray-400">{c.contractNumber}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{c.company.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contractStatus]}`}>
                                                        {STATUS_LABELS[c.contractStatus]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {c.amount !== null ? formatAmount(c.amount) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{c.contractDate ?? '-'}</td>
                                                <td className="px-4 py-3 text-gray-600">{c.serviceStartDate ?? '-'}</td>
                                                <td className="px-4 py-3 text-gray-600">{c.ownerUser.name}</td>
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
