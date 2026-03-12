import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { isAppError } from '@/shared/server/errors';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { createFacilityAction } from '@/modules/jet/facility/server-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default async function NewFacilityPage() {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    if (session.activeBusinessScope !== 'WATER_SAVING') redirect('/dashboard/deals');

    let companies;
    try {
        const result = await listCompanies({ pageSize: 200 });
        companies = result.data;
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
                        <MapPin className="h-6 w-6 text-gray-500" />
                        施設を登録
                    </h1>
                    <p className="text-sm text-gray-500">節水事業の新規施設を登録します。</p>
                </div>
                <Button asChild variant="outline" className="px-5">
                    <Link href="/jet/facilities">一覧へ戻る</Link>
                </Button>
            </div>

            <Card className="max-w-2xl border-gray-200 shadow-sm">
                <CardHeader>
                    <CardDescription>必須項目を入力して施設を登録します。</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createFacilityAction} className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-1.5 text-sm font-medium text-gray-700 md:col-span-2">
                            会社 <span className="text-red-500">*</span>
                            <select
                                name="companyId"
                                required
                                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">会社を選択してください</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium text-gray-700 md:col-span-2">
                            施設名 <span className="text-red-500">*</span>
                            <Input name="name" required placeholder="例: 〇〇ビル" />
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                            管理者名
                            <Input name="managerName" placeholder="例: 田中 太郎" />
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                            電話番号
                            <Input name="mainPhone" placeholder="例: 03-0000-0000" />
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                            都道府県
                            <Input name="prefecture" placeholder="例: 東京都" />
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                            市区町村
                            <Input name="city" placeholder="例: 新宿区" />
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium text-gray-700 md:col-span-2">
                            番地・建物名
                            <Input name="addressLine1" placeholder="例: 西新宿1-1-1 〇〇ビル3F" />
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium text-gray-700 md:col-span-2">
                            メモ
                            <textarea
                                name="memo"
                                rows={3}
                                placeholder="備考・特記事項があれば記入してください"
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </label>

                        <div className="flex items-center justify-end gap-3 md:col-span-2">
                            <Button asChild variant="outline">
                                <Link href="/jet/facilities">キャンセル</Link>
                            </Button>
                            <Button type="submit" className="bg-blue-600 px-8 text-white hover:bg-blue-700">
                                登録する
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
