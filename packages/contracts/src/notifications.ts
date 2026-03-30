import type { UUID, ISODateString, PaginationMeta, ApiSuccessResponse } from './common';

// ─── 通知種別 ────────────────────────────────────────────────────────────
export const NotificationType = {
    APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
    APPROVAL_APPROVED: 'APPROVAL_APPROVED',
    APPROVAL_REJECTED: 'APPROVAL_REJECTED',
    APPROVAL_RETURNED: 'APPROVAL_RETURNED',
    APPROVAL_DEADLINE: 'APPROVAL_DEADLINE',
    KPI_SUBMITTED: 'KPI_SUBMITTED',
    CRM_SYNC_FAILED: 'CRM_SYNC_FAILED',
    AI_GENERATION_COMPLETE: 'AI_GENERATION_COMPLETE',
    AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

// ─── 通知 ────────────────────────────────────────────────────────────────
export interface NotificationItem {
    id: UUID;
    notificationType: NotificationTypeValue;
    title: string;
    body: string | null;
    relatedEntityType: string | null;
    relatedEntityId: UUID | null;
    linkUrl: string | null;
    isRead: boolean;
    readAt: ISODateString | null;
    createdAt: ISODateString;
}

export interface NotificationUnreadCount {
    count: number;
}

export type NotificationListResponse = ApiSuccessResponse<NotificationItem[], PaginationMeta>;
export type NotificationUnreadCountResponse = ApiSuccessResponse<NotificationUnreadCount>;
