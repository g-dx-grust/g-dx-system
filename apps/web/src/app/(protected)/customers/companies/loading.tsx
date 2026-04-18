import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompaniesLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-28 rounded-md" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <Skeleton className="h-10 flex-1 rounded-md" />
                        <Skeleton className="h-10 w-20 rounded-md" />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">会社ディレクトリ</CardTitle>
                    <CardDescription>会社一覧</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
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
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <Skeleton className="h-4 w-36" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
