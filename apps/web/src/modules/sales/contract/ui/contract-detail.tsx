import Link from 'next/link';
import type { ContractDetail, ContractStatus } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { updateContractAction } from '@/modules/sales/contract/server-actions';

interface ContractDetailViewProps {
    contract: ContractDetail;
    created?: boolean;
    updated?: boolean;
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

const STATUS_OPTIONS: { key: ContractStatus; label: string }[] = [
    { key: 'CONTRACTED', label: '契約' },
    { key: 'INVOICED', label: '請求書発行' },
    { key: 'PAID', label: '入金済み' },
    { key: 'SERVICE_STARTED', label: 'サービス開始' },
    { key: 'SERVICE_ENDED', label: 'サービス終了' },
];

function formatAmount(amount: number): string {
    return `¥${amount.toLocaleString()}`;
}

export function ContractDetailView({ contract, created = false, updated = false }: ContractDetailViewProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-gray-900">{contract.title}</h1>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[contract.contractStatus]}`}>
                            {STATUS_LABELS[contract.contractStatus]}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        {contract.company.name} &middot; 担当: {contract.ownerUser.name}
                    </p>
                </div>
                <Button asChild variant="outline" className="px-5">
                    <Link href="/sales/contracts">一覧へ戻る</Link>
                </Button>
            </div>

            {created && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    契約を登録しました。
                </div>
            )}
            {updated && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    契約情報を更新しました。
                </div>
            )}

            {/* Status timeline */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">契約進行状況</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-1">
                        {STATUS_OPTIONS.map((s, idx) => {
                            const statuses: ContractStatus[] = ['CONTRACTED', 'INVOICED', 'PAID', 'SERVICE_STARTED', 'SERVICE_ENDED'];
                            const currentIdx = statuses.indexOf(contract.contractStatus);
                            const thisIdx = statuses.indexOf(s.key);
                            const isDone = thisIdx <= currentIdx;
                            const isCurrent = s.key === contract.contractStatus;
                            return (
                                <div key={s.key} className="flex flex-1 items-center">
                                    <div className={`flex-1 text-center rounded-md px-2 py-2 text-xs font-medium ${isCurrent ? STATUS_COLORS[s.key] : isDone ? 'bg-gray-200 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
                                        {s.label}
                                    </div>
                                    {idx < STATUS_OPTIONS.length - 1 && (
                                        <div className={`h-px w-4 ${isDone ? 'bg-gray-400' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Details */}
            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">基本情報</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <InfoItem label="契約番号" value={contract.contractNumber ?? '-'} />
                        <InfoItem label="金額" value={contract.amount !== null ? formatAmount(contract.amount) : '-'} />
                        <InfoItem label="会社" value={contract.company.name} />
                        <InfoItem label="担当者" value={contract.ownerUser.name} />
                        <InfoItem label="担当コンタクト" value={contract.primaryContact?.name ?? '-'} />
                        {contract.dealId && <InfoItem label="関連案件" value={contract.dealId}>
                            <Link href={`/sales/deals/${contract.dealId}`} className="text-blue-600 hover:underline text-sm">案件を見る</Link>
                        </InfoItem>}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">日程情報</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <InfoItem label="契約日" value={contract.contractDate ?? '-'} />
                        <InfoItem label="請求書発行日" value={contract.invoiceDate ?? '-'} />
                        <InfoItem label="入金日" value={contract.paymentDate ?? '-'} />
                        <InfoItem label="サービス開始日" value={contract.serviceStartDate ?? '-'} />
                        <InfoItem label="サービス終了日" value={contract.serviceEndDate ?? '-'} />
                    </CardContent>
                </Card>
            </div>

            {contract.memo && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">メモ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm text-gray-700">{contract.memo}</p>
                    </CardContent>
                </Card>
            )}

            {/* Edit form */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">契約を編集</CardTitle>
                    <CardDescription>契約情報を更新します。</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateContractAction} className="grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="contractId" value={contract.id} />

                        <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            契約タイトル
                            <Input name="title" defaultValue={contract.title} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            ステータス
                            <select
                                name="contractStatus"
                                defaultValue={contract.contractStatus}
                                className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s.key} value={s.key}>{s.label}</option>
                                ))}
                            </select>
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            契約番号
                            <Input name="contractNumber" defaultValue={contract.contractNumber ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            金額（円）
                            <Input name="amount" type="number" min="0" defaultValue={contract.amount ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            契約日
                            <Input name="contractDate" type="date" defaultValue={contract.contractDate ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            請求書発行日
                            <Input name="invoiceDate" type="date" defaultValue={contract.invoiceDate ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            入金日
                            <Input name="paymentDate" type="date" defaultValue={contract.paymentDate ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            サービス開始日
                            <Input name="serviceStartDate" type="date" defaultValue={contract.serviceStartDate ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            サービス終了日
                            <Input name="serviceEndDate" type="date" defaultValue={contract.serviceEndDate ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            メモ
                            <textarea
                                name="memo"
                                rows={3}
                                defaultValue={contract.memo ?? ''}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </label>

                        <div className="flex items-center justify-end md:col-span-2">
                            <Button type="submit" className="bg-blue-600 px-8 text-white hover:bg-blue-700">
                                保存
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

interface InfoItemProps {
    label: string;
    value: string;
    children?: React.ReactNode;
}

function InfoItem({ label, value, children }: InfoItemProps) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-sm text-gray-900">{children ?? value}</p>
        </div>
    );
}
