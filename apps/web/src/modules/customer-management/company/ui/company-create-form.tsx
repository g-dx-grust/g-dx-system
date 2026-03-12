import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createCompanyAction } from '@/modules/customer-management/company/server-actions';

interface IndustryOption {
    code: string;
    label: string;
    majorCategory: string;
    minorCategory: string;
}

interface CompanyCreateFormProps {
    industries: IndustryOption[];
    errorMessage?: string;
}

export function CompanyCreateForm({ industries, errorMessage }: CompanyCreateFormProps) {
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardDescription>
                    会社情報を入力して登録してください。
                </CardDescription>
            </CardHeader>
            <CardContent>
                {errorMessage ? (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <form action={createCompanyAction} className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        会社名 <span className="text-red-500">*</span>
                        <Input name="name" required placeholder="G-DX Corporation" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        業種
                        <Input
                            name="industry"
                            list="company-industry-options"
                            autoComplete="off"
                            placeholder="例: SaaS"
                        />
                        <datalist id="company-industry-options">
                            {industries.map((industry) => (
                                <option
                                    key={industry.code}
                                    value={industry.label}
                                    label={`${industry.majorCategory} / ${industry.minorCategory}`}
                                />
                            ))}
                        </datalist>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        電話番号
                        <Input name="phone" placeholder="03-0000-0000" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        ウェブサイト
                        <Input name="website" placeholder="https://example.com" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        郵便番号
                        <Input name="postalCode" placeholder="1000001" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        タグ
                        <Input name="tags" placeholder="エンタープライズ, インバウンド" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        住所
                        <textarea
                            name="address"
                            rows={4}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="東京都千代田区..."
                        />
                    </label>

                    <div className="flex items-center justify-end gap-2 md:col-span-2">
                        <Button asChild variant="outline" className="px-6">
                            <Link href="/customers/companies">キャンセル</Link>
                        </Button>
                        <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">
                            会社を登録
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
