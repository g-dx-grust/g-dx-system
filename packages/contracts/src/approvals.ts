import type { UUID, ISODateString, ISODateOnlyString, PaginationMeta, ApiSuccessResponse } from './common';

// ─── 承認種別 ────────────────────────────────────────────────────────────
export const ApprovalType = {
    PRE_MEETING: 'PRE_MEETING',                       // 事前準備承認
    ESTIMATE_PRESENTATION: 'ESTIMATE_PRESENTATION',   // 見積提示承認
    TECH_REVIEW: 'TECH_REVIEW',                       // 技術部門承認
} as const;

export type ApprovalTypeValue = typeof ApprovalType[keyof typeof ApprovalType];

// ─── 承認ステータス ──────────────────────────────────────────────────────
export const ApprovalStatus = {
    PENDING: 'PENDING',       // 申請中
    APPROVED: 'APPROVED',     // 承認済み
    REJECTED: 'REJECTED',     // 却下
    RETURNED: 'RETURNED',     // 差戻し
    EXPIRED: 'EXPIRED',       // 失効
} as const;

export type ApprovalStatusValue = typeof ApprovalStatus[keyof typeof ApprovalStatus];

// ─── 見積提示承認チェック項目コード ───────────────────────────────────────
export const EstimateCheckItemCode = {
    VALUE_SEPARATION: 'VALUE_SEPARATION',         // 研修と構築・開発の価値分離
    OPTION_SCOPE: 'OPTION_SCOPE',                 // オプション開発スコープ明文化
    COST_CASHFLOW: 'COST_CASHFLOW',               // 実質負担額とキャッシュフロー提示
    MAINTENANCE_AGREEMENT: 'MAINTENANCE_AGREEMENT', // 導入後保守サービスの合意
} as const;

export type EstimateCheckItemCodeValue = typeof EstimateCheckItemCode[keyof typeof EstimateCheckItemCode];

export const ESTIMATE_CHECK_ITEM_LABELS: Record<EstimateCheckItemCodeValue, string> = {
    VALUE_SEPARATION: '研修と構築・開発の価値分離',
    OPTION_SCOPE: 'オプション開発スコープ明文化',
    COST_CASHFLOW: '実質負担額とキャッシュフロー提示',
    MAINTENANCE_AGREEMENT: '導入後保守サービスの合意',
};

// ─── 承認申請 ────────────────────────────────────────────────────────────
export interface ApprovalRequestListItem {
    id: UUID;
    dealId: UUID;
    dealTitle: string;
    companyName: string;
    approvalType: ApprovalTypeValue;
    approvalStatus: ApprovalStatusValue;
    applicantName: string;
    applicantUserId: UUID;
    approverName: string | null;
    approverUserId: UUID | null;
    appliedAt: ISODateString;
    decidedAt: ISODateString | null;
    deadlineAt: ISODateString | null;
    meetingDate: ISODateString | null;
    documentUrl: string | null;
}

export interface ApprovalRequestDetail extends ApprovalRequestListItem {
    decisionComment: string | null;
    expiryReason: string | null;
    snapshotData: Record<string, unknown> | null;
    checkItems: ApprovalCheckItem[];
    createdAt: ISODateString;
    updatedAt: ISODateString;
}

export interface ApprovalCheckItem {
    id: UUID;
    itemCode: string;
    inputValue: string | null;
    checkResult: boolean | null;
    comment: string | null;
    evidenceFileUrl: string | null;
    customerReaction: string | null;
}

export interface CreateApprovalRequest {
    dealId: UUID;
    approvalType: ApprovalTypeValue;
    approverUserId?: UUID;
    meetingDate?: ISODateString;
    documentUrl?: string;
    checkItems?: CreateApprovalCheckItem[];
    snapshotData?: Record<string, unknown>;
}

export interface CreateApprovalCheckItem {
    itemCode: string;
    inputValue?: string;
    checkResult?: boolean;
    comment?: string;
    evidenceFileUrl?: string;
    customerReaction?: string;
}

export interface DecideApprovalRequest {
    decision: 'APPROVED' | 'REJECTED' | 'RETURNED';
    comment?: string;
}

export interface ApprovalRouteItem {
    id: UUID;
    approvalType: ApprovalTypeValue;
    routeName: string;
    approverUserId: UUID;
    approverName: string;
    routeOrder: number;
    allowSelfApproval: boolean;
    isActive: boolean;
}

export type ApprovalRequestListResponse = ApiSuccessResponse<ApprovalRequestListItem[], PaginationMeta>;
export type ApprovalRequestDetailResponse = ApiSuccessResponse<ApprovalRequestDetail>;
export type ApprovalRouteListResponse = ApiSuccessResponse<ApprovalRouteItem[]>;
