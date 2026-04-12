import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';
import type { CompanyListItem } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { ResponsiveTable } from '@/components/ui/responsive-table';

interface CompanyListProps {
    companies: CompanyListItem[];
    total: number;
    page: number;
    pageSize: number;
    created?: boolean;
    keyword?: string;
}

export function CompanyList({ companies, total, page, pageSize, created = false, keyword }: CompanyListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">会社一覧</h1>
                    <p className="text-sm text-gray-500">
                        会社 {total}件
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="hidden sm:inline-flex gap-1.5 px-4">
                        <Link href="/customers/companies/import">
                            <Upload className="h-4 w-4" />
                            CSV取り込み
                        </Link>
                    </Button>
                    <Button asChild size="icon" className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700" title="新規会社登録">
                        <Link href="/customers/companies/new"><Plus className="h-5 w-5" /></Link>
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form action="/customers/companies" className="flex flex-col gap-3 md:flex-row">
                        <input
                            type="search"
                            name="keyword"
                            defaultValue={keyword ?? ''}
                            placeholder="会社名で検索"
                            className="h-10 min-h-[44px] md:min-h-0 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-blue-600 px-6 text-white hover:bg-blue-700">
                                検索
                            </Button>
                            {keyword ? (
                                <Button asChild variant="outline" className="px-5">
                                    <Link href="/customers/companies">クリア</Link>
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {created ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    会社を登録しました。
                </div>
            ) : null}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">会社ディレクトリ</CardTitle>
                    <CardDescription>
                        会社一覧
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {companies.length === 0 ? (
                        <div className="px-6 py-12 text-sm text-gray-500">
                            {keyword
                                ? '検索条件に一致する会社はありません。'
                                : 'このビジネスにはまだ会社が登録されていません。'}
                        </div>
                    ) : (
                        <ResponsiveTable
                            mobileCards={
                                <div className="divide-y divide-gray-200">
                                    {companies.map((company) => (
                                        <Link
                                            key={company.id}
                                            href={`/customers/companies/${company.id}`}
                                            className="block px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-900 truncate">{company.name}</p>
                                                    {company.industry && (
                                                        <p className="mt-0.5 text-xs text-gray-500">{company.industry}</p>
                                                    )}
                                                </div>
                                                {company.leadSource && (
                                                    <span className="shrink-0 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                        {company.leadSource}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                {company.phone && <span>{company.phone}</span>}
                                                {company.ownerUser && <span>担当: {company.ownerUser.name}</span>}
                                                {company.tags.length > 0 && <span>{company.tags.join(', ')}</span>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            }
                        >
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">会社名</th>
                                        <th className="px-6 py-3 font-medium">業種</th>
                                        <th className="px-6 py-3 font-medium">電話番号</th>
                                        <th className="px-6 py-3 font-medium">流入経路</th>
                                        <th className="px-6 py-3 font-medium">担当者</th>
                                        <th className="px-6 py-3 font-medium">タグ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                    {companies.map((company) => (
                                        <tr key={company.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="flex flex-col gap-1">
                                                    <Link
                                                        href={`/customers/companies/${company.id}`}
                                                        className="hover:text-gray-700 hover:underline"
                                                    >
                                                        {company.name}
                                                    </Link>
                                                    {company.website ? (
                                                        <span className="text-xs text-gray-500">{company.website}</span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{company.industry ?? '-'}</td>
                                            <td className="px-6 py-4">{company.phone ?? '-'}</td>
                                            <td className="px-6 py-4">{company.leadSource ?? '-'}</td>
                                            <td className="px-6 py-4">{company.ownerUser?.name ?? '-'}</td>
                                            <td className="px-6 py-4">
                                                {company.tags.length > 0 ? company.tags.join(', ') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ResponsiveTable>
                    )}
                </CardContent>
                <PaginationControls
                    pathname="/customers/companies"
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    query={{ keyword }}
                />
            </Card>
        </div>
    );
}
