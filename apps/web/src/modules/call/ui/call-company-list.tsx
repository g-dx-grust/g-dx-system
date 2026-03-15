'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, PhoneForwarded, ExternalLink, Clock, FileText, ChevronRight } from 'lucide-react';
import type { CallResult, CallListItem, CompanyListItem } from '@g-dx/contracts';
import { CALL_RESULT_OPTIONS, CALL_RESULT_LABELS, CALL_RESULT_STYLES, QUICK_COMPLETE_STATUSES, NEXT_CALL_DATETIME_STATUSES } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    addToCallQueueFromCompanyListAction,
    recordCallFromCompanyListAction,
    fetchCompanyCallHistory,
} from '@/modules/call/server-actions';

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

interface CallCompanyListProps {
    companies: CompanyListItem[];
    total: number;
    keyword?: string;
    queued?: string;
    recorded?: string;
}

export function CallCompanyList({ companies, total, keyword, queued, recorded }: CallCompanyListProps) {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState(keyword ?? '');
    const [callingCompany, setCallingCompany] = useState<CompanyListItem | null>(null);
    const [activeTab, setActiveTab] = useState<'call' | 'info'>('call');
    const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
    const [isPending, startTransition] = useTransition();
    const [companyHistory, setCompanyHistory] = useState<CallListItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(
        queued ? `「${queued}」をコールキューに追加しました。` :
        recorded ? `「${recorded}」のコール結果を記録しました。` : null
    );

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

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

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchValue.trim()) params.set('keyword', searchValue.trim());
        router.push(`/calls/company-list?${params.toString()}`);
    }

    function startCalling(company: CompanyListItem) {
        setCallingCompany(company);
        setActiveTab('call');
        setSelectedResult(null);
        setCompanyHistory([]);
        loadCompanyHistory(company.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleQuickComplete(result: CallResult) {
        if (!callingCompany) return;
        const formData = new FormData();
        formData.set('companyId', callingCompany.id);
        formData.set('companyName', callingCompany.name);
        formData.set('result', result);

        startTransition(async () => {
            const res = await recordCallFromCompanyListAction(null, formData);
            if (res.success) {
                setSuccessMessage(`${callingCompany.name}: ${CALL_RESULT_LABELS[result]} を記録しました。`);
                setCallingCompany(null);
                setSelectedResult(null);
                router.refresh();
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
        startTransition(async () => {
            const res = await recordCallFromCompanyListAction(null, formData);
            if (res.success) {
                setSuccessMessage(`${res.companyName}: ${CALL_RESULT_LABELS[formData.get('result') as CallResult] ?? ''} を記録しました。`);
                setCallingCompany(null);
                setSelectedResult(null);
                router.refresh();
            }
        });
    }

    const callableCompanies = companies.filter((c) => c.phone);
    const noPhoneCompanies = companies.filter((c) => !c.phone);

    const showDetailForm = selectedResult && !QUICK_COMPLETE_STATUSES.includes(selectedResult);
    const showNextCallDatetime = selectedResult && NEXT_CALL_DATETIME_STATUSES.includes(selectedResult);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">会社コールリスト</h1>
                    <p className="text-sm text-gray-500">
                        電話番号あり {callableCompanies.length}件 / 全 {total}件 — Zoom Phone で架電し結果を記録
                    </p>
                </div>
            </div>

            {/* Success messages */}
            {successMessage && (
                <div className="animate-in fade-in slide-in-from-top-1 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {successMessage}
                </div>
            )}

            {/* Active call panel */}
            {callingCompany && (
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="shadow-sm">
                            {/* Tab header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 pt-4">
                                <div className="flex gap-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('call')}
                                        className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                                            activeTab === 'call'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5" />
                                            コール記録
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('info')}
                                        className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                                            activeTab === 'info'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" />
                                            会社情報
                                        </span>
                                    </button>
                                </div>
                                <p className="pb-3 text-sm font-medium text-gray-900">{callingCompany.name}</p>
                            </div>

                            <CardContent className="space-y-5 pt-5">
                                {/* ─── Tab: コール記録 ─── */}
                                {activeTab === 'call' && (
                                    <>
                                        {/* Phone + dial button */}
                                        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                                            <p className="font-mono text-lg font-semibold tracking-wide text-gray-900">
                                                {callingCompany.phone}
                                            </p>
                                            <a
                                                href={`tel:${stripPhoneForTel(callingCompany.phone ?? '')}`}
                                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                            >
                                                <Phone className="h-4 w-4" />
                                                Zoom Phone で発信
                                                <ExternalLink className="h-3 w-3 opacity-60" />
                                            </a>
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

                                        {/* Detail form */}
                                        {showDetailForm && (
                                            <form action={handleFormSubmit} className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
                                                <input type="hidden" name="companyId" value={callingCompany.id} />
                                                <input type="hidden" name="companyName" value={callingCompany.name} />
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
                                                        {isPending ? '記録中...' : '記録して完了'}
                                                        {!isPending && <ChevronRight className="h-4 w-4" />}
                                                    </Button>
                                                    <Button type="button" variant="outline" onClick={() => { setCallingCompany(null); setSelectedResult(null); }} className="px-5">
                                                        キャンセル
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                )}

                                {/* ─── Tab: 会社情報 ─── */}
                                {activeTab === 'info' && (
                                    <div className="space-y-4">
                                        <dl className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500">電話番号</dt>
                                                <dd className="mt-0.5 font-mono text-sm font-semibold text-gray-900">{callingCompany.phone ?? '-'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500">業種</dt>
                                                <dd className="mt-0.5 text-sm text-gray-700">{callingCompany.industry ?? '-'}</dd>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <dt className="text-xs font-medium text-gray-500">住所</dt>
                                                <dd className="mt-0.5 text-sm text-gray-700">{callingCompany.address ?? '-'}</dd>
                                            </div>
                                            {callingCompany.website && (
                                                <div className="sm:col-span-2">
                                                    <dt className="text-xs font-medium text-gray-500">ウェブサイト</dt>
                                                    <dd className="mt-0.5 text-sm text-gray-700">{callingCompany.website}</dd>
                                                </div>
                                            )}
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500">担当者</dt>
                                                <dd className="mt-0.5 text-sm text-gray-700">{callingCompany.ownerUser?.name ?? '-'}</dd>
                                            </div>
                                            {callingCompany.tags.length > 0 && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500">タグ</dt>
                                                    <dd className="mt-1 flex flex-wrap gap-1">
                                                        {callingCompany.tags.map((tag) => (
                                                            <span key={tag} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                        <div className="border-t border-gray-100 pt-3">
                                            <Link
                                                href={`/customers/companies/${callingCompany.id}`}
                                                target="_blank"
                                                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:underline"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                会社詳細ページを別タブで開く
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Call history sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-700">過去の架電履歴</CardTitle>
                                <CardDescription className="text-xs">{callingCompany.name}</CardDescription>
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

            {/* Search */}
            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
                        <input
                            type="search"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="会社名で検索"
                            className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">
                                検索
                            </Button>
                            {keyword ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setSearchValue(''); router.push('/calls/company-list'); }}
                                    className="px-5"
                                >
                                    クリア
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Company table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">架電対象一覧</CardTitle>
                    <CardDescription>
                        電話番号をクリックすると Zoom Phone で発信できます。「コール」ボタンで結果を記録してください。
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {callableCompanies.length === 0 ? (
                        <div className="px-6 py-12 text-sm text-gray-500">
                            {keyword
                                ? '検索条件に一致する会社はありません。'
                                : '電話番号が登録されている会社がありません。'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">会社名</th>
                                        <th className="px-6 py-3 font-medium">電話番号</th>
                                        <th className="px-6 py-3 font-medium">業種</th>
                                        <th className="px-6 py-3 font-medium">住所</th>
                                        <th className="px-6 py-3 font-medium">担当者</th>
                                        <th className="px-6 py-3 font-medium">タグ</th>
                                        <th className="px-4 py-3 font-medium" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                    {callableCompanies.map((company) => {
                                        const isActive = callingCompany?.id === company.id;
                                        return (
                                            <tr
                                                key={company.id}
                                                className={isActive ? 'bg-blue-50' : 'hover:bg-gray-50 transition-colors'}
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link
                                                            href={`/customers/companies/${company.id}`}
                                                            className="hover:text-gray-700 hover:underline"
                                                        >
                                                            {company.name}
                                                        </Link>
                                                        {company.website ? (
                                                            <span className="text-xs font-normal text-gray-500">{company.website}</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a
                                                        href={`tel:${stripPhoneForTel(company.phone!)}`}
                                                        className="inline-flex items-center gap-1 font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                        title="Zoom Phone で発信"
                                                    >
                                                        <Phone className="h-3 w-3" />
                                                        {company.phone}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">{company.industry ?? '-'}</td>
                                                <td className="max-w-[200px] truncate px-6 py-4 text-gray-500" title={company.address ?? undefined}>
                                                    {company.address ?? '-'}
                                                </td>
                                                <td className="px-6 py-4">{company.ownerUser?.name ?? '-'}</td>
                                                <td className="px-6 py-4">
                                                    {company.tags.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {company.tags.map((tag) => (
                                                                <span key={tag} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            type="button"
                                                            onClick={() => startCalling(company)}
                                                            size="sm"
                                                            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                                                            disabled={isActive}
                                                        >
                                                            <Phone className="h-3.5 w-3.5" />
                                                            コール
                                                        </Button>
                                                        <form action={addToCallQueueFromCompanyListAction}>
                                                            <input type="hidden" name="companyId" value={company.id} />
                                                            <input type="hidden" name="companyName" value={company.name} />
                                                            <input type="hidden" name="phoneNumber" value={company.phone ?? ''} />
                                                            <Button
                                                                type="submit"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-gray-400 hover:text-blue-600"
                                                                title="コールキューに追加"
                                                            >
                                                                <PhoneForwarded className="h-4 w-4" />
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

            {/* No-phone companies */}
            {noPhoneCompanies.length > 0 && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">電話番号未登録</CardTitle>
                        <CardDescription>
                            電話番号が登録されていない会社です。会社詳細から電話番号を追加してください。({noPhoneCompanies.length}件)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">会社名</th>
                                    <th className="px-6 py-3 font-medium">業種</th>
                                    <th className="px-6 py-3 font-medium">担当者</th>
                                    <th className="px-4 py-3 font-medium" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-gray-500">
                                {noPhoneCompanies.map((company) => (
                                    <tr key={company.id}>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            <Link
                                                href={`/customers/companies/${company.id}`}
                                                className="hover:text-gray-900 hover:underline"
                                            >
                                                {company.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{company.industry ?? '-'}</td>
                                        <td className="px-6 py-4">{company.ownerUser?.name ?? '-'}</td>
                                        <td className="px-4 py-4">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/customers/companies/${company.id}`}>編集</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
