'use client';

import { useState } from 'react';
import { Phone, Trash2, Plus, ExternalLink } from 'lucide-react';
import type { CallQueueItem, CallResult } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { addToCallQueueAction, removeFromCallQueueAction, recordCallAction } from '@/modules/call/server-actions';

const RESULT_OPTIONS: { value: CallResult; label: string }[] = [
    { value: 'CONNECTED', label: '繋がった' },
    { value: 'NO_ANSWER', label: '不在' },
    { value: 'BUSY', label: '話中' },
    { value: 'VOICEMAIL', label: '留守電' },
    { value: 'CALLBACK_REQUESTED', label: '折り返し希望' },
];

const RESULT_PILL_STYLES: Record<CallResult, string> = {
    CONNECTED: 'bg-gray-900 text-white',
    NO_ANSWER: 'bg-gray-100 text-gray-600',
    BUSY: 'bg-gray-200 text-gray-600',
    VOICEMAIL: 'bg-gray-200 text-gray-700',
    CALLBACK_REQUESTED: 'bg-gray-300 text-gray-700',
};

function stripPhoneForTel(phone: string): string {
    return phone.replace(/[\s\-()（）]/g, '');
}

function nowJST(): string {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 16);
}

function formatJST(iso: string): string {
    return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface CallQueueViewProps {
    queue: CallQueueItem[];
    companies: { id: string; name: string; phone: string }[];
    added?: boolean;
    called?: boolean;
}

export function CallQueueView({ queue, companies, added = false, called = false }: CallQueueViewProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [callingTarget, setCallingTarget] = useState<CallQueueItem | null>(null);
    const [phoneValue, setPhoneValue] = useState('');
    const [selectedResult, setSelectedResult] = useState<CallResult>('CONNECTED');

    function handleCompanyChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const company = companies.find((c) => c.id === e.target.value);
        setPhoneValue(company?.phone ?? '');
    }

    function startRecording(item: CallQueueItem) {
        setCallingTarget(item);
        setSelectedResult('CONNECTED');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">コールキュー</h1>
                    <p className="text-sm text-gray-500">架電待ち {queue.length}件</p>
                </div>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    title="架電先を追加"
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            {/* ── Success messages ── */}
            {(added || called) && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {added ? '架電先を追加しました。' : 'コール結果を記録しました。'}
                </div>
            )}

            {/* ── Add form ── */}
            {showAddForm && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">架電先を追加</CardTitle>
                        <CardDescription>架電予定の会社・担当者を追加します。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={addToCallQueueAction} className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                会社 <span className="text-red-500">*</span>
                                <select
                                    name="companyId"
                                    required
                                    onChange={handleCompanyChange}
                                    className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">-- 会社を選択 --</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                電話番号 <span className="text-red-500">*</span>
                                <Input
                                    name="phoneNumber"
                                    required
                                    placeholder="03-0000-0000"
                                    value={phoneValue}
                                    onChange={(e) => setPhoneValue(e.target.value)}
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                架電予定日時
                                <Input name="scheduledAt" type="datetime-local" />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                メモ
                                <Input name="notes" placeholder="架電目的・注意事項など" />
                            </label>
                            <div className="flex gap-2 md:col-span-2">
                                <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">追加</Button>
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="px-5">キャンセル</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* ── Call recording panel ── */}
            {callingTarget && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">
                            コール結果を記録 — {callingTarget.companyName}
                        </CardTitle>
                        <CardDescription>{callingTarget.phoneNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1 text-sm text-gray-700">
                                <p className="font-mono text-lg font-semibold tracking-wide text-gray-900">
                                    {callingTarget.phoneNumber}
                                </p>
                                {callingTarget.contactName && (
                                    <p className="text-gray-500">コンタクト: {callingTarget.contactName}</p>
                                )}
                                <p className="text-gray-500">担当: {callingTarget.assignedUserName}</p>
                                {callingTarget.scheduledAt && (
                                    <p className="text-gray-500">
                                        予定: {formatJST(callingTarget.scheduledAt)}
                                    </p>
                                )}
                                {callingTarget.notes && (
                                    <p className="text-gray-500">メモ: {callingTarget.notes}</p>
                                )}
                            </div>
                            <a
                                href={`tel:${stripPhoneForTel(callingTarget.phoneNumber)}`}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <Phone className="h-4 w-4" />
                                Zoom Phone で発信
                                <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                        </div>

                        <form action={recordCallAction} className="grid gap-4 md:grid-cols-2">
                            <input type="hidden" name="callTargetId" value={callingTarget.id} />
                            <input type="hidden" name="companyId" value={callingTarget.companyId} />
                            {callingTarget.contactId && <input type="hidden" name="contactId" value={callingTarget.contactId} />}
                            <input type="hidden" name="result" value={selectedResult} />

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
                                架電日時 <span className="text-red-500">*</span>
                                <Input name="calledAt" type="datetime-local" required defaultValue={nowJST()} />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                通話時間（秒）
                                <Input name="durationSec" type="number" min="0" placeholder="120" />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                メモ
                                <Input name="notes" placeholder="通話内容・次のアクションなど" />
                            </label>
                            <div className="flex gap-2 md:col-span-2">
                                <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">記録して完了</Button>
                                <Button type="button" variant="outline" onClick={() => setCallingTarget(null)} className="px-5">キャンセル</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* ── Queue table ── */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">架電待ちリスト</CardTitle>
                    <CardDescription>
                        電話番号をクリックすると Zoom Phone で発信できます。架電後は「架電済み」から結果を記録してください。
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {queue.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            架電待ちの案件はありません。「+」から追加してください。
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">会社名</th>
                                        <th className="px-6 py-3 font-medium">電話番号</th>
                                        <th className="px-6 py-3 font-medium">コンタクト</th>
                                        <th className="px-6 py-3 font-medium">予定日時</th>
                                        <th className="px-6 py-3 font-medium">担当者</th>
                                        <th className="px-6 py-3 font-medium">メモ</th>
                                        <th className="px-4 py-3 font-medium" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                    {queue.map((item) => {
                                        const isActive = callingTarget?.id === item.id;
                                        return (
                                            <tr
                                                key={item.id}
                                                className={isActive ? 'bg-blue-50' : 'hover:bg-gray-50 transition-colors'}
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                    {item.companyName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <a
                                                        href={`tel:${stripPhoneForTel(item.phoneNumber)}`}
                                                        className="inline-flex items-center gap-1 font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                        title="Zoom Phone で発信"
                                                    >
                                                        <Phone className="h-3 w-3" />
                                                        {item.phoneNumber}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">{item.contactName ?? '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                    {item.scheduledAt
                                                        ? formatJST(item.scheduledAt)
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4">{item.assignedUserName}</td>
                                                <td className="max-w-[160px] truncate px-6 py-4 text-gray-500" title={item.notes ?? undefined}>
                                                    {item.notes ?? '-'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            type="button"
                                                            onClick={() => startRecording(item)}
                                                            size="sm"
                                                            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                                                            disabled={isActive}
                                                        >
                                                            <Phone className="h-3.5 w-3.5" />
                                                            架電済み
                                                        </Button>
                                                        <form action={removeFromCallQueueAction}>
                                                            <input type="hidden" name="targetId" value={item.id} />
                                                            <Button type="submit" size="sm" variant="ghost" className="text-gray-400 hover:text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
