import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ContractStatus } from '@g-dx/contracts';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { assertPermission } from '@/shared/server/authorization';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listContractsForOffice } from '@/modules/office/contract/office-contract-repository';
import { updateOfficeContractPaymentAction } from '@/modules/office/contract/server-actions';

interface OfficeContractsPageProps {
    searchParams?: {
        keyword?: string;
        status?: string;
    };
}

const STATUS_OPTIONS: { key: ContractStatus; label: string }[] = [
    { key: 'CONTRACTED', label: '契約' },
    { key: 'INVOICED', label: '請求書発行' },
    { key: 'PAID', label: '入金済み' },
    { key: 'SERVICE_STARTED', label: 'サービス開始' },
    { key: 'SERVICE_ENDED', label: 'サービス終了' },
];

const STATUS_COLORS: Record<ContractStatus, string> = {
    CONTRACTED: 'bg-gray-100 text-gray-700',
    INVOICED: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    SERVICE_STARTED: 'bg-purple-100 text-purple-700',
    SERVICE_ENDED: 'bg-gray-200 text-gray-500',
};

function formatAmount(amount: number): string {
    if (amount >= 100_000_000) return `¥${(amount / 100_000_000).toFixed(1)}億`;
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

export default async function OfficeContractsPage({ searchParams }: OfficeContractsPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        assertPermission(session, 'office.contract.manage');
    } catch {
        redirect('/unauthorized');
    }

    const keyword = searchParams?.keyword;
    const status = searchParams?.status as ContractStatus | undefined;

    let contracts;
    try {
        contracts = await listContractsForOffice(session.activeBusinessScope, {
            keyword,
            contractStatus: status,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">事務管理</h1>
                <p className="text-sm text-gray-500">契約の請求・入金状況を確認・更新します（ADMIN 以上）</p>
            </div>

            {/* 検索 */}
            <form method="GET" className="flex flex-wrap gap-2">
                <Input
                    name="keyword"
                    defaultValue={keyword ?? ''}
                    placeholder="会社名・契約タイトルで検索..."
                    className="w-full md:w-64"
                />
                <select
                    name="status"
                    defaultValue={status ?? ''}
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">全ステータス</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                </select>
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                    検索
                </button>
                {(keyword || status) && (
                    <Link
                        href="/office/contracts"
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        クリア
                    </Link>
                )}
            </form>

            <p className="text-xs text-gray-500">全 {contracts.total} 件</p>

            {/* デスクトップ: テーブル */}
            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-3">契約タイトル</th>
                            <th className="px-4 py-3">会社名</th>
                            <th className="px-4 py-3">担当者</th>
                            <th className="px-4 py-3">金額</th>
                            <th className="px-4 py-3">ステータス</th>
                            <th className="px-4 py-3">契約日</th>
                            <th className="px-4 py-3 min-w-[180px]">請求書発行日</th>
                            <th className="px-4 py-3 min-w-[180px]">入金日</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {contracts.data.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-sm text-gray-500">
                                    契約データがありません
                                </td>
                            </tr>
                        ) : (
                            contracts.data.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <form action={updateOfficeContractPaymentAction} className="contents">
                                        <input type="hidden" name="contractId" value={c.id} />
                                        {/* title cell */}
                                        <td className="px-4 py-2">
                                            <Link
                                                href={`/sales/contracts/${c.id}`}
                                                className="font-medium text-gray-900 hover:underline"
                                            >
                                                {c.title}
                                            </Link>
                                            {c.contractNumber && (
                                                <div className="text-xs text-gray-400">{c.contractNumber}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{c.company.name}</td>
                                        <td className="px-4 py-2 text-gray-600">{c.ownerUser.name}</td>
                                        <td className="px-4 py-2 text-gray-600">
                                            {c.amount !== null ? formatAmount(c.amount) : '-'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                name="contractStatus"
                                                defaultValue={c.contractStatus}
                                                className="h-8 w-full rounded-md border border-gray-300 px-2 text-xs text-gray-900 outline-none focus-visible:ring-1"
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s.key} value={s.key}>{s.label}</option>
                                                ))}
                                            </select>
                                            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contractStatus]}`}>
                                                {STATUS_OPTIONS.find((s) => s.key === c.contractStatus)?.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{c.contractDate ?? '-'}</td>
                                        <td className="px-4 py-2">
                                            <Input
                                                name="invoiceDate"
                                                type="date"
                                                defaultValue={c.invoiceDate ?? ''}
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input
                                                name="paymentDate"
                                                type="date"
                                                defaultValue={c.paymentDate ?? ''}
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <SubmitButton
                                                className="h-8 bg-blue-600 px-3 text-xs text-white hover:bg-blue-700"
                                                pendingText="保存中"
                                            >
                                                保存
                                            </SubmitButton>
                                        </td>
                                    </form>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* モバイル: カード */}
            <div className="space-y-3 md:hidden">
                {contracts.data.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">契約データがありません</p>
                ) : (
                    contracts.data.map((c) => (
                        <div key={c.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <Link
                                            href={`/sales/contracts/${c.id}`}
                                            className="font-medium text-gray-900 hover:underline"
                                        >
                                            {c.title}
                                        </Link>
                                        <p className="text-xs text-gray-500">{c.company.name}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contractStatus]}`}>
                                        {STATUS_OPTIONS.find((s) => s.key === c.contractStatus)?.label}
                                    </span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                    <span>担当: {c.ownerUser.name}</span>
                                    {c.amount !== null && (
                                        <span className="font-medium text-gray-700">{formatAmount(c.amount)}</span>
                                    )}
                                    {c.contractDate && <span>契約日: {c.contractDate}</span>}
                                </div>
                            </div>
                            <form action={updateOfficeContractPaymentAction} className="space-y-3 px-4 py-3">
                                <input type="hidden" name="contractId" value={c.id} />
                                <label className="grid gap-1 text-xs font-medium text-gray-600">
                                    ステータス
                                    <select
                                        name="contractStatus"
                                        defaultValue={c.contractStatus}
                                        className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none"
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s.key} value={s.key}>{s.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-gray-600">
                                    請求書発行日
                                    <Input name="invoiceDate" type="date" defaultValue={c.invoiceDate ?? ''} className="h-9" />
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-gray-600">
                                    入金日
                                    <Input name="paymentDate" type="date" defaultValue={c.paymentDate ?? ''} className="h-9" />
                                </label>
                                <SubmitButton
                                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                    pendingText="保存中..."
                                >
                                    保存する
                                </SubmitButton>
                            </form>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
