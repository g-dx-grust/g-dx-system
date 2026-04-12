'use client';

import { useState, useEffect } from 'react';
import { PenLine, X, Pencil, ExternalLink } from 'lucide-react';
import type {
    ContractActivityInitiatedBy,
    ContractActivityItem,
    ContractActivityType,
    ContractNextSessionType,
    ContractProgressStatus,
} from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import {
    createContractActivityAction,
    updateContractActivityAction,
} from '@/modules/sales/contract/server-actions';

// ─── Label maps ───────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<ContractActivityType, string> = {
    REGULAR: '定例',
    SPOT: '急遽',
    CALL: '電話',
    EMAIL: 'メール',
    INTERNAL: '社内',
    OTHER: 'その他',
};

const ACTIVITY_COLORS: Record<ContractActivityType, string> = {
    REGULAR: 'bg-blue-100 text-blue-700',
    SPOT: 'bg-amber-100 text-amber-700',
    CALL: 'bg-gray-900 text-white',
    EMAIL: 'bg-gray-200 text-gray-600',
    INTERNAL: 'bg-purple-100 text-purple-700',
    OTHER: 'bg-gray-100 text-gray-600',
};

const ACTIVITY_TYPES: ContractActivityType[] = ['REGULAR', 'SPOT', 'CALL', 'EMAIL', 'INTERNAL', 'OTHER'];

const INITIATED_BY_LABELS: Record<ContractActivityInitiatedBy, string> = {
    CLIENT: '顧客から',
    US: '弊社から',
};

const PROGRESS_STATUS_LABELS: Record<ContractProgressStatus, string> = {
    HEARING: 'ヒアリング',
    ENV_SETUP: '環境設定',
    FIRST_DELIVERY: '一次納品',
    SECOND_DELIVERY: '二次納品',
    FINAL_DELIVERY: '本納品',
    STABLE: '安定稼働',
    RENEWAL: '更新検討',
    OTHER: 'その他',
};

const PROGRESS_STATUS_OPTIONS: ContractProgressStatus[] = [
    'HEARING', 'ENV_SETUP', 'FIRST_DELIVERY', 'SECOND_DELIVERY', 'FINAL_DELIVERY', 'STABLE', 'RENEWAL', 'OTHER',
];

const NEXT_SESSION_TYPE_LABELS: Record<ContractNextSessionType, string> = {
    REGULAR: '定例',
    SPOT: 'スポット',
};

// ─── Activity Form ─────────────────────────────────────────────────────────────

interface ActivityFormProps {
    contractId: string;
    editActivity?: ContractActivityItem | null;
    onClose?: () => void;
}

function ContractActivityForm({ contractId, editActivity, onClose }: ActivityFormProps) {
    const isEdit = !!editActivity;
    const [activityType, setActivityType] = useState<ContractActivityType>(
        editActivity?.activityType ?? 'REGULAR',
    );

    const isMeetingType = activityType === 'REGULAR' || activityType === 'SPOT';
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

    const action = isEdit ? updateContractActivityAction : createContractActivityAction;

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="contractId" value={contractId} />
            {isEdit && <input type="hidden" name="activityId" value={editActivity!.id} />}

            {/* Row 1: 種別 + 発生元 */}
            <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs text-gray-600">
                    種別 <span className="text-red-500">*</span>
                    <select
                        name="activityType"
                        required
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value as ContractActivityType)}
                        className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {ACTIVITY_TYPES.map((t) => (
                            <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
                        ))}
                    </select>
                </label>

                <label className="grid gap-1 text-xs text-gray-600">
                    発生元
                    <select
                        name="initiatedBy"
                        defaultValue={editActivity?.initiatedBy ?? ''}
                        className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">未選択</option>
                        {(Object.keys(INITIATED_BY_LABELS) as ContractActivityInitiatedBy[]).map((k) => (
                            <option key={k} value={k}>{INITIATED_BY_LABELS[k]}</option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Row 2: 日付 + 何回目 */}
            <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs text-gray-600">
                    実施日 <span className="text-red-500">*</span>
                    <Input
                        name="activityDate"
                        type="date"
                        required
                        defaultValue={editActivity?.activityDate ?? today}
                        className="h-9 text-sm"
                    />
                </label>

                <label className="grid gap-1 text-xs text-gray-600">
                    何回目の実施
                    <Input
                        name="sessionNumber"
                        type="number"
                        min={1}
                        defaultValue={editActivity?.sessionNumber ?? ''}
                        placeholder="例: 3"
                        className="h-9 text-sm"
                    />
                </label>
            </div>

            {/* 進捗状況 */}
            <label className="grid gap-1 text-xs text-gray-600">
                進捗状況
                <select
                    name="progressStatus"
                    defaultValue={editActivity?.progressStatus ?? ''}
                    className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">未選択</option>
                    {PROGRESS_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{PROGRESS_STATUS_LABELS[s]}</option>
                    ))}
                </select>
            </label>

            {/* 実施内容 */}
            <label className="grid gap-1 text-xs text-gray-600">
                実施内容
                <textarea
                    name="summary"
                    rows={3}
                    defaultValue={editActivity?.summary ?? ''}
                    placeholder="実施した内容を記入..."
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
            </label>

            {/* Lark議事録リンク */}
            <label className="grid gap-1 text-xs text-gray-600">
                Lark議事録リンク
                <Input
                    name="larkMeetingUrl"
                    type="url"
                    defaultValue={editActivity?.larkMeetingUrl ?? ''}
                    placeholder="https://..."
                    className="h-9 text-sm"
                />
            </label>

            {/* 次回セッション種別 (meeting types only) */}
            {isMeetingType && (
                <label className="grid gap-1 text-xs text-gray-600">
                    次回開始種別
                    <select
                        name="nextSessionType"
                        defaultValue={editActivity?.nextSessionType ?? ''}
                        className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">未定</option>
                        {(Object.keys(NEXT_SESSION_TYPE_LABELS) as ContractNextSessionType[]).map((k) => (
                            <option key={k} value={k}>{NEXT_SESSION_TYPE_LABELS[k]}</option>
                        ))}
                    </select>
                </label>
            )}

            <div className="flex justify-end gap-2 pt-1">
                {onClose && (
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                        キャンセル
                    </Button>
                )}
                <SubmitButton
                    size="sm"
                    pendingText={isEdit ? '更新中...' : '記録中...'}
                    className="bg-blue-600 px-5 text-white hover:bg-blue-700"
                >
                    {isEdit ? '更新' : '記録'}
                </SubmitButton>
            </div>
        </form>
    );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

interface ActivityModalProps {
    contractId: string;
    activityAdded?: boolean;
    activityUpdated?: boolean;
    editActivity?: ContractActivityItem | null;
    onClose: () => void;
    title: string;
}

function ActivityModal({ contractId, activityAdded, activityUpdated, editActivity, onClose, title }: ActivityModalProps) {
    useEffect(() => {
        if (activityAdded || activityUpdated) {
            onClose();
        }
    }, [activityAdded, activityUpdated, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/40" />
            <div
                className="relative z-10 w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
                style={{ maxHeight: '90dvh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-4">
                    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                        aria-label="閉じる"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-4">
                    <ContractActivityForm
                        contractId={contractId}
                        editActivity={editActivity}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ContractActivityLogProps {
    contractId: string;
    activities: ContractActivityItem[];
    activityAdded?: boolean;
    activityUpdated?: boolean;
}

export function ContractActivityLog({
    contractId,
    activities,
    activityAdded = false,
    activityUpdated = false,
}: ContractActivityLogProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editActivity, setEditActivity] = useState<ContractActivityItem | null>(null);

    useEffect(() => {
        if (activityAdded) setCreateOpen(false);
        if (activityUpdated) setEditActivity(null);
    }, [activityAdded, activityUpdated]);

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base text-gray-900">活動ログ</CardTitle>
                    <CardDescription>定例・急遽・電話などの活動記録</CardDescription>
                </div>
                <Button
                    type="button"
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    <PenLine className="mr-1.5 h-4 w-4" />
                    活動を記録
                </Button>
            </CardHeader>

            <CardContent className="space-y-2">
                {(activityAdded || activityUpdated) && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {activityAdded ? '活動を記録しました。' : '活動を更新しました。'}
                    </div>
                )}

                {activities.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">活動記録がありません</p>
                ) : (
                    <div className="space-y-2">
                        {activities.map((a) => (
                            <div key={a.id} className="rounded-md border border-gray-100 px-3 py-2.5 space-y-1">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_COLORS[a.activityType]}`}>
                                            {ACTIVITY_LABELS[a.activityType]}
                                        </span>
                                        {a.initiatedBy && (
                                            <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                                                {INITIATED_BY_LABELS[a.initiatedBy]}
                                            </span>
                                        )}
                                        {a.progressStatus && (
                                            <span className="text-xs text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5">
                                                {PROGRESS_STATUS_LABELS[a.progressStatus]}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditActivity(a)}
                                        className="shrink-0 flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                        aria-label="編集"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {/* Meta row */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                    <span>{a.activityDate}</span>
                                    <span>{a.userName}</span>
                                    {a.sessionNumber != null && (
                                        <span className="font-medium text-gray-600">第{a.sessionNumber}回</span>
                                    )}
                                </div>

                                {/* Content */}
                                {a.summary && (
                                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">{a.summary}</p>
                                )}

                                {/* Links */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    {a.larkMeetingUrl && (
                                        <a
                                            href={a.larkMeetingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Lark議事録
                                        </a>
                                    )}
                                    {a.nextSessionType && (
                                        <span className="text-xs text-gray-500">
                                            次回: {NEXT_SESSION_TYPE_LABELS[a.nextSessionType]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Create modal */}
            {createOpen && (
                <ActivityModal
                    contractId={contractId}
                    activityAdded={activityAdded}
                    onClose={() => setCreateOpen(false)}
                    title="活動を記録"
                />
            )}

            {/* Edit modal */}
            {editActivity && (
                <ActivityModal
                    contractId={contractId}
                    activityUpdated={activityUpdated}
                    editActivity={editActivity}
                    onClose={() => setEditActivity(null)}
                    title="活動を編集"
                />
            )}
        </Card>
    );
}
