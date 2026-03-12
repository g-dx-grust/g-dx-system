'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, PhoneForwarded, ExternalLink } from 'lucide-react';
import type { CallResult, CompanyListItem } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    addToCallQueueFromCompanyListAction,
    recordCallFromCompanyListAction,
} from '@/modules/call/server-actions';

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
    const [selectedResult, setSelectedResult] = useState<CallResult>('CONNECTED');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchValue.trim()) params.set('keyword', searchValue.trim());
        router.push(`/calls/company-list?${params.toString()}`);
    }

    function startCalling(company: CompanyListItem) {
        setCallingCompany(company);
        setSelectedResult('CONNECTED');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const callableCompanies = companies.filter((c) => c.phone);
    const noPhoneCompanies = companies.filter((c) => !c.phone);

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">会社コールリスト</h1>
                    <p className="text-sm text-gray-500">
                        電話番号あり {callableCompanies.length}件 / 全 {total}件 — Zoom Phone で架電し結果を記録
                    </p>
                </div>
            </div>

            {/* ── Success messages ── */}
            {queued && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    「{queued}」をコールキューに追加しました。
                </div>
            )}
            {recorded && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    「{recorded}」のコール結果を記録しました。
                </div>
            )}

            {/* ── Active call panel ── */}
            {callingCompany && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">
                            コール結果を記録 — {callingCompany.name}
                        </CardTitle>
                        <CardDescription>
                            {callingCompany.phone}
                            {callingCompany.industry ? ` / ${callingCompany.industry}` : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Company info + Zoom Phone */}
                        <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1 text-sm text-gray-700">
                                <p className="font-mono text-lg font-semibold tracking-wide text-gray-900">
                                    {callingCompany.phone}
                                </p>
                                {callingCompany.website && (
                                    <p className="text-gray-500">{callingCompany.website}</p>
                                )}
                                {callingCompany.address && (
                                    <p className="text-gray-500">{callingCompany.address}</p>
                                )}
                                {callingCompany.ownerUser && (
                                    <p className="text-gray-500">担当: {callingCompany.ownerUser.name}</p>
                                )}
                                {callingCompany.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {callingCompany.tags.map((tag) => (
                                            <span key={tag} className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex shrink-0 flex-col gap-2">
                                <a
                                    href={`tel:${stripPhoneForTel(callingCompany.phone ?? '')}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    <Phone className="h-4 w-4" />
                                    Zoom Phone で発信
                                    <ExternalLink className="h-3 w-3 opacity-60" />
                                </a>
                                <Link
                                    href={`/customers/companies/${callingCompany.id}`}
                                    className="text-center text-xs text-gray-500 hover:text-gray-700 hover:underline"
                                >
                                    会社詳細を見る
                                </Link>
                            </div>
                        </div>

                        {/* Recording form */}
                        <form action={recordCallFromCompanyListAction} className="grid gap-4 md:grid-cols-2">
                            <input type="hidden" name="companyId" value={callingCompany.id} />
                            <input type="hidden" name="companyName" value={callingCompany.name} />
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
                                <Input
                                    name="calledAt"
                                    type="datetime-local"
                                    required
                                    defaultValue={nowJST()}
                                />
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
                                <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">
                                    記録して完了
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setCallingCompany(null)} className="px-5">
                                    キャンセル
                                </Button>
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

            {/* ── Company table ── */}
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

            {/* ── No-phone companies ── */}
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
