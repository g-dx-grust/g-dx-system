import type { ApprovalStatusValue, ApprovalTypeValue } from '@g-dx/contracts';
import type { BadgeProps } from '@/components/ui/badge';

export const APPROVAL_TYPE_LABELS: Record<ApprovalTypeValue, string> = {
    PRE_MEETING: '事前準備承認',
    ESTIMATE_PRESENTATION: '見積提示承認',
    TECH_REVIEW: '技術確認',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatusValue, string> = {
    PENDING: '申請中',
    APPROVED: '承認済み',
    REJECTED: '却下',
    RETURNED: '差し戻し',
    EXPIRED: '失効',
};

export const APPROVAL_STATUS_BADGE_VARIANTS: Record<ApprovalStatusValue, BadgeProps['variant']> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'destructive',
    RETURNED: 'outline',
    EXPIRED: 'outline',
};

export const APPROVAL_TYPE_OPTIONS: ApprovalTypeValue[] = [
    'PRE_MEETING',
    'ESTIMATE_PRESENTATION',
    'TECH_REVIEW',
];

export const APPROVAL_STATUS_OPTIONS: ApprovalStatusValue[] = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'RETURNED',
    'EXPIRED',
];

export function formatApprovalDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatApprovalDate(value: string | null | undefined): string {
    if (!value) return '-';
    // timestamp 形式も date-only 形式も両方対応
    const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatSnapshotValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value, null, 2);
}
