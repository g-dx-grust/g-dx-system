import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApprovalsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-40 rounded-md" />
                <Skeleton className="h-10 w-40 rounded-md" />
                <Skeleton className="h-10 w-20 rounded-md" />
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">案件名</th>
                                <th className="px-4 py-3">承認種別</th>
                                <th className="px-4 py-3">ステータス</th>
                                <th className="px-4 py-3">申請者</th>
                                <th className="px-4 py-3">承認者</th>
                                <th className="px-4 py-3">申請日時</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="mt-1 h-3 w-24" />
                                    </td>
                                    <td className="px-4 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
