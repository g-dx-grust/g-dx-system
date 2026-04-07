'use client';

import { useState } from 'react';
import type { DealActivityType } from '@g-dx/contracts';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { createDealActivityAction } from '@/modules/sales/deal/server-actions';
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
}

export function ActivityForm({ dealId, compact = false }: ActivityFormProps) {
    const [activityType, setActivityType] = useState<DealActivityType>('VISIT');
    const [isNegotiation, setIsNegotiation] = useState(false);
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
    const today = new Date().toISOString().split('T')[0];

    return (
        <form
            action={createDealActivityAction}
            className={
                compact
                    ? 'space-y-3'
                    : 'grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 md:grid-cols-4'
            }
        >
            <input type="hidden" name="dealId" value={dealId} />
            <label className={fieldLabelClassName}>
                種別
                <select
                    name="activityType"
                    required
                    defaultValue={activityType}
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
                    defaultValue={today}
                    className={inputClassName}
                />
            </label>
            <label className={fieldLabelClassName}>
                面会数
                <Input
                    name="meetingCount"
                    type="number"
                    min="1"
                    defaultValue="1"
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
            {showMeetingFields ? (
                <>
                    <label className={compact ? fieldLabelClassName : `${fieldLabelClassName} md:col-span-2`}>
                        新規/リピート
                        <select
                            name="visitCategory"
                            defaultValue="REPEAT"
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
                            defaultValue="CORPORATE"
                            className={selectClassName}
                        >
                            <option value="CORPORATE">{TARGET_TYPE_LABELS.CORPORATE}</option>
                            <option value="INDIVIDUAL">{TARGET_TYPE_LABELS.INDIVIDUAL}</option>
                        </select>
                    </label>
                </>
            ) : null}
            {isNegotiation ? (
                <>
                    <label
                        className={
                            compact
                                ? fieldLabelClassName
                                : `${fieldLabelClassName} md:col-span-2`
                        }
                    >
                        商談結果
                        <select
                            name="negotiationOutcome"
                            defaultValue="PENDING"
                            className={selectClassName}
                        >
                            <option value="PENDING">{NEGOTIATION_OUTCOME_LABELS.PENDING}</option>
                            <option value="POSITIVE">{NEGOTIATION_OUTCOME_LABELS.POSITIVE}</option>
                            <option value="NEUTRAL">{NEGOTIATION_OUTCOME_LABELS.NEUTRAL}</option>
                            <option value="NEGATIVE">{NEGOTIATION_OUTCOME_LABELS.NEGATIVE}</option>
                        </select>
                    </label>
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
                            placeholder="競合名・状況など"
                            className={inputClassName}
                        />
                    </label>
                </>
            ) : null}
            <label className={summaryLabelClassName}>
                内容
                <textarea
                    name="summary"
                    rows={textareaRows}
                    placeholder={compact ? '活動の概要...' : '活動の概要を記入...'}
                    className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </label>
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
            <div className={submitWrapperClassName}>
                <SubmitButton
                    size="sm"
                    pendingText="記録中..."
                    className={
                        compact
                            ? 'w-full bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 px-5 text-white hover:bg-blue-700'
                    }
                >
                    {compact ? '記録する' : '記録'}
                </SubmitButton>
            </div>
        </form>
    );
}
