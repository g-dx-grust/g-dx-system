import Link from 'next/link';
import type { DealNextActionItem } from '@g-dx/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NextActionListProps {
    title: string;
    items: DealNextActionItem[];
}

export function NextActionList({ title, items }: NextActionListProps) {
    if (items.length === 0) {
        return (
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-900">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">予定はありません</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900">{title}（{items.length}件）</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">会社名</th>
                                <th className="px-4 py-3">担当者</th>
                                <th className="px-4 py-3">次回アクション</th>
                                <th className="px-4 py-3">前回アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <tr key={item.dealId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link href={`/sales/deals/${item.dealId}`} className="font-medium text-gray-900 hover:underline">
                                            {item.companyName}
                                        </Link>
                                        <div className="mt-0.5 text-xs text-gray-500">{item.dealName}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {item.ownerName}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">{item.nextActionContent ?? '-'}</div>
                                        <div className="mt-0.5 text-xs text-gray-500">{item.nextActionDate}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-700">{item.lastActivitySummary ?? '-'}</div>
                                        {item.lastActivityDate && (
                                            <div className="mt-0.5 text-xs text-gray-500">{item.lastActivityDate}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
