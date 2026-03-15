import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { CompanyDetail } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { updateCompanyAction } from '@/modules/customer-management/company/server-actions';
import { createContactFromCompanyAction } from '@/modules/customer-management/contact/server-actions';

interface CompanyDetailProps {
    company: CompanyDetail;
    updated?: boolean;
    contactAdded?: boolean;
    contactError?: string;
}

export function CompanyDetailView({ company, updated = false, contactAdded = false, contactError }: CompanyDetailProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">{company.name}</h1>
                    <p className="text-sm text-gray-500">会社の詳細情報です。</p>
                </div>
                <Button asChild variant="outline" className="px-5">
                    <Link href="/customers/companies">一覧へ戻る</Link>
                </Button>
            </div>

            {updated && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    会社情報を更新しました。
                </div>
            )}

            {/* 基本情報 + 関連案件 */}
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
                            <Link href={`/sales/deals?companyId=${company.id}`}>すべて表示</Link>
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
                                                <Link href={`/sales/deals/${deal.id}`} className="hover:underline">
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

            {/* コンタクト */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">コンタクト</CardTitle>
                    <CardDescription>この会社の担当者一覧です。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-0 p-0">
                    {/* 通知 */}
                    {contactAdded && (
                        <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                            コンタクトを追加しました。
                        </div>
                    )}
                    {contactError && (
                        <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {contactError === 'validation' ? '名前は必須です。' : '登録に失敗しました。再度お試しください。'}
                        </div>
                    )}

                    {/* 一覧 */}
                    {company.contacts.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-500">
                            コンタクトが登録されていません。
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">名前</th>
                                    <th className="px-6 py-3 font-medium">部署 / 役職</th>
                                    <th className="px-6 py-3 font-medium">メール</th>
                                    <th className="px-6 py-3 font-medium">電話</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                {company.contacts.map((contact) => (
                                    <tr key={contact.id}>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link href={`/customers/contacts/${contact.id}`} className="hover:underline">
                                                {contact.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {[contact.department, contact.title].filter(Boolean).join(' / ') || '-'}
                                        </td>
                                        <td className="px-6 py-4">{contact.email ?? '-'}</td>
                                        <td className="px-6 py-4">{contact.phone ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* インライン追加フォーム（アコーディオン） */}
                    <details className="group border-t border-gray-100">
                        <summary className="flex cursor-pointer select-none list-none items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 [&::-webkit-details-marker]:hidden">
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                            コンタクトを追加
                        </summary>
                        <div className="border-t border-gray-100 bg-gray-50 px-6 pb-6 pt-4">
                            <form action={createContactFromCompanyAction} className="grid gap-4 md:grid-cols-2">
                                <input type="hidden" name="companyId" value={company.id} />
                                <label className="grid gap-1.5 text-sm font-medium text-gray-700 md:col-span-2">
                                    名前 <span className="text-red-500 font-normal">*</span>
                                    <Input name="name" required placeholder="佐藤 花子" />
                                </label>
                                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                    部署
                                    <Input name="department" placeholder="営業部" />
                                </label>
                                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                    役職
                                    <Input name="title" placeholder="マネージャー" />
                                </label>
                                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                    メールアドレス
                                    <Input name="email" type="email" placeholder="hanako@example.com" />
                                </label>
                                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                    電話番号
                                    <Input name="phone" placeholder="090-0000-0000" />
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-gray-300" />
                                    プライマリコンタクトに設定する
                                </label>
                                <div className="flex justify-end md:col-span-2">
                                    <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">
                                        追加
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </details>
                </CardContent>
            </Card>

            {/* 会社情報を編集（アコーディオン） */}
            <details className="group rounded-lg border border-gray-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer select-none list-none items-center justify-between px-6 py-4 [&::-webkit-details-marker]:hidden">
                    <div>
                        <p className="text-lg font-semibold text-gray-900">会社情報を編集</p>
                        <p className="mt-0.5 text-sm text-gray-500">クリックして基本情報を編集</p>
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="border-t border-gray-100 px-6 pb-6 pt-5">
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
                </div>
            </details>
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
