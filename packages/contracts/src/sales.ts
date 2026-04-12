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
    amountMin?: number;
    amountMax?: number;
    nextActionStatus?: 'NOT_SET' | 'OVERDUE' | 'THIS_WEEK' | 'ALL';
    dealStatus?: DealStatus;
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
    nextActionDate?: ISODateOnlyString | null;
    nextActionContent?: string | null;
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
    larkChatId: string | null;
    larkCalendarId: string | null;
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
export type RegularMeetingFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

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
    // CS管理フィールド
    csPhase: ContractProgressStatus | null;
    regularMeetingWeekday: string | null;
    regularMeetingTime: string | null;
    regularMeetingFrequency: RegularMeetingFrequency | null;
    totalSessionCount: number;
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
    // CS管理フィールド
    csPhase?: ContractProgressStatus | null;
    regularMeetingWeekday?: string | null;
    regularMeetingTime?: string | null;
    regularMeetingFrequency?: RegularMeetingFrequency | null;
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
export type VisitCategory = 'NEW' | 'REPEAT';
export type MeetingTargetType = 'INDIVIDUAL' | 'CORPORATE';
export type NegotiationOutcome = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface DealActivityItem {
    id: string;
    dealId: string;
    userId: string;
    userName: string;
    activityType: DealActivityType;
    activityDate: string;
    summary: string | null;
    meetingCount: number;
    visitCategory: VisitCategory | null;
    targetType: MeetingTargetType | null;
    isNegotiation: boolean;
    negotiationOutcome: NegotiationOutcome | null;
    competitorInfo: string | null;
    larkMeetingUrl: string | null;
    createdAt: string;
    updatedAt?: string;
}

export interface UpdateDealActivityRequest {
    activityType?: DealActivityType;
    activityDate?: string;
    summary?: string | null;
    meetingCount?: number;
    visitCategory?: VisitCategory | null;
    targetType?: MeetingTargetType | null;
    isNegotiation?: boolean;
    negotiationOutcome?: NegotiationOutcome | null;
    competitorInfo?: string | null;
    larkMeetingUrl?: string | null;
    nextActionDate?: string | null;
    nextActionContent?: string | null;
}

export interface CreateDealActivityRequest {
    dealId: string;
    activityType: DealActivityType;
    activityDate: string;
    summary?: string;
    meetingCount?: number;
    visitCategory?: VisitCategory;
    targetType?: MeetingTargetType;
    isNegotiation?: boolean;
    negotiationOutcome?: NegotiationOutcome;
    competitorInfo?: string;
    larkMeetingUrl?: string;
}

export type DashboardAlertType =
    | 'NO_NEXT_ACTION'
    | 'OVERDUE_ACTION'
    | 'NO_OWNER'
    | 'STALE_DEAL'
    | 'SLA_EXCEEDED';

export type DashboardAlertSeverity = 'HIGH' | 'MEDIUM';

export interface DashboardAlert {
    type: DashboardAlertType;
    severity: DashboardAlertSeverity;
    dealId: string;
    dealName: string;
    companyName: string;
    ownerName: string | null;
    detail: string;
}

// ─── Contract Activity ────────────────────────────────────────────────────────

export type ContractActivityType = 'REGULAR' | 'SPOT' | 'CALL' | 'EMAIL' | 'INTERNAL' | 'OTHER';
export type ContractActivityInitiatedBy = 'CLIENT' | 'US';
export type ContractNextSessionType = 'REGULAR' | 'SPOT';
export type ContractProgressStatus =
    | 'HEARING'         // ヒアリング
    | 'ENV_SETUP'       // 環境設定
    | 'FIRST_DELIVERY'  // 一次納品
    | 'SECOND_DELIVERY' // 二次納品
    | 'FINAL_DELIVERY'  // 本納品
    | 'STABLE'          // 安定稼働
    | 'RENEWAL'         // 更新検討
    | 'OTHER';          // その他

export interface ContractActivityItem {
    id: string;
    contractId: string;
    userId: string;
    userName: string;
    activityType: ContractActivityType;
    initiatedBy: ContractActivityInitiatedBy | null;
    activityDate: string;
    summary: string | null;
    sessionNumber: number | null;
    progressStatus: ContractProgressStatus | null;
    larkMeetingUrl: string | null;
    nextSessionType: ContractNextSessionType | null;
    nextSessionDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateContractActivityRequest {
    contractId: string;
    activityType: ContractActivityType;
    initiatedBy?: ContractActivityInitiatedBy;
    activityDate: string;
    summary?: string;
    sessionNumber?: number;
    progressStatus?: ContractProgressStatus;
    larkMeetingUrl?: string;
    nextSessionType?: ContractNextSessionType;
    nextSessionDate?: string;
}

export interface UpdateContractActivityRequest {
    activityType?: ContractActivityType;
    initiatedBy?: ContractActivityInitiatedBy | null;
    activityDate?: string;
    summary?: string | null;
    sessionNumber?: number | null;
    progressStatus?: ContractProgressStatus | null;
    larkMeetingUrl?: string | null;
    nextSessionType?: ContractNextSessionType | null;
    nextSessionDate?: string | null;
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
    newVisitTarget: number;
    appointmentTarget: number;
    negotiationTarget: number;
    newNegotiationTarget: number;
    contractTarget: number;
    revenueTarget: number;
}

export interface PersonalKpiItem {
    key:
        | 'callCount'
        | 'newVisitCount'
        | 'appointmentCount'
        | 'newNegotiationCount'
        | 'contractCount';
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
    rollingKpis: PersonalRollingKpiBlock[];
    lastWeekCompanyActions: PersonalLastWeekCompanyActionGroup[];
}

export type PersonalCompanyActionType = 'VISIT' | 'ONLINE' | 'APPOINTMENT' | 'CONTRACT';

export interface PersonalLastWeekCompanyActionItem {
    companyId: UUID;
    companyName: string;
    dealId: UUID;
    dealName: string;
    latestActedAt: ISODateString | ISODateOnlyString;
    occurrenceCount: number;
}

export interface PersonalLastWeekCompanyActionGroup {
    actionType: PersonalCompanyActionType;
    label: string;
    companies: PersonalLastWeekCompanyActionItem[];
}

// ─── Rolling KPI（期間別実績）────────────────────────────────────────────────

export type DealSegment = 'new' | 'existing';
export type RollingKpiPeriod = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';
export type RollingKpiMetricKey =
    | 'callCount'
    | 'visitCount'
    | 'onlineCount'
    | 'newVisitCount'
    | 'appointmentCount'
    | 'negotiationCount'
    | 'contractCount';

export interface KpiSegmentedCounts {
    total: number;
    bySegment: Record<DealSegment, number>;
}

export interface PersonalRollingKpiBlock {
    period: RollingKpiPeriod;
    periodLabel: string;
    startDate: string;
    endDate: string;
    metrics: Record<RollingKpiMetricKey, KpiSegmentedCounts>;
}

export interface SalesRollingKpiColumn {
    period: RollingKpiPeriod;
    periodLabel: string;
    startDate: string;
    endDate: string;
    metrics: Record<RollingKpiMetricKey, KpiSegmentedCounts>;
}

export type SalesRollingKpiGrid = SalesRollingKpiColumn[];

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

// ─── Alliance ─────────────────────────────────────────────────────────────────

export type AllianceType = 'COMPANY' | 'INDIVIDUAL';
export type AllianceStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE';
export type AllianceReferralType = 'INTRODUCER' | 'PARTNER' | 'ADVISOR';

export interface AllianceListItem {
    id: UUID;
    name: string;
    allianceType: AllianceType;
    contactPersonName: string | null;
    relationshipStatus: AllianceStatus;
    linkedDealCount: number;
    createdAt: ISODateString;
}

export interface AllianceDetail extends AllianceListItem {
    businessScope: BusinessScopeType;
    contactPersonRole: string | null;
    contactPersonEmail: string | null;
    contactPersonPhone: string | null;
    agreementSummary: string | null;
    notes: string | null;
    linkedDeals: AllianceLinkedDeal[];
    updatedAt: ISODateString;
}

export interface AllianceLinkedDeal {
    dealId: UUID;
    dealName: string;
    companyName: string;
    stageKey: DealStageKey;
    referralType: AllianceReferralType;
    note: string | null;
}

// ─── Alliance Activity ────────────────────────────────────────────────────────

export type AllianceActivityType = 'VISIT' | 'ONLINE' | 'CALL' | 'EMAIL' | 'OTHER';

export interface AllianceActivityItem {
    id: string;
    allianceId: string;
    userId: string;
    userName: string;
    activityType: AllianceActivityType;
    activityDate: string;
    summary: string | null;
    larkMeetingUrl: string | null;
    nextActionDate: string | null;
    nextActionContent: string | null;
    createdAt: string;
    updatedAt?: string;
}

export interface UpdateAllianceActivityRequest {
    activityType?: AllianceActivityType;
    activityDate?: string;
    summary?: string | null;
    larkMeetingUrl?: string | null;
    nextActionDate?: string | null;
    nextActionContent?: string | null;
}

export interface CreateAllianceActivityRequest {
    allianceId: string;
    activityType: AllianceActivityType;
    activityDate: string;
    summary?: string;
    larkMeetingUrl?: string;
    nextActionDate?: string;
    nextActionContent?: string;
}

export interface SaveKpiTargetInput {
    targetMonth: string;
    callTarget: number;
    visitTarget: number;
    newVisitTarget: number;
    appointmentTarget: number;
    negotiationTarget: number;
    newNegotiationTarget: number;
    contractTarget: number;
    revenueTarget: number;
}
