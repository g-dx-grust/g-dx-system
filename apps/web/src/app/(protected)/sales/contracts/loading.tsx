import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContractsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-64 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-20 rounded-md" />
            </div>

            <div className="grid gap-3 md:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-md border px-3 py-2 text-center">
                        <Skeleton className="mx-auto h-6 w-8" />
                        <Skeleton className="mx-auto mt-1 h-3 w-16" />
                    </div>
                ))}
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-3">タイトル</th>
                                    <th className="px-4 py-3">会社名</th>
                                    <th className="px-4 py-3">ステータス</th>
                                    <th className="px-4 py-3">金額</th>
                                    <th className="px-4 py-3">契約日</th>
                                    <th className="px-4 py-3">サービス開始</th>
                                    <th className="px-4 py-3">担当者</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3">
                                            <Skeleton className="h-4 w-36" />
                                            <Skeleton className="mt-1 h-3 w-20" />
                                        </td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
