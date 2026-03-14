import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createContractAction } from '@/modules/sales/contract/server-actions';
import type { ContractStatus } from '@g-dx/contracts';

interface CompanyOption {
    id: string;
    name: string;
}

interface UserOption {
    id: string;
    name: string;
}

interface ContractCreateFormProps {
    companies: CompanyOption[];
    users?: UserOption[];
    errorMessage?: string;
    defaultValues?: {
        dealId?: string;
        companyId?: string;
        title?: string;
        amount?: string;
    };
}

const STATUS_OPTIONS: { key: ContractStatus; label: string }[] = [
    { key: 'CONTRACTED', label: '契約' },
    { key: 'INVOICED', label: '請求書発行' },
    { key: 'PAID', label: '入金済み' },
    { key: 'SERVICE_STARTED', label: 'サービス開始' },
    { key: 'SERVICE_ENDED', label: 'サービス終了' },
];

const PRODUCT_OPTIONS = [
    { value: '', label: '-- 選択してください --' },
    { value: 'G-DX', label: 'G-DX' },
    { value: 'PRO_SUPPORT_X', label: 'プロサポートX' },
    { value: 'LICENSE_ONLY', label: 'ライセンスのみ' },
];

const LICENSE_PLAN_OPTIONS = [
    { value: '', label: '-- 選択してください --' },
    { value: 'ENTERPRISE', label: 'エンタープライズ' },
    { value: 'PRO', label: 'プロ' },
    { value: 'A2', label: 'A2' },
];

const selectClass = 'h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function ContractCreateForm({ companies, users = [], errorMessage, defaultValues }: ContractCreateFormProps) {
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardDescription>契約情報を入力して登録してください。</CardDescription>
            </CardHeader>
            <CardContent>
                {errorMessage && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                <form action={createContractAction} className="grid gap-4 md:grid-cols-2">
                    {defaultValues?.dealId && (
                        <input type="hidden" name="dealId" value={defaultValues.dealId} />
                    )}

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        契約タイトル <span className="text-red-500">*</span>
                        <Input name="title" required placeholder="〇〇社 Lark導入サポート契約" defaultValue={defaultValues?.title ?? ''} />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        会社 <span className="text-red-500">*</span>
                        <select name="companyId" required className={selectClass} defaultValue={defaultValues?.companyId ?? ''}>
                            <option value="">-- 会社を選択 --</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        ステータス
                        <select name="contractStatus" defaultValue="CONTRACTED" className={selectClass}>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        契約番号
                        <Input name="contractNumber" placeholder="CONTRACT-2026-001" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        金額（円）
                        <Input name="amount" type="number" min="0" placeholder="1000000" defaultValue={defaultValues?.amount ?? ''} />
                    </label>

                    {/* 担当者セクション */}
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        FS担当者
                        <select name="fsInChargeUserId" className={selectClass}>
                            <option value="">-- 選択してください --</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        IS担当者
                        <select name="isInChargeUserId" className={selectClass}>
                            <option value="">-- 選択してください --</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </label>

                    {/* 商材・プランセクション */}
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        獲得商材
                        <select name="productCode" className={selectClass}>
                            {PRODUCT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        ライセンスプラン
                        <select name="licensePlanCode" className={selectClass}>
                            {LICENSE_PLAN_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        助成金申請
                        <select name="hasSubsidy" className={selectClass}>
                            <option value="">-- 選択してください --</option>
                            <option value="true">あり</option>
                            <option value="false">なし</option>
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        無料伴走期間（月）
                        <Input name="freeSupportMonths" type="number" min="1" max="13" placeholder="3" />
                    </label>

                    {/* ライセンス数 */}
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        エンタープライズID数
                        <Input name="enterpriseLicenseCount" type="number" min="0" placeholder="0" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        プロID数
                        <Input name="proLicenseCount" type="number" min="0" placeholder="0" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        A2 ID数
                        <Input name="a2LicenseCount" type="number" min="0" placeholder="0" />
                    </label>

                    {/* 日程セクション */}
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        契約日
                        <Input name="contractDate" type="date" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        請求書発行日
                        <Input name="invoiceDate" type="date" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        入金日
                        <Input name="paymentDate" type="date" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        サービス開始日
                        <Input name="serviceStartDate" type="date" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        サービス終了日
                        <Input name="serviceEndDate" type="date" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        メモ
                        <textarea
                            name="memo"
                            rows={3}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="契約に関するメモを記入..."
                        />
                    </label>

                    <div className="flex items-center justify-end gap-2 md:col-span-2">
                        <Button asChild variant="outline" className="px-6"><Link href="/sales/contracts">キャンセル</Link></Button>
                        <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">契約を登録</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
