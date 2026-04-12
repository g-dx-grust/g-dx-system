'use client';

import { useState, useEffect } from 'react';
import { PenLine, Pencil, X, ExternalLink } from 'lucide-react';
import type { AllianceActivityItem, AllianceActivityType } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { createAllianceActivityAction, updateAllianceActivityAction } from '@/modules/sales/alliance/server-actions';

const ACTIVITY_LABELS: Record<AllianceActivityType, string> = {
    VISIT: '訪問',
    ONLINE: 'オンライン',
    CALL: '電話',
    EMAIL: 'メール',
    OTHER: 'その他',
};

const ACTIVITY_TYPES: AllianceActivityType[] = ['VISIT', 'ONLINE', 'CALL', 'EMAIL', 'OTHER'];

const ACTIVITY_COLORS: Record<AllianceActivityType, string> = {
    VISIT: 'bg-gray-200 text-gray-700',
    ONLINE: 'bg-gray-300 text-gray-700',
    CALL: 'bg-gray-900 text-white',
    EMAIL: 'bg-gray-200 text-gray-600',
    OTHER: 'bg-gray-100 text-gray-600',
};

function isMeetingType(type: AllianceActivityType) {
    return type === 'VISIT' || type === 'ONLINE';
}

// ─── Activity Form ─────────────────────────────────────────────────────────────

interface AllianceActivityFormProps {
    allianceId: string;
    editActivity?: AllianceActivityItem | null;
    onClose?: () => void;
}

function AllianceActivityForm({ allianceId, editActivity, onClose }: AllianceActivityFormProps) {
    const isEdit = !!editActivity;
    const [activityType, setActivityType] = useState<AllianceActivityType>(editActivity?.activityType ?? 'VISIT');
    const showMeetingFields = isMeetingType(activityType);
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

    const selectCls =
        'h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
    const labelCls = 'grid gap-1 text-xs text-gray-600';
    const inputCls = 'h-9 text-sm';

    const action = isEdit ? updateAllianceActivityAction : createAllianceActivityAction;

    return (
        <form action={action} className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 md:grid-cols-4">
            <input type="hidden" name="allianceId" value={allianceId} />
            {isEdit && <input type="hidden" name="activityId" value={editActivity!.id} />}

            <label className={labelCls}>
                種別
                <select
                    name="activityType"
                    required
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as AllianceActivityType)}
                    className={selectCls}
                >
                    {ACTIVITY_TYPES.map((t) => (
                        <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
                    ))}
                </select>
            </label>

            <label className={labelCls}>
                日付
                <Input name="activityDate" type="date" required defaultValue={editActivity?.activityDate ?? today} className={inputCls} />
            </label>

            {showMeetingFields ? (
                <label className={`${labelCls} md:col-span-4`}>
                    Lark議事録リンク
                    <Input
                        name="larkMeetingUrl"
                        type="url"
                        defaultValue={editActivity?.larkMeetingUrl ?? ''}
                        placeholder="https://..."
                        className={inputCls}
                    />
                </label>
            ) : null}

            <label className={`${labelCls} md:col-span-4`}>
                内容
                <textarea
                    name="summary"
                    rows={2}
                    defaultValue={editActivity?.summary ?? ''}
                    placeholder="面談の概要を記入..."
                    className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </label>

            {!isEdit && (
                <>
                    <label className={labelCls}>
                        次回アクション日
                        <Input name="nextActionDate" type="date" className={inputCls} />
                    </label>
                    <label className={`${labelCls} md:col-span-3`}>
                        次回アクション内容
                        <Input name="nextActionContent" placeholder="次回の行動..." className={inputCls} />
                    </label>
                </>
            )}

            <div className={isEdit ? 'flex gap-2 justify-end md:col-span-4' : 'flex items-end md:col-span-4'}>
                {isEdit && onClose && (
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
    allianceId: string;
    activity: AllianceActivityItem;
    activityUpdated?: boolean;
    onClose: () => void;
}

function EditModal({ allianceId, activity, activityUpdated, onClose }: EditModalProps) {
    useEffect(() => {
        if (activityUpdated) onClose();
    }, [activityUpdated, onClose]);

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
                    <h2 className="text-sm font-semibold text-gray-900">活動を編集</h2>
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
                    <AllianceActivityForm allianceId={allianceId} editActivity={activity} onClose={onClose} />
                </div>
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface AllianceActivityLogProps {
    allianceId: string;
    activities: AllianceActivityItem[];
    activityAdded?: boolean;
    activityUpdated?: boolean;
}

export function AllianceActivityLog({
    allianceId,
    activities,
    activityAdded = false,
    activityUpdated = false,
}: AllianceActivityLogProps) {
    const [showForm, setShowForm] = useState(false);
    const [editActivity, setEditActivity] = useState<AllianceActivityItem | null>(null);

    useEffect(() => {
        if (activityAdded) setShowForm(false);
        if (activityUpdated) setEditActivity(null);
    }, [activityAdded, activityUpdated]);

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base text-gray-900">活動ログ</CardTitle>
                    <CardDescription>アライアンス先との面談・連絡記録</CardDescription>
                </div>
                <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    <PenLine className="mr-1.5 h-4 w-4" />
                    活動を記録
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {(activityAdded || activityUpdated) && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {activityAdded ? '活動を記録しました。' : '活動を更新しました。'}
                    </div>
                )}

                {showForm && (
                    <AllianceActivityForm allianceId={allianceId} onClose={() => setShowForm(false)} />
                )}

                {activities.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">活動記録がありません</p>
                ) : (
                    <div className="space-y-2">
                        {activities.map((a) => (
                            <div key={a.id} className="rounded-md border border-gray-100 px-3 py-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_COLORS[a.activityType]}`}>
                                            {ACTIVITY_LABELS[a.activityType]}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                            <span>{a.activityDate}</span>
                                            <span>{a.userName}</span>
                                        </div>
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
                                {a.summary && (
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{a.summary}</p>
                                )}
                                {a.larkMeetingUrl ? (
                                    <p className="mt-1 text-xs">
                                        <a
                                            href={a.larkMeetingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 underline hover:text-blue-800"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Lark議事録
                                        </a>
                                    </p>
                                ) : null}
                                {a.nextActionContent ? (
                                    <p className="mt-1 text-xs text-gray-500">
                                        次回: {a.nextActionDate ? `${a.nextActionDate} ` : ''}{a.nextActionContent}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Edit modal */}
            {editActivity && (
                <EditModal
                    allianceId={allianceId}
                    activity={editActivity}
                    activityUpdated={activityUpdated}
                    onClose={() => setEditActivity(null)}
                />
            )}
        </Card>
    );
}
