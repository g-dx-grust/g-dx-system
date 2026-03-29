import Link from 'next/link';
import type { ApprovalRequestListItem } from '@g-dx/contracts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createApprovalAction } from '../server-actions';
import {
    APPROVAL_STATUS_BADGE_VARIANTS,
    APPROVAL_STATUS_LABELS,
    APPROVAL_TYPE_LABELS,
    APPROVAL_TYPE_OPTIONS,
    formatApprovalDate,
    formatApprovalDateTime,
} from './approval-ui';

interface DealApprovalPanelProps {
    dealId: string;
    approvals: ApprovalRequestListItem[];
    canCreate: boolean;
    canRead: boolean;
}

export function DealApprovalPanel({ dealId, approvals, canCreate, canRead }: DealApprovalPanelProps) {
    if (!canCreate && !canRead) {
        return null;
    }

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <CardTitle className="text-lg text-gray-900">承認</CardTitle>
                        <CardDescription>この商談に紐づく承認申請と承認導線です。</CardDescription>
                    </div>
                    {canRead ? (
                        <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/sales/approvals?dealId=${dealId}`}>一覧を見る</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/sales/approvals/routes">承認ルート</Link>
                            </Button>
                        </div>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {canCreate ? (
                    <form action={createApprovalAction} className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
                        <input type="hidden" name="dealId" value={dealId} />
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            承認種別
                            <select
                                name="approvalType"
                                defaultValue="PRE_MEETING"
                                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {APPROVAL_TYPE_OPTIONS.map((type) => (
                                    <option key={type} value={type}>
                                        {APPROVAL_TYPE_LABELS[type]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            面談日
                            <input
                                type="date"
                                name="meetingDate"
                                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            補足メモ
                            <textarea
                                name="requestNote"
                                rows={3}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="申請背景や承認者に伝えたい補足を入力"
                            />
                        </label>
                        <div className="flex justify-end md:col-span-2">
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                                承認を申請する
                            </Button>
                        </div>
                    </form>
                ) : null}

                {canRead ? (
                    approvals.length === 0 ? (
                        <p className="text-sm text-gray-500">この商談の承認申請はまだありません。</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                        <th className="px-4 py-3">承認種別</th>
                                        <th className="px-4 py-3">ステータス</th>
                                        <th className="px-4 py-3">申請者</th>
                                        <th className="px-4 py-3">承認者</th>
                                        <th className="px-4 py-3">面談日</th>
                                        <th className="px-4 py-3">申請日時</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {approvals.map((approval) => (
                                        <tr key={approval.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link href={`/sales/approvals/${approval.id}`} className="font-medium text-gray-900 hover:underline">
                                                    {APPROVAL_TYPE_LABELS[approval.approvalType]}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={APPROVAL_STATUS_BADGE_VARIANTS[approval.approvalStatus]}>
                                                    {APPROVAL_STATUS_LABELS[approval.approvalStatus]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{approval.applicantName}</td>
                                            <td className="px-4 py-3 text-gray-700">{approval.approverName ?? '-'}</td>
                                            <td className="px-4 py-3 text-gray-700">{formatApprovalDate(approval.meetingDate)}</td>
                                            <td className="px-4 py-3 text-gray-700">{formatApprovalDateTime(approval.appliedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : null}
            </CardContent>
        </Card>
    );
}
