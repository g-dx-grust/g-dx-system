import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createContactAction } from '@/modules/customer-management/contact/server-actions';

interface CompanyOption {
    id: string;
    name: string;
}

interface ContactCreateFormProps {
    companies: CompanyOption[];
    defaultCompanyId?: string;
    errorMessage?: string;
}

export function ContactCreateForm({ companies, defaultCompanyId, errorMessage }: ContactCreateFormProps) {
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardDescription>担当者情報を入力して登録してください。</CardDescription>
            </CardHeader>
            <CardContent>
                {errorMessage ? (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <form action={createContactAction} className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        会社
                        <select
                            name="companyId"
                            defaultValue={defaultCompanyId ?? companies[0]?.id ?? ''}
                            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        >
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        コンタクト名
                        <Input name="name" required placeholder="佐藤 花子" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        部署
                        <Input name="department" placeholder="営業部" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        役職
                        <Input name="title" placeholder="マネージャー" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        メールアドレス
                        <Input name="email" type="email" placeholder="hanako@example.com" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        電話番号
                        <Input name="phone" placeholder="090-0000-0000" />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-gray-300" />
                        この会社のプライマリコンタクトに設定する
                    </label>
                    <div className="flex items-center justify-end gap-2 md:col-span-2">
                        <Button asChild variant="outline" className="px-6"><Link href="/customers/contacts">キャンセル</Link></Button>
                        <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">コンタクトを登録</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
