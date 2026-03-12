'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CallListItem, CallResult } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { recordCallAction } from '@/modules/call/server-actions';

const RESULT_LABELS: Record<CallResult, string> = {
    CONNECTED: '繋がった',
    NO_ANSWER: '不在',
    BUSY: '話中',
    VOICEMAIL: '留守電',
    CALLBACK_REQUESTED: '折り返し希望',
};

const RESULT_PILL_STYLES: Record<CallResult, string> = {
    CONNECTED: 'bg-gray-900 text-white',
    NO_ANSWER: 'bg-gray-100 text-gray-600',
    BUSY: 'bg-gray-200 text-gray-600',
    VOICEMAIL: 'bg-gray-200 text-gray-700',
    CALLBACK_REQUESTED: 'bg-gray-300 text-gray-700',
};

const RESULT_OPTIONS: { value: CallResult; label: string }[] = [
    { value: 'CONNECTED', label: '繋がった' },
    { value: 'NO_ANSWER', label: '不在' },
    { value: 'BUSY', label: '話中' },
    { value: 'VOICEMAIL', label: '留守電' },
    { value: 'CALLBACK_REQUESTED', label: '折り返し希望' },
];

function nowJST(): string {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 16);
}

function formatJST(iso: string): string {
    return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(sec: number | null): string {
    if (sec === null) return '-';
    if (sec < 60) return `${sec}秒`;
    return `${Math.floor(sec / 60)}分${sec % 60 > 0 ? (sec % 60) + '秒' : ''}`;
}

interface CallHistoryViewProps {
    calls: CallListItem[];
    total: number;
    keyword?: string;
    result?: string;
    companies: { id: string; name: string }[];
    recorded?: boolean;
}

export function CallHistoryView({ calls, total, keyword, result, companies, recorded = false }: CallHistoryViewProps) {
    const router = useRouter();
    const [kw, setKw] = useState(keyword ?? '');
    const [selectedFilter, setSelectedFilter] = useState(result ?? '');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedResult, setSelectedResult] = useState<CallResult>('CONNECTED');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (kw) params.set('keyword', kw);
        if (selectedFilter) params.set('result', selectedFilter);
        router.push(`/calls/history?${params.toString()}`);
    }

    function handleClear() {
        setKw('');
        setSelectedFilter('');
        router.push('/calls/history');
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">コール履歴</h1>
                    <p className="text-sm text-gray-500">全 {total}件のコール記録</p>
                </div>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    title="コールを記録"
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            {/* ── Success message ── */}
            {recorded && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    コール記録を登録しました。
                </div>
            )}

            {/* ── Add form ── */}
            {showAddForm && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">コールを記録</CardTitle>
                        <CardDescription>通話記録を手動で追加します。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={recordCallAction} className="grid gap-4 md:grid-cols-2">
                            <input type="hidden" name="result" value={selectedResult} />

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                会社 <span className="text-red-500">*</span>
                                <select
                                    name="companyId"
                                    required
                                    className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">-- 会社を選択 --</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                架電日時 <span className="text-red-500">*</span>
                                <Input name="calledAt" type="datetime-local" required defaultValue={nowJST()} />
                            </label>

                            <div className="md:col-span-2">
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    結果 <span className="text-red-500">*</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {RESULT_OPTIONS.map((o) => (
                                        <button
                                            key={o.value}
                                            type="button"
                                            onClick={() => setSelectedResult(o.value)}
                                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                                                selectedResult === o.value
                                                    ? RESULT_PILL_STYLES[o.value] + ' border-transparent ring-2 ring-blue-400 ring-offset-1'
                                                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                通話時間（秒）
                                <Input name="durationSec" type="number" min="0" placeholder="120" />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                メモ
                                <Input name="notes" placeholder="通話内容など" />
                            </label>
                            <div className="flex gap-2 md:col-span-2">
                                <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">記録</Button>
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="px-5">キャンセル</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* ── Search ── */}
            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
                        <input
                            type="search"
                            value={kw}
                            onChange={(e) => setKw(e.target.value)}
                            placeholder="会社名で検索"
                            className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">全結果</option>
                            {RESULT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">検索</Button>
                            {(kw || selectedFilter) ? (
                                <Button type="button" variant="outline" onClick={handleClear} className="px-5">クリア</Button>
                            ) : null}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ── Summary cards ── */}
            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="grid grid-cols-5 divide-x divide-gray-200">
                        {RESULT_OPTIONS.map((o) => {
                            const count = calls.filter((c) => c.result === o.value).length;
                            return (
                                <div key={o.value} className="px-4 py-3 text-center">
                                    <p className="text-lg font-semibold text-gray-900">{count}</p>
                                    <p className="text-xs text-gray-500">{o.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── History table ── */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">コール記録</CardTitle>
                    <CardDescription>
                        過去の架電記録の一覧です。
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {calls.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            コール記録がありません。
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">架電日時</th>
                                        <th className="px-6 py-3 font-medium">会社名</th>
                                        <th className="px-6 py-3 font-medium">コンタクト</th>
                                        <th className="px-6 py-3 font-medium">結果</th>
                                        <th className="px-6 py-3 font-medium">通話時間</th>
                                        <th className="px-6 py-3 font-medium">担当者</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                    {calls.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatJST(c.calledAt)}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <Link
                                                    href={`/customers/companies/${c.company.id}`}
                                                    className="hover:text-gray-700 hover:underline"
                                                >
                                                    {c.company.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">{c.contact?.name ?? '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_PILL_STYLES[c.result]}`}>
                                                    {RESULT_LABELS[c.result]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{formatDuration(c.durationSec)}</td>
                                            <td className="px-6 py-4">{c.assignedUser.name}</td>
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
