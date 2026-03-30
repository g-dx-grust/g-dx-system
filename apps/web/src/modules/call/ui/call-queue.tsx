'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Trash2, Plus, ExternalLink, Clock, FileText, ChevronRight, Play, Pause, Square, PhoneOff } from 'lucide-react';
import type { CallQueueItem, CallResult, CallListItem } from '@g-dx/contracts';
import { CALL_RESULT_OPTIONS, CALL_RESULT_STYLES, CALL_RESULT_LABELS, QUICK_COMPLETE_STATUSES, NEXT_CALL_DATETIME_STATUSES } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { CallTimer } from '@/modules/call/ui/call-timer';
import { addToCallQueueAction, removeFromCallQueueAction, recordCallAction, fetchCompanyCallHistory } from '@/modules/call/server-actions';

function stripPhoneForTel(phone: string): string {
    return phone.replace(/[\s\-()（）]/g, '');
}

function formatJST(iso: string): string {
    return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    return `${days}日前`;
}

type CallStatus = 'idle' | 'calling' | 'ended';

interface CallQueueViewProps {
    queue: CallQueueItem[];
    companies: { id: string; name: string; phone: string }[];
    added?: boolean;
    called?: boolean;
}

export function CallQueueView({ queue, companies, added = false, called = false }: CallQueueViewProps) {
    const router = useRouter();
    const [showAddForm, setShowAddForm] = useState(false);
    const [callingTarget, setCallingTarget] = useState<CallQueueItem | null>(null);
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
    const [phoneValue, setPhoneValue] = useState('');
    const [isPending, startTransition] = useTransition();
    const [companyHistory, setCompanyHistory] = useState<CallListItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(
        added ? '架電先を追加しました。' : called ? 'コール結果を記録しました。' : null
    );
    const [autoCallMode, setAutoCallMode] = useState(false);
    const [autoCallPaused, setAutoCallPaused] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);
    const elapsedRef = useRef(0);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    function handleCompanyChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const company = companies.find((c) => c.id === e.target.value);
        setPhoneValue(company?.phone ?? '');
    }

    const loadCompanyHistory = useCallback(async (companyId: string) => {
        setHistoryLoading(true);
        try {
            const history = await fetchCompanyCallHistory(companyId);
            setCompanyHistory(history);
        } catch {
            setCompanyHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    function startRecording(item: CallQueueItem) {
        setCallingTarget(item);
        setCallStatus('idle');
        setSelectedResult(null);
        setCompanyHistory([]);
        elapsedRef.current = 0;
        loadCompanyHistory(item.companyId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleCallStart() {
        setCallStatus('calling');
    }

    function handleCallEnd() {
        setCallStatus('ended');
    }

    function advanceToNext() {
        if (!callingTarget) return;
        const currentIndex = queue.findIndex((q) => q.id === callingTarget.id);
        const remaining = queue.filter((q, i) => i !== currentIndex);

        if (autoCallMode && !autoCallPaused && remaining.length > 0) {
            setCompletedCount((c) => c + 1);
            const nextIndex = Math.min(currentIndex, remaining.length - 1);
            const nextItem = remaining[nextIndex];
            startRecording(nextItem);
            // Auto-dial next target
            setTimeout(() => {
                window.location.href = `tel:${stripPhoneForTel(nextItem.phoneNumber)}`;
                setCallStatus('calling');
            }, 500);
        } else if (remaining.length > 0) {
            const nextIndex = Math.min(currentIndex, remaining.length - 1);
            startRecording(remaining[nextIndex]);
        } else {
            setCallingTarget(null);
            setSelectedResult(null);
            setCallStatus('idle');
            if (autoCallMode) {
                setAutoCallMode(false);
                setSuccessMessage('全ての架電が完了しました。');
            }
        }
    }

    function handleQuickComplete(result: CallResult) {
        if (!callingTarget) return;
        const formData = new FormData();
        formData.set('callTargetId', callingTarget.id);
        formData.set('companyId', callingTarget.companyId);
        if (callingTarget.contactId) formData.set('contactId', callingTarget.contactId);
        formData.set('result', result);
        if (elapsedRef.current > 0) formData.set('durationSec', String(elapsedRef.current));

        startTransition(async () => {
            const res = await recordCallAction(null, formData);
            if (res.success) {
                setSuccessMessage(`${callingTarget.companyName}: ${CALL_RESULT_LABELS[result]} を記録しました。`);
                router.refresh();
                advanceToNext();
            }
        });
    }

    function handleResultSelect(result: CallResult) {
        setSelectedResult(result);
        if (QUICK_COMPLETE_STATUSES.includes(result)) {
            handleQuickComplete(result);
        }
    }

    function handleFormSubmit(formData: FormData) {
        if (elapsedRef.current > 0) formData.set('durationSec', String(elapsedRef.current));
        startTransition(async () => {
            const res = await recordCallAction(null, formData);
            if (res.success) {
                const resultLabel = CALL_RESULT_LABELS[formData.get('result') as CallResult] ?? '';
                setSuccessMessage(`${callingTarget?.companyName}: ${resultLabel} を記録しました。`);
                router.refresh();
                advanceToNext();
            }
        });
    }

    function startAutoCall() {
        setAutoCallMode(true);
        setAutoCallPaused(false);
        setCompletedCount(0);
        if (queue.length > 0) {
            const first = queue[0];
            startRecording(first);
            setTimeout(() => {
                window.location.href = `tel:${stripPhoneForTel(first.phoneNumber)}`;
                setCallStatus('calling');
            }, 300);
        }
    }

    function stopAutoCall() {
        setAutoCallMode(false);
        setAutoCallPaused(false);
    }

    const showDetailForm = selectedResult && !QUICK_COMPLETE_STATUSES.includes(selectedResult);
    const showNextCallDatetime = selectedResult && NEXT_CALL_DATETIME_STATUSES.includes(selectedResult);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">コールキュー</h1>
                    <p className="text-sm text-gray-500">架電待ち {queue.length}件</p>
                </div>
                <div className="flex items-center gap-2">
                    {!autoCallMode && queue.length > 0 && (
                        <Button
                            onClick={startAutoCall}
                            variant="outline"
                            className="gap-1.5"
                        >
                            <Play className="h-4 w-4" />
                            オートコール
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        size="icon"
                        className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                        title="架電先を追加"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Auto-call banner */}
            {autoCallMode && (
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-600" />
                        </span>
                        <span className="text-sm font-medium text-blue-900">
                            オートコール中 — {completedCount}/{queue.length} 完了
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setAutoCallPaused(!autoCallPaused)}
                            size="sm"
                            variant="outline"
                            className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                            {autoCallPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                            {autoCallPaused ? '再開' : '一時停止'}
                        </Button>
                        <Button
                            onClick={stopAutoCall}
                            size="sm"
                            variant="outline"
                            className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                            <Square className="h-3.5 w-3.5" />
                            停止
                        </Button>
                    </div>
                </div>
            )}

            {/* Success messages */}
            {successMessage && (
                <div className="animate-in fade-in slide-in-from-top-1 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {successMessage}
                </div>
            )}

            {/* Add form */}
            {showAddForm && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">架電先を追加</CardTitle>
                        <CardDescription>架電先追加</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={addToCallQueueAction} className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                会社 <span className="text-red-500">*</span>
                                <select
                                    name="companyId"
                                    required
                                    onChange={handleCompanyChange}
                                    className="h-10 min-h-[44px] md:min-h-0 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

            {/* Call recording panel */}
            {callingTarget && (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main recording panel */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base text-gray-900">
                                            コール結果を記録 — {callingTarget.companyName}
                                        </CardTitle>
                                        <CardDescription>{callingTarget.phoneNumber}</CardDescription>
                                    </div>
                                    {callStatus === 'calling' && (
                                        <div className="flex items-center gap-2">
                                            <CallTimer
                                                isActive={true}
                                                onElapsedChange={(s) => { elapsedRef.current = s; }}
                                            />
                                            <span className="text-xs font-medium text-green-600">通話中</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Company info + Zoom Phone */}
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
                                    <div className="flex shrink-0 flex-col gap-2">
                                        {callStatus === 'idle' && (
                                            <a
                                                href={`tel:${stripPhoneForTel(callingTarget.phoneNumber)}`}
                                                onClick={handleCallStart}
                                                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                            >
                                                <Phone className="h-4 w-4" />
                                                Zoom Phone で発信
                                                <ExternalLink className="h-3 w-3 opacity-60" />
                                            </a>
                                        )}
                                        {callStatus === 'calling' && (
                                            <button
                                                type="button"
                                                onClick={handleCallEnd}
                                                className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
                                            >
                                                <PhoneOff className="h-4 w-4" />
                                                通話終了
                                            </button>
                                        )}
                                        {callStatus === 'ended' && (
                                            <div className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-600">
                                                <CallTimer isActive={false} />
                                                <span>通話終了</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status buttons */}
                                <div>
                                    <p className="mb-3 text-sm font-medium text-gray-700">
                                        結果を選択 <span className="text-red-500">*</span>
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                        {CALL_RESULT_OPTIONS.map((o) => {
                                            const isQuick = QUICK_COMPLETE_STATUSES.includes(o.value);
                                            return (
                                                <button
                                                    key={o.value}
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => handleResultSelect(o.value)}
                                                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                                                        selectedResult === o.value
                                                            ? CALL_RESULT_STYLES[o.value] + ' border-transparent ring-2 ring-blue-400 ring-offset-1'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                                    } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <span className="block">{o.label}</span>
                                                    {isQuick && (
                                                        <span className="mt-0.5 block text-[10px] opacity-60">ワンクリック</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {isPending && (
                                        <p className="mt-2 text-xs text-gray-500">記録中...</p>
                                    )}
                                </div>

                                {/* Detail form (shown for non-quick statuses) */}
                                {showDetailForm && (
                                    <form action={handleFormSubmit} className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
                                        <input type="hidden" name="callTargetId" value={callingTarget.id} />
                                        <input type="hidden" name="companyId" value={callingTarget.companyId} />
                                        {callingTarget.contactId && <input type="hidden" name="contactId" value={callingTarget.contactId} />}
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
                                                placeholder="通話内容・次のアクションなど"
                                                rows={2}
                                                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            />
                                        </label>

                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                disabled={isPending}
                                                className="gap-1.5 bg-blue-600 px-6 text-white hover:bg-blue-700"
                                            >
                                                {isPending ? '記録中...' : '記録して次へ'}
                                                {!isPending && <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => { setCallingTarget(null); setCallStatus('idle'); }} className="px-5">
                                                キャンセル
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Call history sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-700">過去の架電履歴</CardTitle>
                                <CardDescription className="text-xs">{callingTarget.companyName}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {historyLoading ? (
                                    <div className="px-4 py-6 text-center text-xs text-gray-400">読み込み中...</div>
                                ) : companyHistory.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-xs text-gray-400">
                                        過去の架電記録はありません
                                    </div>
                                ) : (
                                    <div className="max-h-[400px] divide-y divide-gray-100 overflow-y-auto">
                                        {companyHistory.map((h) => (
                                            <div key={h.id} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${CALL_RESULT_STYLES[h.result] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {CALL_RESULT_LABELS[h.result] ?? h.result}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                        {formatRelativeTime(h.calledAt)}
                                                    </span>
                                                </div>
                                                {h.summary && (
                                                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{h.summary}</p>
                                                )}
                                                <p className="mt-0.5 text-[10px] text-gray-400">
                                                    {formatJST(h.calledAt)} / {h.assignedUser.name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Queue table */}
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
                        <ResponsiveTable
                            mobileCards={
                                <div className="divide-y divide-gray-200">
                                    {queue.map((item) => {
                                        const isActive = callingTarget?.id === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`px-4 py-4 ${isActive ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-gray-900">{item.companyName}</p>
                                                        <a
                                                            href={`tel:${stripPhoneForTel(item.phoneNumber)}`}
                                                            className="mt-0.5 inline-flex items-center gap-1 font-mono text-sm text-blue-600"
                                                        >
                                                            <Phone className="h-3 w-3" />
                                                            {item.phoneNumber}
                                                        </a>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        <Button
                                                            type="button"
                                                            onClick={() => startRecording(item)}
                                                            size="sm"
                                                            className="gap-1 bg-blue-600 text-white hover:bg-blue-700"
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
                                                </div>
                                                {(item.contactName || item.notes) && (
                                                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
                                                        {item.contactName && <span>{item.contactName}</span>}
                                                        {item.scheduledAt && <span>{formatJST(item.scheduledAt)}</span>}
                                                        {item.notes && <span className="truncate max-w-[200px]">{item.notes}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            }
                        >
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
                        </ResponsiveTable>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
