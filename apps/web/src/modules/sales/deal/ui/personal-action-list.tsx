import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PersonalNextActionItem, NextActionUrgency } from '@g-dx/contracts';

interface PersonalActionListProps {
    items: PersonalNextActionItem[];
    className?: string;
}

const URGENCY_CONFIG: Record<
    NextActionUrgency,
    { label: string; badgeVariant: 'destructive' | 'warning' | 'outline' }
> = {
    OVERDUE: { label: '期限超過', badgeVariant: 'destructive' },
    TODAY: { label: '今日期限', badgeVariant: 'warning' },
    THIS_WEEK: { label: '今後2週間', badgeVariant: 'outline' },
};

const URGENCY_ORDER: NextActionUrgency[] = ['OVERDUE', 'TODAY', 'THIS_WEEK'];

function formatAmount(amount: number | null): string {
    if (amount === null) return '-';
    if (amount >= 10_000) return `¥${Math.round(amount / 10_000).toLocaleString()}万`;
    return `¥${amount.toLocaleString()}`;
}

export function PersonalActionList({ items, className }: PersonalActionListProps) {
    const grouped: Record<NextActionUrgency, PersonalNextActionItem[]> = {
        OVERDUE: [],
        TODAY: [],
        THIS_WEEK: [],
    };
    for (const item of items) {
        grouped[item.urgency].push(item);
    }

    const hasAny = items.length > 0;

    return (
        <Card className={`border-gray-200 shadow-sm ${className ?? ''}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900">
                    近日中のアクションリスト（{items.length}件）
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasAny && (
                    <p className="text-sm text-gray-500">今後2週間の行動予定はありません</p>
                )}
                {URGENCY_ORDER.map((urgency) => {
                    const sectionItems = grouped[urgency];
                    if (sectionItems.length === 0) return null;
                    const { label, badgeVariant } = URGENCY_CONFIG[urgency];
                    return (
                        <div key={urgency}>
                            <div className="mb-2 flex items-center gap-2">
                                <Badge variant={badgeVariant}>{label}</Badge>
                                <span className="text-xs text-gray-500">{sectionItems.length}件</span>
                            </div>

                            {/* モバイル: カード表示 */}
                            <div className="space-y-2 md:hidden">
                                {sectionItems.map((item) => (
                                    <div key={item.dealId} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/sales/deals/${item.dealId}`}
                                                    className="block truncate text-sm font-medium text-gray-900 hover:underline"
                                                >
                                                    {item.companyName}
                                                </Link>
                                                <div className="mt-0.5 truncate text-xs text-gray-500">{item.dealName}</div>
                                            </div>
                                            <span className="shrink-0 tabular-nums text-xs font-medium text-gray-600">
                                                {formatAmount(item.amount)}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-600">{item.stageName}</span>
                                            {item.nextActionDate && <span>{item.nextActionDate}</span>}
                                        </div>
                                        {item.nextActionContent && (
                                            <div className="mt-1 line-clamp-2 text-xs text-gray-600">{item.nextActionContent}</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* デスクトップ: テーブル表示 */}
                            <div className="hidden overflow-x-auto rounded-md border border-gray-100 md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500">
                                            <th className="px-3 py-2">会社名 / 案件名</th>
                                            <th className="px-3 py-2">ステージ</th>
                                            <th className="px-3 py-2">次回アクション</th>
                                            <th className="px-3 py-2 text-right">金額</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sectionItems.map((item) => (
                                            <tr key={item.dealId} className="hover:bg-gray-50">
                                                <td className="px-3 py-2">
                                                    <Link
                                                        href={`/sales/deals/${item.dealId}`}
                                                        className="font-medium text-gray-900 hover:underline"
                                                    >
                                                        {item.companyName}
                                                    </Link>
                                                    <div className="mt-0.5 text-xs text-gray-500">
                                                        {item.dealName}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-600">
                                                    {item.stageName}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="text-xs text-gray-700">
                                                        {item.nextActionContent ?? '-'}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-gray-400">
                                                        {item.nextActionDate}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right text-xs text-gray-600 tabular-nums">
                                                    {formatAmount(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
