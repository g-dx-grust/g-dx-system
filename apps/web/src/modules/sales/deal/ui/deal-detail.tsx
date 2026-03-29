import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type {
    ApprovalRequestListItem,
    ApprovalRouteItem,
    DealActivityItem,
    DealDetail,
    DealStageKey,
    HearingCompletionStatus,
    HearingRecord,
    PipelineStageDefinition,
} from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DealApprovalPanel } from '@/modules/approvals/ui/deal-approval-panel';
import { HearingPanel } from '@/modules/sales/hearing/ui/hearing-panel';
import { SubmitButton, FormAutoClose } from '@/components/ui/submit-button';
import { updateDealAction, changeDealStageAction, saveLarkSettingsAction } from '@/modules/sales/deal/server-actions';
import { DealActivityLog, DealActivitySidebarForm } from './deal-activity-log';
import type { DealStageHistoryItem } from '../infrastructure/deal-repository';

interface DealDetailViewProps {
    deal: DealDetail;
    stages: PipelineStageDefinition[];
    activities: DealActivityItem[];
    stageHistory?: DealStageHistoryItem[];
    updated?: boolean;
    staged?: boolean;
    activityAdded?: boolean;
    larkSaved?: boolean;
    approvalCreated?: boolean;
    hearingSaved?: boolean;
    hearingRecord: HearingRecord | null;
    hearingCompletion: HearingCompletionStatus;
    approvalRequests: ApprovalRequestListItem[];
    approvalRoutes: ApprovalRouteItem[];
    canEditHearing: boolean;
    canCreateApproval: boolean;
    canReadApprovals: boolean;
}

const STAGE_LABELS: Record<DealStageKey, string> = {
    APO_ACQUIRED: 'アポ獲得',
    NEGOTIATING: '商談中・見積提示',
    ALLIANCE: 'アライアンス',
    PENDING: 'ペンディング',
    APO_CANCELLED: 'アポキャン',
    LOST: '失注・不明',
    CONTRACTED: '契約済み',
};

const STAGE_COLORS: Record<DealStageKey, string> = {
    APO_ACQUIRED: 'bg-gray-200 text-gray-700',
    NEGOTIATING: 'bg-gray-300 text-gray-700',
    ALLIANCE: 'bg-gray-200 text-gray-600',
    PENDING: 'bg-gray-100 text-gray-500',
    APO_CANCELLED: 'bg-gray-200 text-gray-500',
    LOST: 'bg-red-100 text-red-700',
    CONTRACTED: 'bg-gray-900 text-white',
};

const STAGE_DOT_COLORS: Record<DealStageKey, string> = {
    APO_ACQUIRED: 'bg-blue-400',
    NEGOTIATING: 'bg-blue-600',
    ALLIANCE: 'bg-purple-400',
    PENDING: 'bg-yellow-400',
    APO_CANCELLED: 'bg-gray-400',
    LOST: 'bg-red-400',
    CONTRACTED: 'bg-emerald-500',
};

const STAGE_BUTTON_STYLES: Record<DealStageKey, string> = {
    APO_ACQUIRED: 'text-gray-700 hover:bg-gray-50',
    NEGOTIATING: 'text-gray-700 hover:bg-gray-50',
    ALLIANCE: 'text-gray-700 hover:bg-gray-50',
    PENDING: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300',
    APO_CANCELLED: 'border-gray-300 text-gray-500 hover:bg-gray-50',
    LOST: 'border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300',
    CONTRACTED: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700',
};

export function DealDetailView({
    deal,
    stages,
    activities,
    stageHistory = [],
    updated = false,
    staged = false,
    activityAdded = false,
    larkSaved = false,
    approvalCreated = false,
    hearingSaved = false,
    hearingRecord,
    hearingCompletion,
    approvalRequests,
    approvalRoutes,
    canEditHearing,
    canCreateApproval,
    canReadApprovals,
}: DealDetailViewProps) {
    const isOpen = deal.status === 'open';
    const otherStages = stages.filter((s) => s.key !== deal.stage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-gray-900">{deal.name}</h1>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_COLORS[deal.stage]}`}>
                            {STAGE_LABELS[deal.stage]}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        {deal.company.name} &middot; 担当: {deal.ownerUser.name}
                    </p>
                </div>
                <Button asChild variant="outline" className="px-5">
                    <Link href="/sales/deals">一覧へ戻る</Link>
                </Button>
            </div>

            {updated ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    案件を更新しました。
                </div>
            ) : null}

            {staged ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    ステージを変更しました。
                </div>
            ) : null}

            {larkSaved ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    Lark連携設定を保存しました。
                </div>
            ) : null}

            {/* 2カラムレイアウト: メインコンテンツ + 活動ログサイドバー */}
            {approvalCreated ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    承認申請を登録しました。
                </div>
            ) : null}

            {hearingSaved ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    ヒアリング内容を更新しました。
                </div>
            ) : null}

            <div className="xl:grid xl:grid-cols-[1fr_300px] xl:items-start xl:gap-6">
                {/* 左カラム */}
                <div className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-gray-900">案件情報</CardTitle>
                                <CardDescription>案件の基本情報。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <InfoItem label="会社">
                                    <Link href={`/customers/companies/${deal.company.id}`} className="hover:underline text-gray-900">
                                        {deal.company.name}
                                    </Link>
                                </InfoItem>
                                <InfoItem label="担当者" value={deal.ownerUser.name} />
                                <InfoItem label="ステージ" value={STAGE_LABELS[deal.stage]} />
                                <InfoItem label="ステータス" value={deal.status === 'open' ? '進行中' : deal.status === 'won' ? '受注済' : '失注'} />
                                <InfoItem label="金額" value={deal.amount !== null ? `¥${deal.amount.toLocaleString()}` : '-'} />
                                <InfoItem label="クローズ予定" value={deal.expectedCloseDate ?? '-'} />
                                <InfoItem label="ソース" value={deal.source ?? '-'} />
                                <InfoItem label="獲得方法" value={deal.acquisitionMethod ?? '-'} />
                                <InfoItem label="次回アクション日" value={deal.nextActionDate ?? '-'} />
                                {deal.nextActionContent ? (
                                    <InfoItem label="次回アクション内容" value={deal.nextActionContent} className="sm:col-span-2" />
                                ) : null}
                                <InfoItem label="担当コンタクト" value={deal.primaryContact?.name ?? '-'} />
                                {deal.memo ? (
                                    <InfoItem label="メモ" value={deal.memo} className="sm:col-span-2" />
                                ) : null}
                                <InfoItem label="作成日時" value={new Date(deal.createdAt).toLocaleString('ja-JP')} />
                                <InfoItem label="更新日時" value={new Date(deal.updatedAt).toLocaleString('ja-JP')} />
                            </CardContent>
                        </Card>

                        {isOpen && otherStages.length > 0 ? (
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg text-gray-900">ステージ変更</CardTitle>
                                    <CardDescription>ステージを移動します。</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    {otherStages.map((stage) => (
                                        <form key={stage.key} action={changeDealStageAction}>
                                            <input type="hidden" name="dealId" value={deal.id} />
                                            <input type="hidden" name="toStage" value={stage.key} />
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                className={`w-full justify-between transition-colors ${STAGE_BUTTON_STYLES[stage.key]}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STAGE_DOT_COLORS[stage.key]}`} />
                                                    {STAGE_LABELS[stage.key]}
                                                </span>
                                                <span className="text-xs opacity-60">→</span>
                                            </Button>
                                        </form>
                                    ))}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>

                    <details className="group rounded-lg border border-gray-200 bg-white shadow-sm">
                        <summary className="flex cursor-pointer select-none list-none items-center justify-between px-6 py-4 [&::-webkit-details-marker]:hidden">
                            <div>
                                <p className="text-lg font-semibold text-gray-900">案件を編集</p>
                                <p className="mt-0.5 text-sm text-gray-500">クリックして基本情報を編集</p>
                            </div>
                            <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                        </summary>
                        <div className="border-t border-gray-100 px-6 pb-6 pt-5">
                            <form action={updateDealAction} className="grid gap-4 md:grid-cols-2">
                                <FormAutoClose />
                                <input type="hidden" name="dealId" value={deal.id} />

                                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    案件名
                                    <Input name="name" defaultValue={deal.name} />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    金額（円）
                                    <Input
                                        name="amount"
                                        type="number"
                                        min="0"
                                        defaultValue={deal.amount !== null ? String(deal.amount) : ''}
                                    />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    クローズ予定日
                                    <Input
                                        name="expectedCloseDate"
                                        type="date"
                                        defaultValue={deal.expectedCloseDate ?? ''}
                                    />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    ソース
                                    <Input name="source" defaultValue={deal.source ?? ''} />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    獲得方法
                                    <Input name="acquisitionMethod" defaultValue={deal.acquisitionMethod ?? ''} placeholder="インバウンド・展示会など" />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    次回アクション日
                                    <Input name="nextActionDate" type="date" defaultValue={deal.nextActionDate ?? ''} />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    次回アクション内容
                                    <Input name="nextActionContent" defaultValue={deal.nextActionContent ?? ''} placeholder="提案書を送付・訪問など" />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    メモ
                                    <textarea
                                        name="memo"
                                        rows={4}
                                        defaultValue={deal.memo ?? ''}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </label>

                                <div className="flex items-center justify-end md:col-span-2">
                                    <SubmitButton className="bg-blue-600 px-8 text-white hover:bg-blue-700">
                                        保存
                                    </SubmitButton>
                                </div>
                            </form>
                        </div>
                    </details>

                    {/* Lark連携設定 */}
                    <details className="group rounded-lg border border-gray-200 bg-white shadow-sm">
                        <summary className="flex cursor-pointer select-none list-none items-center justify-between px-6 py-4 [&::-webkit-details-marker]:hidden">
                            <div>
                                <p className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    Lark連携設定
                                    {deal.larkChatId ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                            接続済み
                                        </span>
                                    ) : null}
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">LarkグループチャットIDとカレンダーIDを設定</p>
                            </div>
                            <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                        </summary>
                        <div className="border-t border-gray-100 px-6 pb-6 pt-5">
                            <form action={saveLarkSettingsAction} className="grid gap-4 md:grid-cols-2">
                                <FormAutoClose />
                                <input type="hidden" name="dealId" value={deal.id} />
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    グループチャットID
                                    <Input
                                        name="larkChatId"
                                        defaultValue={deal.larkChatId ?? ''}
                                        placeholder="oc_xxxxxxxxxx"
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    カレンダーID
                                    <Input
                                        name="larkCalendarId"
                                        defaultValue={deal.larkCalendarId ?? ''}
                                        placeholder="primary またはカレンダーID"
                                    />
                                </label>
                                <div className="flex items-center justify-end md:col-span-2">
                                    <SubmitButton className="bg-blue-600 px-8 text-white hover:bg-blue-700">
                                        Lark設定を保存
                                    </SubmitButton>
                                </div>
                            </form>
                        </div>
                    </details>

                    <HearingPanel
                        dealId={deal.id}
                        record={hearingRecord}
                        completion={hearingCompletion}
                        canEdit={canEditHearing}
                    />

                    <DealApprovalPanel
                        dealId={deal.id}
                        approvals={approvalRequests}
                        approvalRoutes={approvalRoutes}
                        canCreate={canCreateApproval}
                        canRead={canReadApprovals}
                    />

                    <DealActivityLog dealId={deal.id} activities={activities} activityAdded={activityAdded} hideForm />

                    {/* Stage History */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-900">ステージ変更履歴</CardTitle>
                            <CardDescription>案件のステージ移動の記録</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stageHistory.length === 0 ? (
                                <div className="px-6 py-8 text-center text-sm text-gray-500">履歴がありません</div>
                            ) : (
                                <ol className="relative ml-6 border-l border-gray-200">
                                    {stageHistory.map((item, idx) => (
                                        <li key={item.id} className={`pb-5 pl-5 ${idx === 0 ? 'pt-4' : 'pt-0'}`}>
                                            <span className="absolute -left-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-400" />
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {item.fromStageName
                                                        ? <>{item.fromStageName} <span className="text-gray-400">→</span> {item.toStageName}</>
                                                        : <span>登録: {item.toStageName}</span>
                                                    }
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>{new Date(item.changedAt).toLocaleString('ja-JP')}</span>
                                                    {item.changedByName && <span>· {item.changedByName}</span>}
                                                    {item.snapshotAmount !== null && (
                                                        <span>· ¥{item.snapshotAmount.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                {item.changeNote && (
                                                    <p className="mt-1 text-xs text-gray-600">{item.changeNote}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 右カラム: 活動ログサイドバー（xl以上でスティッキー） */}
                <div className="mt-6 xl:mt-0 xl:sticky xl:top-6 xl:self-start">
                    <DealActivitySidebarForm dealId={deal.id} recentActivities={activities} activityAdded={activityAdded} />
                </div>
            </div>
        </div>
    );
}

interface InfoItemProps {
    label: string;
    value?: string;
    children?: ReactNode;
    className?: string;
}

function InfoItem({ label, value, children, className }: InfoItemProps) {
    return (
        <div className={className}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                {children ?? value}
            </p>
        </div>
    );
}
