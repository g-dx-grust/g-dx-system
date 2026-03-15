import {
    ApiSuccessResponse,
    DateRangeQuery,
    ISODateOnlyString,
    ISODateString,
    ListQuery,
    PaginationMeta,
    UUID,
} from './common';
import { BusinessScopeType } from './permissions';

export type DealStageKey =
    | 'APO_ACQUIRED'   // アポ獲得
    | 'NEGOTIATING'    // 商談中・見積提示
    | 'ALLIANCE'       // アライアンス
    | 'PENDING'        // ペンディング
    | 'APO_CANCELLED'  // アポキャン
    | 'LOST'           // 失注・不明
    | 'CONTRACTED';    // 契約済み
export type DealStatus = 'open' | 'won' | 'lost' | 'archived';

export interface DealListQuery extends ListQuery, DateRangeQuery {
    businessScope?: BusinessScopeType;
    stage?: DealStageKey;
    ownerUserId?: UUID;
    companyId?: UUID;
    keyword?: string;
}

export interface DealCompanySummary {
    id: UUID;
    name: string;
}

export interface DealOwnerSummary {
    id: UUID;
    name: string;
}

export interface DealListItem {
    id: UUID;
    businessScope: BusinessScopeType;
    name: string;
    company: DealCompanySummary;
    stage: DealStageKey;
    amount: number | null;
    ownerUser: DealOwnerSummary;
    expectedCloseDate: ISODateOnlyString | null;
}

export type DealListResponse = ApiSuccessResponse<DealListItem[], PaginationMeta>;

export interface CreateDealRequest {
    businessScope: BusinessScopeType;
    companyId: UUID;
    primaryContactId?: UUID;
    name: string;
    stage: DealStageKey;
    amount?: number;
    expectedCloseDate?: ISODateOnlyString;
    ownerUserId: UUID;
    source?: string;
    memo?: string;
}

export type CreateDealResponse = ApiSuccessResponse<{
    id: UUID;
    businessScope: BusinessScopeType;
    name: string;
    stage: DealStageKey;
    createdAt: ISODateString;
}>;

export interface DealDetail {
    id: UUID;
    businessScope: BusinessScopeType;
    company: DealCompanySummary;
    primaryContact?: {
        id: UUID;
        name: string;
    } | null;
    name: string;
    stage: DealStageKey;
    status: DealStatus;
    amount: number | null;
    expectedCloseDate: ISODateOnlyString | null;
    ownerUser: DealOwnerSummary;
    source: string | null;
    memo: string | null;
    acquisitionMethod: string | null;
    nextActionDate: string | null;
    nextActionContent: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}

export type DealDetailResponse = ApiSuccessResponse<DealDetail>;

export interface UpdateDealRequest {
    primaryContactId?: UUID | null;
    name?: string;
    amount?: number | null;
    expectedCloseDate?: ISODateOnlyString | null;
    ownerUserId?: UUID;
    source?: string | null;
    memo?: string | null;
    acquisitionMethod?: string | null;
    nextActionDate?: string | null;
    nextActionContent?: string | null;
}

export type UpdateDealResponse = ApiSuccessResponse<{
    id: UUID;
    updatedAt: ISODateString;
}>;

export interface DealStageTransitionRequest {
    toStage: DealStageKey;
    note?: string;
}

export type DealStageTransitionResponse = ApiSuccessResponse<{
    id: UUID;
    previousStage: DealStageKey;
    currentStage: DealStageKey;
    updatedAt: ISODateString;
}>;

export interface DealStageSummary {
    stageKey: DealStageKey;
    stageName: string;
    count: number;
    totalAmount: number;
}

export interface DealNextActionItem {
    dealId: UUID;
    dealName: string;
    companyName: string;
    stageKey: DealStageKey;
    stageName: string;
    amount: number | null;
    ownerName: string;
    ownerUserId: string;
    acquisitionMethod: string | null;
    nextActionDate: string;
    nextActionContent: string | null;
    lastActivitySummary: string | null;
    lastActivityDate: string | null;
}

export interface DealOwnerStat {
    ownerUserId: UUID;
    ownerName: string;
    totalDeals: number;
    activeDeals: number;
    contractedDeals: number;
    totalAmount: number;
}

export interface DealCompanyStat {
    companyId: string;
    companyName: string;
    totalDeals: number;
    activeDeals: number;
    totalAmount: number;
}

export interface DealDashboardSummary {
    totalDeals: number;
    activeGroup: { count: number; totalAmount: number };
    stalledGroup: { count: number; totalAmount: number };
    contractedGroup: { count: number; totalAmount: number };
    byStage: DealStageSummary[];
    nextActionsToday: DealNextActionItem[];
    nextActionsTomorrow: DealNextActionItem[];
    nextActionsThisWeek: DealNextActionItem[];
    byOwner: DealOwnerStat[];
    byCompany: DealCompanyStat[];
}

export interface PipelineStageDefinition {
    key: DealStageKey;
    label: string;
    order: number;
}

export type PipelineResponse = ApiSuccessResponse<{
    businessScope: BusinessScopeType;
    stages: PipelineStageDefinition[];
}>;

export interface PipelineBoardQuery {
    businessScope: BusinessScopeType;
    ownerUserId?: UUID;
}

export interface PipelineBoardColumn {
    stage: DealStageKey;
    deals: Array<{
        id: UUID;
        name: string;
        amount: number | null;
    }>;
}

export type PipelineBoardResponse = ApiSuccessResponse<PipelineBoardColumn[]>;

// ─── Contract ─────────────────────────────────────────────────────────────────

export type ContractStatus = 'CONTRACTED' | 'INVOICED' | 'PAID' | 'SERVICE_STARTED' | 'SERVICE_ENDED';

export interface ContractListItem {
    id: UUID;
    businessScope: BusinessScopeType;
    title: string;
    contractNumber: string | null;
    contractStatus: ContractStatus;
    company: { id: UUID; name: string };
    ownerUser: { id: UUID; name: string };
    amount: number | null;
    contractDate: string | null;
    serviceStartDate: string | null;
    serviceEndDate: string | null;
    dealId: UUID | null;
    createdAt: ISODateString;
}

export interface ContractDetail extends ContractListItem {
    primaryContact: { id: UUID; name: string } | null;
    invoiceDate: string | null;
    paymentDate: string | null;
    memo: string | null;
    fsInChargeUser: { id: UUID; name: string } | null;
    isInChargeUser: { id: UUID; name: string } | null;
    productCode: string | null;
    hasSubsidy: boolean | null;
    licensePlanCode: string | null;
    freeSupportMonths: number | null;
    enterpriseLicenseCount: number | null;
    proLicenseCount: number | null;
    a2LicenseCount: number | null;
    updatedAt: ISODateString;
}

export interface CreateContractRequest {
    dealId?: UUID;
    companyId: UUID;
    title: string;
    contractNumber?: string;
    contractStatus?: ContractStatus;
    amount?: number;
    contractDate?: string;
    invoiceDate?: string;
    paymentDate?: string;
    serviceStartDate?: string;
    serviceEndDate?: string;
    memo?: string;
    ownerUserId: UUID;
    fsInChargeUserId?: UUID;
    isInChargeUserId?: UUID;
    productCode?: string;
    hasSubsidy?: boolean;
    licensePlanCode?: string;
    freeSupportMonths?: number;
    enterpriseLicenseCount?: number;
    proLicenseCount?: number;
    a2LicenseCount?: number;
}

export interface UpdateContractRequest {
    title?: string;
    contractNumber?: string | null;
    contractStatus?: ContractStatus;
    amount?: number | null;
    contractDate?: string | null;
    invoiceDate?: string | null;
    paymentDate?: string | null;
    serviceStartDate?: string | null;
    serviceEndDate?: string | null;
    memo?: string | null;
    fsInChargeUserId?: string | null;
    isInChargeUserId?: string | null;
    productCode?: string | null;
    hasSubsidy?: boolean | null;
    licensePlanCode?: string | null;
    freeSupportMonths?: number | null;
    enterpriseLicenseCount?: number | null;
    proLicenseCount?: number | null;
    a2LicenseCount?: number | null;
}

export interface ContractDashboardSummary {
    totalContracts: number;
    byStatus: { status: ContractStatus; label: string; count: number; totalAmount: number }[];
    contractedGroup: { count: number; totalAmount: number };
    invoicedGroup: { count: number; totalAmount: number };
    paidGroup: { count: number; totalAmount: number };
    activeServiceGroup: { count: number; totalAmount: number };
    recentContracts: ContractListItem[];
}

// ─── Deal Activity ─────────────────────────────────────────────────────────────

export type DealActivityType = 'VISIT' | 'ONLINE' | 'CALL' | 'EMAIL' | 'OTHER';

export interface DealActivityItem {
    id: string;
    dealId: string;
    userId: string;
    userName: string;
    activityType: DealActivityType;
    activityDate: string;
    summary: string | null;
    createdAt: string;
}

export interface CreateDealActivityRequest {
    dealId: string;
    activityType: DealActivityType;
    activityDate: string;
    summary?: string;
}

// ─── JET Facility & JET Contract ─────────────────────────────────────────────

export type RebateStatus = 'PENDING' | 'PROCESSED' | 'NOT_APPLICABLE';
export type GdxReferralStatus = 'POSSIBLE' | 'REFERRED' | 'NOT_APPLICABLE';

export interface FacilityListItem {
    id: UUID;
    companyId: UUID;
    companyName: string;
    name: string;
    prefecture: string | null;
    city: string | null;
    addressLine1: string | null;
    managerName: string | null;
    contractCount: number;
}

export interface FacilityDetail {
    id: UUID;
    companyId: UUID;
    companyName: string;
    name: string;
    postalCode: string | null;
    prefecture: string | null;
    city: string | null;
    addressLine1: string | null;
    mainPhone: string | null;
    managerName: string | null;
    memo: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    relatedContracts: JetContractListItem[];
}

export interface JetContractListItem {
    id: UUID;
    title: string;
    contractNumber: string | null;
    contractStatus: ContractStatus;
    company: { id: UUID; name: string };
    facility: { id: UUID; name: string } | null;
    ownerUser: { id: UUID; name: string };
    amount: number | null;
    serviceStartDate: string | null;
    serviceEndDate: string | null;
    terminationDate: string | null;
    rebateRequired: boolean | null;
    rebateAmount: number | null;
    rebateStatus: RebateStatus | null;
    gdxReferralPossible: boolean | null;
    gdxReferralStatus: GdxReferralStatus | null;
    createdAt: ISODateString;
}

// ─── 個人 KPI 目標・ダッシュボード ───────────────────────────────────────────

export interface UserKpiTarget {
    userId: string;
    businessUnitId: string;
    targetMonth: string;
    callTarget: number;
    visitTarget: number;
    appointmentTarget: number;
    negotiationTarget: number;
    contractTarget: number;
    revenueTarget: number;
}

export interface PersonalKpiItem {
    key: 'callCount' | 'visitCount' | 'appointmentCount' | 'negotiationCount' | 'contractCount';
    label: string;
    actual: number;
    target: number;
    achievementPct: number;
}

export interface PersonalDashboardData {
    targetMonth: string;
    periodLabel: string;
    kpiItems: PersonalKpiItem[];
    revenueActual: number;
    revenueTarget: number;
    revenueAchievementPct: number;
    hasTargets: boolean;
}

export type NextActionUrgency = 'OVERDUE' | 'TODAY' | 'THIS_WEEK';

export interface PersonalNextActionItem {
    dealId: string;
    dealName: string;
    companyName: string;
    stageKey: string;
    stageName: string;
    amount: number | null;
    nextActionDate: string;
    nextActionContent: string | null;
    urgency: NextActionUrgency;
}

export interface SaveKpiTargetInput {
    targetMonth: string;
    callTarget: number;
    visitTarget: number;
    appointmentTarget: number;
    negotiationTarget: number;
    contractTarget: number;
    revenueTarget: number;
}
