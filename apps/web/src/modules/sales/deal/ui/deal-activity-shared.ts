import type {
    DealActivityType,
    MeetingTargetType,
    NegotiationOutcome,
    VisitCategory,
} from '@g-dx/contracts';

export const ACTIVITY_LABELS: Record<DealActivityType, string> = {
    VISIT: '訪問',
    ONLINE: 'オンライン',
    CALL: '電話',
    EMAIL: 'メール',
    OTHER: 'その他',
};

export const ACTIVITY_COLORS: Record<DealActivityType, string> = {
    VISIT: 'bg-gray-200 text-gray-700',
    ONLINE: 'bg-gray-300 text-gray-700',
    CALL: 'bg-gray-900 text-white',
    EMAIL: 'bg-gray-200 text-gray-600',
    OTHER: 'bg-gray-100 text-gray-600',
};

export const ACTIVITY_TYPES: DealActivityType[] = ['VISIT', 'ONLINE', 'CALL', 'EMAIL', 'OTHER'];

export const VISIT_CATEGORY_LABELS: Record<VisitCategory, string> = {
    NEW: '新規',
    REPEAT: 'リピート',
};

export const VISIT_CATEGORY_FORM_LABELS: Record<VisitCategory, string> = {
    NEW: '新規面会',
    REPEAT: 'リピート面会',
};

export const VISIT_CATEGORY_BADGE_COLORS: Record<VisitCategory, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    REPEAT: 'bg-gray-100 text-gray-600',
};

export const TARGET_TYPE_LABELS: Record<MeetingTargetType, string> = {
    INDIVIDUAL: '個人',
    CORPORATE: '法人',
};

export const NEGOTIATION_OUTCOME_LABELS: Record<NegotiationOutcome, string> = {
    POSITIVE: '前向き',
    NEUTRAL: '中立',
    NEGATIVE: '後ろ向き',
    PENDING: '保留',
};

export const NEGOTIATION_OUTCOME_BADGE_COLORS: Record<NegotiationOutcome, string> = {
    POSITIVE: 'bg-emerald-100 text-emerald-700',
    NEUTRAL: 'bg-slate-100 text-slate-600',
    NEGATIVE: 'bg-rose-100 text-rose-700',
    PENDING: 'bg-amber-100 text-amber-700',
};

export function isMeetingActivityType(activityType: DealActivityType): boolean {
    return activityType === 'VISIT' || activityType === 'ONLINE';
}
