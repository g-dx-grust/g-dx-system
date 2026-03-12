import Link from 'next/link';
import type { ContactDetail } from '@/modules/customer-management/contact/domain/contact';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { updateContactAction } from '@/modules/customer-management/contact/server-actions';

interface ContactDetailProps {
    contact: ContactDetail;
    created?: boolean;
    updated?: boolean;
}

export function ContactDetailView({ contact, created = false, updated = false }: ContactDetailProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">{contact.name}</h1>
                    <p className="text-sm text-gray-500">担当者の詳細情報です。</p>
                </div>
                <Button asChild variant="outline" className="px-5">
                    <Link href="/customers/contacts">一覧へ戻る</Link>
                </Button>
            </div>

            {created ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    コンタクトを登録しました。
                </div>
            ) : null}

            {updated ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    コンタクト情報を更新しました。
                </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">基本情報</CardTitle>
                        <CardDescription>このビジネスで参照可能なコンタクト情報です。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <OverviewItem label="部署" value={contact.department ?? '-'} />
                        <OverviewItem label="役職" value={contact.title ?? '-'} />
                        <OverviewItem label="メールアドレス" value={contact.email ?? '-'} />
                        <OverviewItem label="電話番号" value={contact.phone ?? '-'} />
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">関連会社</CardTitle>
                        <CardDescription>このコンタクトに紐づく会社です。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {contact.linkedCompanies.length === 0 ? (
                            <p className="text-sm text-gray-500">関連する会社はありません。</p>
                        ) : (
                            contact.linkedCompanies.map((company) => (
                                <div key={company.id} className="rounded-md border border-gray-200 px-4 py-3">
                                    <Link
                                        href={`/customers/companies/${company.id}`}
                                        className="text-sm font-medium text-gray-900 hover:text-gray-700 hover:underline"
                                    >
                                        {company.name}
                                    </Link>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {company.isPrimary ? 'メイン会社' : 'サブ会社'}
                                    </p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">コンタクトを編集</CardTitle>
                    <CardDescription>コンタクトの基本情報を更新します。</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateContactAction} className="grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="contactId" value={contact.id} />
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            部署
                            <Input name="department" defaultValue={contact.department ?? ''} placeholder="営業部" />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            役職
                            <Input name="title" defaultValue={contact.title ?? ''} placeholder="マネージャー" />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            メールアドレス
                            <Input name="email" type="email" defaultValue={contact.email ?? ''} placeholder="hanako@example.com" />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            電話番号
                            <Input name="phone" defaultValue={contact.phone ?? ''} placeholder="090-0000-0000" />
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
}

function OverviewItem({ label, value }: OverviewItemProps) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 text-sm text-gray-900">{value}</p>
        </div>
    );
}
