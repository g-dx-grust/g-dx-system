import Link from 'next/link';
import type { ApprovalRequestDetail } from '@g-dx/contracts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmitButton } from '@/components/ui/submit-button';
import { decideApprovalAction } from '../server-actions';
import {
    APPROVAL_STATUS_BADGE_VARIANTS,
    APPROVAL_STATUS_LABELS,
    APPROVAL_TYPE_LABELS,
    formatApprovalDate,
    formatApprovalDateTime,
    formatSnapshotValue,
} from './approval-ui';

interface ApprovalDetailViewProps {
    detail: ApprovalRequestDetail;
    canDecide: boolean;
    decided?: boolean;
}

export function ApprovalDetailView({ detail, canDecide, decided = false }: ApprovalDetailViewProps) {
    const snapshotEntries = Object.entries(detail.snapshotData ?? {});

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-900">{detail.dealTitle}</h1>
                        <Badge variant={APPROVAL_STATUS_BADGE_VARIANTS[detail.approvalStatus]}>
                            {APPROVAL_STATUS_LABELS[detail.approvalStatus]}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{detail.companyName}</p>
                    <p className="text-sm text-gray-700">{APPROVAL_TYPE_LABELS[detail.approvalType]}</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/sales/deals/${detail.dealId}`}>商談に戻る</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/sales/approvals?dealId=${detail.dealId}`}>案件の承認一覧</Link>
                    </Button>
                </div>
            </div>

            {decided ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    承認結果を更新しました。
                </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-gray-900">申請情報</CardTitle>
                            <CardDescription>承認の基本情報と判断履歴です。</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <ApprovalInfoItem label="承認種別" value={APPROVAL_TYPE_LABELS[detail.approvalType]} />
                            <ApprovalInfoItem label="ステータス" value={APPROVAL_STATUS_LABELS[detail.approvalStatus]} />
                            <ApprovalInfoItem label="申請者" value={detail.applicantName} />
                            <ApprovalInfoItem label="承認者" value={detail.approverName ?? '-'} />
                            <ApprovalInfoItem label="商談日" value={formatApprovalDate(detail.meetingDate)} />
                            <ApprovalInfoItem label="資料URL" value={detail.documentUrl ?? '-'} />
                            <ApprovalInfoItem label="申請日時" value={formatApprovalDateTime(detail.appliedAt)} />
                            <ApprovalInfoItem label="承認日時" value={formatApprovalDateTime(detail.decidedAt)} />
                            <ApprovalInfoItem label="期限" value={formatApprovalDateTime(detail.deadlineAt)} />
                            <ApprovalInfoItem label="判断コメント" value={detail.decisionComment ?? '-'} className="sm:col-span-2" />
                            <ApprovalInfoItem label="失効理由" value={detail.expiryReason ?? '-'} className="sm:col-span-2" />
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-gray-900">チェック項目</CardTitle>
                            <CardDescription>申請時に登録されたチェック内容です。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {detail.checkItems.length === 0 ? (
                                <p className="text-sm text-gray-500">登録済みのチェック項目はありません。</p>
                            ) : (
                                <div className="space-y-3">
                                    {detail.checkItems.map((item) => (
                                        <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-medium text-gray-900">{item.itemCode}</p>
                                                <Badge variant={item.checkResult === true ? 'success' : item.checkResult === false ? 'destructive' : 'outline'}>
                                                    {item.checkResult === true ? 'OK' : item.checkResult === false ? 'NG' : '未評価'}
                                                </Badge>
                                            </div>
                                            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                                <ApprovalInfoItem label="入力値" value={item.inputValue ?? '-'} />
                                                <ApprovalInfoItem label="顧客反応" value={item.customerReaction ?? '-'} />
                                                <ApprovalInfoItem label="コメント" value={item.comment ?? '-'} className="sm:col-span-2" />
                                                <ApprovalInfoItem label="証跡URL" value={item.evidenceFileUrl ?? '-'} className="sm:col-span-2" />
                                            </dl>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-gray-900">申請スナップショット</CardTitle>
                            <CardDescription>申請時点で保存された補足情報です。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {snapshotEntries.length === 0 ? (
                                <p className="text-sm text-gray-500">補足情報は登録されていません。</p>
                            ) : (
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    {snapshotEntries.map(([key, value]) => (
                                        <ApprovalInfoItem
                                            key={key}
                                            label={key}
                                            value={formatSnapshotValue(value)}
                                            className={typeof value === 'object' ? 'sm:col-span-2' : undefined}
                                        />
                                    ))}
                                </dl>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-gray-900">判断</CardTitle>
                            <CardDescription>申請中の承認のみ判断できます。</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {detail.approvalStatus !== 'PENDING' ? (
                                <p className="text-sm text-gray-500">この承認はすでに判断済みです。</p>
                            ) : !canDecide ? (
                                <p className="text-sm text-gray-500">この承認を判断する権限がありません。</p>
                            ) : (
                                <form action={decideApprovalAction} className="space-y-4">
                                    <input type="hidden" name="approvalId" value={detail.id} />
                                    <input type="hidden" name="dealId" value={detail.dealId} />
                                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                                        コメント
                                        <textarea
                                            name="comment"
                                            rows={4}
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="判断理由や差し戻し時の補足を入力"
                                        />
                                    </label>
                                    <div className="grid gap-2">
                                        <SubmitButton name="decision" value="APPROVED" pendingText="処理中..." className="bg-emerald-600 text-white hover:bg-emerald-700">
                                            承認する
                                        </SubmitButton>
                                        <SubmitButton name="decision" value="RETURNED" pendingText="処理中..." variant="outline">
                                            差し戻す
                                        </SubmitButton>
                                        <SubmitButton name="decision" value="REJECTED" pendingText="処理中..." variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                                            却下する
                                        </SubmitButton>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ApprovalInfoItem({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div className={className}>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm text-gray-900">{value}</dd>
        </div>
    );
}
