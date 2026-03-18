import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CallQueueLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">コールキュー</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">会社名</th>
                                <th className="px-6 py-3 font-medium">電話番号</th>
                                <th className="px-6 py-3 font-medium">優先度</th>
                                <th className="px-6 py-3 font-medium">ステータス</th>
                                <th className="px-6 py-3 font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-8 w-20 rounded-md" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
