import type { UUID, ISODateString, ISODateOnlyString, BusinessScopedEntitySummary, ApiSuccessResponse } from './common';

// ─── ヒアリング項目キー ─────────────────────────────────────────────────
export const HearingItemKey = {
    GAP: 'GAP',                   // 現状と理想のギャップ
    TARGET: 'TARGET',             // 導入対象者とID数
    SCOPE: 'SCOPE',               // 標準/オプション境界
    SUBSIDY: 'SUBSIDY',           // 助成金・補助金適格性
    DECISION: 'DECISION',         // 決裁フローとタイムライン
} as const;

export type HearingItemKeyType = typeof HearingItemKey[keyof typeof HearingItemKey];

export const REQUIRED_HEARING_ITEMS: HearingItemKeyType[] = [
    HearingItemKey.GAP,
    HearingItemKey.TARGET,
    HearingItemKey.SCOPE,
    HearingItemKey.SUBSIDY,
    HearingItemKey.DECISION,
];

// ─── ヒアリングレコード ────────────────────────────────────────────────
export interface HearingRecord {
    id: UUID;
    dealId: UUID;

    // 1. 現状と理想のギャップ
    gapCurrentSituation: string | null;
    gapIdealState: string | null;
    gapEffectGoal: string | null;
    gapAgreementMemo: string | null;
    gapCompleted: boolean;

    // 2. 導入対象者とID数
    targetUserSegments: string | null;
    targetIdEstimate: number | null;
    targetPlanCandidate: string | null;
    targetCompleted: boolean;

    // 3. 標準/オプション境界
    scopeIsStandard: boolean | null;
    scopeOptionRequirements: string | null;
    scopeTechLiaisonFlag: boolean;
    scopeCompleted: boolean;

    // 4. 助成金・補助金適格性
    subsidyInsuranceStatus: string | null;
    subsidyCompanyCategory: string | null;
    subsidyApplicableProgram: string | null;
    subsidyLaborConsultantOk: boolean | null;
    subsidyCompleted: boolean;

    // 5. 決裁フローとタイムライン
    decisionApproverInfo: string | null;
    decisionTimeline: ISODateOnlyString | null;
    decisionNextMeetingAttendee: string | null;
    decisionCriteria: string | null;
    decisionNextPlan: string | null;
    decisionCompleted: boolean;

    createdAt: ISODateString;
    updatedAt: ISODateString;
}

export interface HearingCompletionStatus {
    gapCompleted: boolean;
    targetCompleted: boolean;
    scopeCompleted: boolean;
    subsidyCompleted: boolean;
    decisionCompleted: boolean;
    allCompleted: boolean;
    completedCount: number;
    totalCount: number;
}

export interface UpdateHearingRequest {
    gapCurrentSituation?: string | null;
    gapIdealState?: string | null;
    gapEffectGoal?: string | null;
    gapAgreementMemo?: string | null;
    gapCompleted?: boolean;

    targetUserSegments?: string | null;
    targetIdEstimate?: number | null;
    targetPlanCandidate?: string | null;
    targetCompleted?: boolean;

    scopeIsStandard?: boolean | null;
    scopeOptionRequirements?: string | null;
    scopeTechLiaisonFlag?: boolean;
    scopeCompleted?: boolean;

    subsidyInsuranceStatus?: string | null;
    subsidyCompanyCategory?: string | null;
    subsidyApplicableProgram?: string | null;
    subsidyLaborConsultantOk?: boolean | null;
    subsidyCompleted?: boolean;

    decisionApproverInfo?: string | null;
    decisionTimeline?: ISODateOnlyString | null;
    decisionNextMeetingAttendee?: string | null;
    decisionCriteria?: string | null;
    decisionNextPlan?: string | null;
    decisionCompleted?: boolean;
}

export type HearingRecordResponse = ApiSuccessResponse<HearingRecord>;
export type HearingCompletionResponse = ApiSuccessResponse<HearingCompletionStatus>;
