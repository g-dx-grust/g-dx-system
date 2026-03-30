import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Plus } from 'lucide-react';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { isAppError } from '@/shared/server/errors';
import { listFacilities } from '@/modules/jet/facility/infrastructure/facility-repository';
import { Button } from '@/components/ui/button';

interface Props {
    searchParams?: { q?: string };
}

export default async function JetFacilitiesPage({ searchParams }: Props) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    if (session.activeBusinessScope !== 'WATER_SAVING') redirect('/dashboard/deals');

    let facilities;
    try {
        facilities = await listFacilities(searchParams?.q);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
                        <MapPin className="h-6 w-6 text-gray-500" />
                        施設一覧
                    </h1>
                    <p className="text-sm text-gray-500">JET施設一覧</p>
                </div>
                <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                    <Link href="/jet/facilities/new">
                        <Plus className="mr-2 h-4 w-4" />
                        施設を登録
                    </Link>
                </Button>
            </div>

            {/* 検索 */}
            <form method="get" className="flex max-w-sm gap-2">
                <input
                    name="q"
                    defaultValue={searchParams?.q ?? ''}
                    placeholder="施設名・会社名・管理者名で検索"
                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
                <Button type="submit" variant="outline">検索</Button>
            </form>

            {/* テーブル */}
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                {facilities.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                        {searchParams?.q ? `「${searchParams.q}」に一致する施設が見つかりません。` : '施設が登録されていません。'}
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">施設名</th>
                                <th className="px-6 py-3 font-medium">会社</th>
                                <th className="px-6 py-3 font-medium">住所</th>
                                <th className="px-6 py-3 font-medium">管理者</th>
                                <th className="px-6 py-3 font-medium text-right">契約数</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                            {facilities.map((f) => (
                                <tr key={f.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <Link href={`/jet/facilities/${f.id}`} className="hover:underline">
                                            {f.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/customers/companies/${f.companyId}`} className="hover:underline text-gray-600">
                                            {f.companyName}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {[f.prefecture, f.city, f.addressLine1].filter(Boolean).join(' ') || '-'}
                                    </td>
                                    <td className="px-6 py-4">{f.managerName ?? '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                            {f.contractCount}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
