import Link from 'next/link';
import type { ApprovalRequestListItem } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import {
    APPROVAL_STATUS_BADGE_VARIANTS,
    APPROVAL_STATUS_LABELS,
    APPROVAL_STATUS_OPTIONS,
    APPROVAL_TYPE_LABELS,
    APPROVAL_TYPE_OPTIONS,
    formatApprovalDate,
    formatApprovalDateTime,
} from './approval-ui';

interface ApprovalListViewProps {
    items: ApprovalRequestListItem[];
    total: number;
    filters: {
        approvalType?: string;
        approvalStatus?: string;
        dealId?: string;
    };
}

export function ApprovalListView({ items, total, filters }: ApprovalListViewProps) {
    const mobileCards = (
        <div className="space-y-3">
            {items.map((item) => (
                <Card key={item.id} className="border-gray-200 shadow-sm">
                    <CardContent className="space-y-3 pt-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <Link href={`/sales/approvals/${item.id}`} className="text-base font-semibold text-gray-900 hover:underline">
                                    {item.dealTitle}
                                </Link>
                                <p className="text-sm text-gray-500">{item.companyName}</p>
                            </div>
                            <Badge variant={APPROVAL_STATUS_BADGE_VARIANTS[item.approvalStatus]}>
                                {APPROVAL_STATUS_LABELS[item.approvalStatus]}
                            </Badge>
                        </div>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                            <ApprovalMetaItem label="承認種別" value={APPROVAL_TYPE_LABELS[item.approvalType]} />
                            <ApprovalMetaItem label="申請者" value={item.applicantName} />
                            <ApprovalMetaItem label="承認者" value={item.approverName ?? '-'} />
                            <ApprovalMetaItem label="面談日" value={formatApprovalDate(item.meetingDate)} />
                            <ApprovalMetaItem label="申請日時" value={formatApprovalDateTime(item.appliedAt)} />
                        </dl>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">承認一覧</h1>
                    <p className="text-sm text-gray-500">申請中の承認と過去の判断履歴を確認できます。</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/sales/approvals/routes">承認ルートを見る</Link>
                </Button>
            </div>

            <Card className="border-gray-200 shadow-sm">
                <CardContent className="pt-6">
                    <form action="/sales/approvals" className="flex flex-col gap-3 md:flex-row md:items-end">
                        {filters.dealId ? <input type="hidden" name="dealId" value={filters.dealId} /> : null}
                        <label className="grid gap-1 text-sm text-gray-600">
                            <span>承認種別</span>
                            <select
                                name="approvalType"
                                defaultValue={filters.approvalType ?? ''}
                                className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">すべて</option>
                                {APPROVAL_TYPE_OPTIONS.map((type) => (
                                    <option key={type} value={type}>
                                        {APPROVAL_TYPE_LABELS[type]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-sm text-gray-600">
                            <span>ステータス</span>
                            <select
                                name="approvalStatus"
                                defaultValue={filters.approvalStatus ?? ''}
                                className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">すべて</option>
                                {APPROVAL_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {APPROVAL_STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                                絞り込む
                            </Button>
                            {(filters.approvalType || filters.approvalStatus || filters.dealId) ? (
                                <Button asChild variant="outline">
                                    <Link href={filters.dealId ? `/sales/approvals?dealId=${filters.dealId}` : '/sales/approvals'}>
                                        リセット
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">承認リクエスト</CardTitle>
                    <CardDescription>{total} 件</CardDescription>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">条件に一致する承認リクエストはありません。</p>
                    ) : (
                        <ResponsiveTable mobileCards={mobileCards}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                            <th className="px-4 py-3">案件</th>
                                            <th className="px-4 py-3">承認種別</th>
                                            <th className="px-4 py-3">ステータス</th>
                                            <th className="px-4 py-3">申請者</th>
                                            <th className="px-4 py-3">承認者</th>
                                            <th className="px-4 py-3">面談日</th>
                                            <th className="px-4 py-3">申請日時</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <Link href={`/sales/approvals/${item.id}`} className="font-medium text-gray-900 hover:underline">
                                                        {item.dealTitle}
                                                    </Link>
                                                    <div className="mt-0.5 text-xs text-gray-500">{item.companyName}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{APPROVAL_TYPE_LABELS[item.approvalType]}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={APPROVAL_STATUS_BADGE_VARIANTS[item.approvalStatus]}>
                                                        {APPROVAL_STATUS_LABELS[item.approvalStatus]}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{item.applicantName}</td>
                                                <td className="px-4 py-3 text-gray-700">{item.approverName ?? '-'}</td>
                                                <td className="px-4 py-3 text-gray-700">{formatApprovalDate(item.meetingDate)}</td>
                                                <td className="px-4 py-3 text-gray-700">{formatApprovalDateTime(item.appliedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ResponsiveTable>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function ApprovalMetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{value}</dd>
        </div>
    );
}
