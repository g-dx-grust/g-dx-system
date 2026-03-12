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

interface ContractCreateFormProps {
    companies: CompanyOption[];
    errorMessage?: string;
}

const STATUS_OPTIONS: { key: ContractStatus; label: string }[] = [
    { key: 'CONTRACTED', label: '契約' },
    { key: 'INVOICED', label: '請求書発行' },
    { key: 'PAID', label: '入金済み' },
    { key: 'SERVICE_STARTED', label: 'サービス開始' },
    { key: 'SERVICE_ENDED', label: 'サービス終了' },
];

export function ContractCreateForm({ companies, errorMessage }: ContractCreateFormProps) {
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
                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        契約タイトル <span className="text-red-500">*</span>
                        <Input name="title" required placeholder="〇〇社 Lark導入サポート契約" />
                    </label>

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
                        ステータス
                        <select
                            name="contractStatus"
                            defaultValue="CONTRACTED"
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
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
                        <Input name="amount" type="number" min="0" placeholder="1000000" />
                    </label>

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
