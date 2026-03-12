import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CompanyDetail } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { updateCompanyAction } from '@/modules/customer-management/company/server-actions';
import { BUSINESS_SCOPE_LABELS } from '@/shared/constants/business-scopes';

interface CompanyDetailProps {
    company: CompanyDetail;
    updated?: boolean;
}

export function CompanyDetailView({ company, updated = false }: CompanyDetailProps) {
    const openDealEntries = Object.entries(company.openDealsSummary);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">{company.name}</h1>
                    <p className="text-sm text-gray-500">
                        会社の詳細情報です。
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="px-5">
                        <Link href="/customers/companies">一覧へ戻る</Link>
                    </Button>
                    <Button asChild size="icon" className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700" title="コンタクトを追加">
                        <Link href={`/customers/contacts/new?companyId=${company.id}`}><Plus className="h-5 w-5" /></Link>
                    </Button>
                </div>
            </div>

            {updated ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    会社情報を更新しました。
                </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">基本情報</CardTitle>
                        <CardDescription>会社の基本情報です。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <OverviewItem label="業種" value={company.industry ?? '-'} />
                        <OverviewItem label="電話番号" value={company.phone ?? '-'} />
                        <OverviewItem label="ウェブサイト" value={company.website ?? '-'} />
                        <OverviewItem label="担当者" value={company.ownerUser?.name ?? '-'} />
                        <OverviewItem label="住所" value={company.address ?? '-'} className="sm:col-span-2" />
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <CardTitle className="text-lg text-gray-900">関連案件</CardTitle>
                            <CardDescription>この会社に紐づく案件（最新10件）</CardDescription>
                        </div>
                        <Button asChild variant="outline">
                            <Link href={`/sales/deals?companyId=${company.id}`}>すべての案件を表示</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {company.relatedDeals.length === 0 ? (
                            <div className="px-6 py-8 text-center text-sm text-gray-500">
                                この会社に紐づく案件はありません。
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">案件名</th>
                                        <th className="px-6 py-3 font-medium">ステージ</th>
                                        <th className="px-6 py-3 font-medium">金額</th>
                                        <th className="px-6 py-3 font-medium">担当者</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                    {company.relatedDeals.map((deal) => (
                                        <tr key={deal.id}>
                                            <td className="px-6 py-3 font-medium text-gray-900">
                                                <Link
                                                    href={`/sales/deals/${deal.id}`}
                                                    className="hover:text-gray-700 hover:underline"
                                                >
                                                    {deal.title}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                    {deal.stageName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {deal.amount !== null ? `¥${deal.amount.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-3">{deal.ownerName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <CardTitle className="text-lg text-gray-900">コンタクト</CardTitle>
                        <CardDescription>このビジネスのコンタクト一覧です。</CardDescription>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={`/customers/contacts?companyId=${company.id}`}>すべてのコンタクトを表示</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {company.contacts.length === 0 ? (
                        <div className="px-6 py-12 text-sm text-gray-500">
                            この会社に紐づくコンタクトはありません。
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">コンタクト名</th>
                                    <th className="px-6 py-3 font-medium">部署</th>
                                    <th className="px-6 py-3 font-medium">メール</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                {company.contacts.map((contact) => (
                                    <tr key={contact.id}>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link
                                                href={`/customers/contacts/${contact.id}`}
                                                className="hover:text-gray-700 hover:underline"
                                            >
                                                {contact.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{contact.department ?? '-'}</td>
                                        <td className="px-6 py-4">{contact.email ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">会社情報を編集</CardTitle>
                    <CardDescription>
                        ビジネスプロフィールの基本情報を更新します。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateCompanyAction} className="grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="companyId" value={company.id} />
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            業種
                            <Input name="industry" defaultValue={company.industry ?? ''} placeholder="SaaS" />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            電話番号
                            <Input name="phone" defaultValue={company.phone ?? ''} placeholder="03-0000-0000" />
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

interface OverviewItemProps {
    label: string;
    value: string;
    className?: string;
}

function OverviewItem({ label, value, className }: OverviewItemProps) {
    return (
        <div className={className}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">{value}</p>
        </div>
    );
}
