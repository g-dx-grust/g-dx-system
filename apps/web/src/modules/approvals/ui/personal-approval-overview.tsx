import Link from 'next/link';
import type { ApprovalRequestListItem } from '@g-dx/contracts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    APPROVAL_STATUS_BADGE_VARIANTS,
    APPROVAL_STATUS_LABELS,
    APPROVAL_TYPE_LABELS,
    formatApprovalDate,
    formatApprovalDateTime,
} from './approval-ui';

interface PersonalApprovalOverviewProps {
    pendingItems: ApprovalRequestListItem[];
    requestedItems: ApprovalRequestListItem[];
}

export function PersonalApprovalOverview({
    pendingItems,
    requestedItems,
}: PersonalApprovalOverviewProps) {
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <CardTitle className="text-base text-gray-900">承認</CardTitle>
                        <CardDescription>
                            自分が対応する承認と、申請した案件の状況をまとめて確認できます。
                        </CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/sales/approvals">承認一覧へ</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
                <ApprovalSection
                    title="対応待ち"
                    description="自分が承認者になっている申請"
                    emptyMessage="対応待ちの承認はありません。"
                    items={pendingItems}
                />
                <ApprovalSection
                    title="申請中・最近の結果"
                    description="自分が申請した承認"
                    emptyMessage="自分が申請した承認はまだありません。"
                    items={requestedItems}
                />
            </CardContent>
        </Card>
    );
}

function ApprovalSection({
    title,
    description,
    emptyMessage,
    items,
}: {
    title: string;
    description: string;
    emptyMessage: string;
    items: ApprovalRequestListItem[];
}) {
    return (
        <section className="rounded-lg border border-gray-200 bg-gray-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500">{description}</p>
                </div>
                <Badge variant={items.length > 0 ? 'default' : 'outline'}>{items.length}件</Badge>
            </div>

            {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                    {emptyMessage}
                </p>
            ) : (
                <ul className="space-y-3">
                    {items.map((item) => (
                        <li key={item.id}>
                            <Link
                                href={`/sales/approvals/${item.id}`}
                                className="block rounded-lg border border-white bg-white px-4 py-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-gray-900">{item.dealTitle}</p>
                                            <Badge variant={APPROVAL_STATUS_BADGE_VARIANTS[item.approvalStatus]}>
                                                {APPROVAL_STATUS_LABELS[item.approvalStatus]}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {item.companyName} / {APPROVAL_TYPE_LABELS[item.approvalType]}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-gray-400">
                                        <div>申請: {formatApprovalDateTime(item.appliedAt)}</div>
                                        <div>面談: {formatApprovalDate(item.meetingDate)}</div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
