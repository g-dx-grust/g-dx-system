'use client';

import { useState } from 'react';
import type { BusinessScopeType, DealActivityItem, DealActivityType } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { createDealActivityAction, updateDealActivityAction } from '@/modules/sales/deal/server-actions';
import {
    ACTIVITY_LABELS,
    ACTIVITY_TYPES,
    NEGOTIATION_OUTCOME_LABELS,
    TARGET_TYPE_LABELS,
    VISIT_CATEGORY_FORM_LABELS,
    isMeetingActivityType,
} from './deal-activity-shared';

interface ActivityFormProps {
    dealId: string;
    compact?: boolean;
    editActivity?: DealActivityItem | null;
    onClose?: () => void;
    businessScope?: BusinessScopeType;
}

export function ActivityForm({ dealId, compact = false, editActivity, onClose, businessScope }: ActivityFormProps) {
    const isEdit = !!editActivity;
    const isJet = businessScope === 'WATER_SAVING';
    const [activityType, setActivityType] = useState<DealActivityType>(editActivity?.activityType ?? 'VISIT');
    const [isNegotiation, setIsNegotiation] = useState(editActivity?.isNegotiation ?? false);
    const [isKmContact, setIsKmContact] = useState(editActivity?.isKmContact ?? false);
    const showMeetingFields = isMeetingActivityType(activityType);
    const fieldLabelClassName = compact
        ? 'grid gap-1 text-xs font-medium text-gray-600'
        : 'grid gap-1 text-xs text-gray-600';
    const selectClassName = compact
        ? 'h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        : 'h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
    const inputClassName = compact ? 'h-8 text-sm' : 'h-9 text-sm';
    const textareaRows = compact ? 3 : 2;
    const summaryLabelClassName = compact
        ? 'grid gap-1 text-xs font-medium text-gray-600'
        : 'grid gap-1 text-xs text-gray-600 md:col-span-4';
    const submitWrapperClassName = compact ? '' : 'flex items-end md:col-span-4';
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

    return (
        <form
            action={isEdit ? updateDealActivityAction : createDealActivityAction}
            className={
                compact
                    ? 'space-y-3'
                    : 'grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 md:grid-cols-4'
            }
        >
            <input type="hidden" name="dealId" value={dealId} />
            {isEdit && <input type="hidden" name="activityId" value={editActivity!.id} />}
            {/* 面会数: VISIT/ONLINE 以外は 0 を hidden で送信 */}
            {showMeetingFields ? null : (
                <input type="hidden" name="meetingCount" value="0" />
            )}
            <label className={fieldLabelClassName}>
                種別
                <select
                    name="activityType"
                    required
                    value={activityType}
                    onChange={(event) =>
                        setActivityType(event.target.value as DealActivityType)
                    }
                    className={selectClassName}
                >
                    {ACTIVITY_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {ACTIVITY_LABELS[type]}
                        </option>
                    ))}
                </select>
            </label>
            <label className={fieldLabelClassName}>
                日付
                <Input
                    name="activityDate"
                    type="date"
                    required
                    defaultValue={editActivity?.activityDate ?? today}
                    className={inputClassName}
                />
            </label>
            {showMeetingFields ? (
                <>
                    <label className={fieldLabelClassName}>
                        面会数
                        <Input
                            name="meetingCount"
                            type="number"
                            min="1"
                            defaultValue={editActivity?.meetingCount ?? 1}
                            className={inputClassName}
                        />
                    </label>
                    <label
                        className={
                            compact
                                ? 'flex items-center gap-2 text-xs font-medium text-gray-600'
                                : 'flex items-center gap-2 text-xs text-gray-600 md:col-span-4'
                        }
                    >
                        <input
                            type="checkbox"
                            name="isNegotiation"
                            checked={isNegotiation}
                            onChange={(event) => setIsNegotiation(event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        商談として記録
                    </label>
                    <label className={compact ? fieldLabelClassName : `${fieldLabelClassName} md:col-span-2`}>
                        新規/リピート
                        <select
                            name="visitCategory"
                            defaultValue={editActivity?.visitCategory ?? 'REPEAT'}
                            className={selectClassName}
                        >
                            <option value="REPEAT">{VISIT_CATEGORY_FORM_LABELS.REPEAT}</option>
                            <option value="NEW">{VISIT_CATEGORY_FORM_LABELS.NEW}</option>
                        </select>
                    </label>
                    <label className={compact ? fieldLabelClassName : `${fieldLabelClassName} md:col-span-2`}>
                        個人/法人
                        <select
                            name="targetType"
                            defaultValue={editActivity?.targetType ?? 'CORPORATE'}
                            className={selectClassName}
                        >
                            <option value="CORPORATE">{TARGET_TYPE_LABELS.CORPORATE}</option>
                            <option value="INDIVIDUAL">{TARGET_TYPE_LABELS.INDIVIDUAL}</option>
                        </select>
                    </label>
                    {isNegotiation ? (
                        <label
                            className={
                                compact
                                    ? fieldLabelClassName
                                    : `${fieldLabelClassName} md:col-span-2`
                            }
                        >
                            確度
                            <select
                                name="negotiationOutcome"
                                defaultValue={editActivity?.negotiationOutcome ?? 'MEDIUM'}
                                className={selectClassName}
                            >
                                <option value="HIGH">{NEGOTIATION_OUTCOME_LABELS.HIGH}</option>
                                <option value="MEDIUM">{NEGOTIATION_OUTCOME_LABELS.MEDIUM}</option>
                                <option value="LOW">{NEGOTIATION_OUTCOME_LABELS.LOW}</option>
                                <option value="NONE">{NEGOTIATION_OUTCOME_LABELS.NONE}</option>
                            </select>
                        </label>
                    ) : null}
                    {isNegotiation ? (
                        <label
                            className={
                                compact
                                    ? fieldLabelClassName
                                    : `${fieldLabelClassName} md:col-span-2`
                            }
                        >
                            競合情報
                            <Input
                                name="competitorInfo"
                                defaultValue={editActivity?.competitorInfo ?? ''}
                                placeholder="競合名・状況など"
                                className={inputClassName}
                            />
                        </label>
                    ) : null}
                    <label className={compact ? fieldLabelClassName : `${fieldLabelClassName} md:col-span-4`}>
                        Lark議事録リンク
                        <Input
                            name="larkMeetingUrl"
                            type="url"
                            defaultValue={editActivity?.larkMeetingUrl ?? ''}
                            placeholder="https://..."
                            className={inputClassName}
                        />
                    </label>
                </>
            ) : (
                <label
                    className={
                        compact
                            ? 'flex items-center gap-2 text-xs font-medium text-gray-600'
                            : 'flex items-center gap-2 text-xs text-gray-600 md:col-span-2'
                    }
                >
                    <input
                        type="checkbox"
                        name="isNegotiation"
                        checked={isNegotiation}
                        onChange={(event) => setIsNegotiation(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    商談として記録
                </label>
            )}
            {isJet ? (
                <label
                    className={
                        compact
                            ? 'flex items-center gap-2 text-xs font-medium text-gray-600'
                            : 'flex items-center gap-2 text-xs text-gray-600 md:col-span-4'
                    }
                >
                    <input
                        type="checkbox"
                        name="isKmContact"
                        checked={isKmContact}
                        onChange={(event) => setIsKmContact(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    キーマン（KM）接触として記録
                </label>
            ) : null}
            <label className={summaryLabelClassName}>
                内容
                <textarea
                    name="summary"
                    rows={textareaRows}
                    defaultValue={editActivity?.summary ?? ''}
                    placeholder={compact ? '活動の概要...' : '活動の概要を記入...'}
                    className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </label>
            {!isEdit && (
                <>
                    <label className={fieldLabelClassName}>
                        次回アクション日
                        <Input
                            name="nextActionDate"
                            type="date"
                            className={inputClassName}
                        />
                    </label>
                    <label className={compact ? fieldLabelClassName : `${fieldLabelClassName} md:col-span-3`}>
                        次回アクション内容
                        <Input
                            name="nextActionContent"
                            placeholder={compact ? '次回の行動...' : '提案書を送付・訪問など'}
                            className={inputClassName}
                        />
                    </label>
                </>
            )}
            <div className={isEdit ? 'flex gap-2 justify-end md:col-span-4' : submitWrapperClassName}>
                {isEdit && onClose && (
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                        キャンセル
                    </Button>
                )}
                <SubmitButton
                    size="sm"
                    pendingText={isEdit ? '更新中...' : '記録中...'}
                    className={
                        compact
                            ? 'w-full bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 px-5 text-white hover:bg-blue-700'
                    }
                >
                    {isEdit ? '更新' : compact ? '記録する' : '記録'}
                </SubmitButton>
            </div>
        </form>
    );
}
