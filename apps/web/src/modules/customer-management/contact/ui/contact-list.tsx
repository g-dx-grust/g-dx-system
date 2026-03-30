import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { ContactListItem } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactListProps {
    contacts: ContactListItem[];
    total: number;
    created?: boolean;
    keyword?: string;
    companyId?: string;
}

export function ContactList({ contacts, total, created = false, keyword, companyId }: ContactListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">コンタクト一覧</h1>
                    <p className="text-sm text-gray-500">担当者 {total}件</p>
                </div>
                <Button asChild size="icon" className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700" title="新規コンタクト登録">
                    <Link href={companyId ? `/customers/contacts/new?companyId=${companyId}` : '/customers/contacts/new'}>
                        <Plus className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form action="/customers/contacts" className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <input
                            type="search"
                            name="keyword"
                            defaultValue={keyword ?? ''}
                            placeholder="コンタクト名・メールで検索"
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <input type="hidden" name="companyId" value={companyId ?? ''} />
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">
                                検索
                            </Button>
                            {(keyword || companyId) ? (
                                <Button asChild variant="outline" className="px-5">
                                    <Link href="/customers/contacts">クリア</Link>
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {created ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    コンタクトを登録しました。
                </div>
            ) : null}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">コンタクトディレクトリ</CardTitle>
                    <CardDescription>担当者一覧</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {contacts.length === 0 ? (
                        <div className="px-6 py-12 text-sm text-gray-500">
                            {keyword || companyId
                                ? '条件に一致するコンタクトはありません。'
                                : 'このビジネスにはまだコンタクトが登録されていません。'}
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">コンタクト名</th>
                                    <th className="px-6 py-3 font-medium">会社</th>
                                    <th className="px-6 py-3 font-medium">部署</th>
                                    <th className="px-6 py-3 font-medium">メール</th>
                                    <th className="px-6 py-3 font-medium">電話番号</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                {contacts.map((contact) => (
                                    <tr key={contact.id}>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link
                                                href={`/customers/contacts/${contact.id}`}
                                                className="hover:text-gray-700 hover:underline"
                                            >
                                                {contact.name}
                                            </Link>
                                            {contact.title ? (
                                                <p className="mt-1 text-xs font-normal text-gray-500">{contact.title}</p>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4">
                                            {contact.companyId ? (
                                                <Link
                                                    href={`/customers/companies/${contact.companyId}`}
                                                    className="hover:text-gray-700 hover:underline"
                                                >
                                                    {contact.companyName}
                                                </Link>
                                            ) : (
                                                contact.companyName
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{contact.department ?? '-'}</td>
                                        <td className="px-6 py-4">{contact.email ?? '-'}</td>
                                        <td className="px-6 py-4">{contact.phone ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
