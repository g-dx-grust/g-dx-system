import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AlliancesLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-64 rounded-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
                <Skeleton className="h-10 w-20 rounded-md" />
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">名前</th>
                                <th className="px-4 py-3">種別</th>
                                <th className="px-4 py-3">ステータス</th>
                                <th className="px-4 py-3">担当者</th>
                                <th className="px-4 py-3">登録日</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-5 w-12 rounded-full" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
