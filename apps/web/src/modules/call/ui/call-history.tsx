'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Clock, FileText, ChevronRight } from 'lucide-react';
import type { CallListItem, CallResult } from '@g-dx/contracts';
import { CALL_RESULT_OPTIONS, CALL_RESULT_LABELS, CALL_RESULT_STYLES, QUICK_COMPLETE_STATUSES, NEXT_CALL_DATETIME_STATUSES } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { recordCallAction } from '@/modules/call/server-actions';

function formatJST(iso: string): string {
    return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function HistoryRecordForm({ selectedResult, showNextCallDatetime, isPending, onSubmit, onCancel }: {
    selectedResult: CallResult;
    showNextCallDatetime: boolean;
    isPending: boolean;
    onSubmit: (formData: FormData) => void;
    onCancel: () => void;
}) {
    function handleAction(formData: FormData) {
        const selectEl = document.getElementById('history-company-select') as HTMLSelectElement | null;
        if (selectEl?.value) {
            formData.set('companyId', selectEl.value);
        }
        onSubmit(formData);
    }

    return (
        <form action={handleAction} className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <input type="hidden" name="result" value={selectedResult} />

            {showNextCallDatetime && (
                <label className="grid gap-2 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        次回コール日時
                    </span>
                    <Input name="nextCallDatetime" type="datetime-local" />
                </label>
            )}

            <label className="grid gap-2 text-sm font-medium text-gray-700">
                <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    メモ
                </span>
                <textarea
                    name="notes"
                    placeholder="通話内容など"
                    rows={2}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </label>

            <div className="flex gap-2">
                <Button type="submit" disabled={isPending} className="gap-1.5 bg-blue-600 px-6 text-white hover:bg-blue-700">
                    {isPending ? '記録中...' : '記録'}
                    {!isPending && <ChevronRight className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="px-5">
                    キャンセル
                </Button>
            </div>
        </form>
    );
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
    const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
    const [isPending, startTransition] = useTransition();
    const [successMessage, setSuccessMessage] = useState(recorded ? 'コール記録を登録しました。' : '');

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

    function handleResultSelect(r: CallResult) {
        setSelectedResult(r);
    }

    function handleFormSubmit(formData: FormData) {
        startTransition(async () => {
            const res = await recordCallAction(null, formData);
            if (res.success) {
                setSuccessMessage('コール記録を登録しました。');
                setShowAddForm(false);
                setSelectedResult(null);
                router.refresh();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        });
    }

    const showDetailForm = selectedResult !== null;
    const showNextCallDatetime = selectedResult && NEXT_CALL_DATETIME_STATUSES.includes(selectedResult);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">コール履歴</h1>
                    <p className="text-sm text-gray-500">全 {total}件のコール記録</p>
                </div>
                <Button
                    onClick={() => { setShowAddForm(!showAddForm); setSelectedResult(null); }}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    title="コールを記録"
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            {/* Success message */}
            {successMessage && (
                <div className="animate-in fade-in slide-in-from-top-1 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {successMessage}
                </div>
            )}

            {/* Add form */}
            {showAddForm && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">コールを記録</CardTitle>
                        <CardDescription>通話記録追加</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Company select */}
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            会社 <span className="text-red-500">*</span>
                            <select
                                id="history-company-select"
                                required
                                className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">-- 会社を選択 --</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </label>

                        {/* Status buttons */}
                        <div>
                            <p className="mb-3 text-sm font-medium text-gray-700">
                                結果を選択 <span className="text-red-500">*</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                {CALL_RESULT_OPTIONS.map((o) => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => handleResultSelect(o.value)}
                                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                                            selectedResult === o.value
                                                ? CALL_RESULT_STYLES[o.value] + ' border-transparent ring-2 ring-blue-400 ring-offset-1'
                                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Detail form */}
                        {showDetailForm && (
                            <HistoryRecordForm
                                selectedResult={selectedResult!}
                                showNextCallDatetime={!!showNextCallDatetime}
                                isPending={isPending}
                                onSubmit={handleFormSubmit}
                                onCancel={() => { setShowAddForm(false); setSelectedResult(null); }}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Search */}
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
                            {CALL_RESULT_OPTIONS.map((o) => (
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

            {/* Summary cards */}
            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 divide-x divide-gray-200">
                        {CALL_RESULT_OPTIONS.map((o) => {
                            const count = calls.filter((c) => c.result === o.value).length;
                            return (
                                <div key={o.value} className="px-3 py-3 text-center">
                                    <p className="text-lg font-semibold text-gray-900">{count}</p>
                                    <p className="text-[10px] text-gray-500">{o.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* History table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">コール記録</CardTitle>
                    <CardDescription>架電履歴</CardDescription>
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
                                        <th className="px-6 py-3 font-medium">メモ</th>
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
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CALL_RESULT_STYLES[c.result] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {CALL_RESULT_LABELS[c.result] ?? c.result}
                                                </span>
                                            </td>
                                            <td className="max-w-[200px] truncate px-6 py-4 text-gray-500" title={c.summary ?? undefined}>
                                                {c.summary ?? '-'}
                                            </td>
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
