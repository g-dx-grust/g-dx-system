import {
    ApiSuccessResponse,
    DateRangeQuery,
    ISODateOnlyString,
    ISODateString,
    UUID,
} from './common';
import { BusinessScopeType } from './permissions';
import { DealStageKey } from './sales';

// ─── 会社目標 ─────────────────────────────────────────────────────────────────

export type BusinessGoalPeriodType = 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY';

export interface BusinessGoalItem {
    id: UUID;
    businessUnitId: UUID;
    periodType: BusinessGoalPeriodType;
    /** 例: '2025' / '2025-H1' / '2025-Q1' / '2025-01' */
    periodKey: string;
    revenueTarget: number | null;
    grossProfitTarget: number | null;
    contractCountTarget: number | null;
}

export type BusinessGoalListResponse = ApiSuccessResponse<BusinessGoalItem[]>;

export interface UpsertBusinessGoalRequest {
    businessScope: BusinessScopeType;
    periodType: BusinessGoalPeriodType;
    periodKey: string;
    revenueTarget?: number | null;
    grossProfitTarget?: number | null;
    contractCountTarget?: number | null;
}

export type UpsertBusinessGoalResponse = ApiSuccessResponse<{ id: UUID }>;

// ─── チーム KPI 集計 ──────────────────────────────────────────────────────────

export interface MemberKpiTarget {
    userId: UUID;
    displayName: string;
    callTarget: number;
    visitTarget: number;
    newVisitTarget: number;
    appointmentTarget: number;
    negotiationTarget: number;
    newNegotiationTarget: number;
    contractTarget: number;
    revenueTarget: number;
}

export interface TeamKpiTotals {
    callTarget: number;
    visitTarget: number;
    newVisitTarget: number;
    appointmentTarget: number;
    negotiationTarget: number;
    newNegotiationTarget: number;
    contractTarget: number;
    revenueTarget: number;
}

export interface TeamKpiSummaryData {
    targetMonth: string;
    businessUnitId: UUID;
    teamTotal: TeamKpiTotals;
    memberTargets: MemberKpiTarget[];
}

export type TeamKpiSummaryResponse = ApiSuccessResponse<TeamKpiSummaryData>;

// ─── AI 週次サマリー ──────────────────────────────────────────────────────────

export type AiSummaryType = 'PERSONAL' | 'TEAM';

export interface AiWeeklySummaryData {
    id: UUID;
    summaryType: AiSummaryType;
    weekStartDate: string; // 'YYYY-MM-DD'
    weekEndDate: string;   // 'YYYY-MM-DD'
    summaryBody: string | null;
    modelId: string | null;
    generatedAt: ISODateString | null;
}

/** 未生成の場合は data: null */
export type AiWeeklySummaryResponse = ApiSuccessResponse<AiWeeklySummaryData | null>;

export interface DashboardQuery extends DateRangeQuery {
    businessScope?: BusinessScopeType;
}

export type DashboardSummaryResponse = ApiSuccessResponse<{
    totalDeals: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalSalesAmount: number;
    callCount: number;
    connectedRate: number;
}>;

export interface SalesFunnelItem {
    stage: DealStageKey;
    count: number;
    amount: number;
}

export type DashboardSalesFunnelResponse = ApiSuccessResponse<SalesFunnelItem[]>;

export interface DashboardCallPerformanceQuery extends DashboardQuery {
    groupBy?: 'day' | 'week' | 'month';
}

export interface DashboardCallPerformanceItem {
    date: ISODateOnlyString;
    callCount: number;
    connectedCount: number;
    connectedRate: number;
}

export type DashboardCallPerformanceResponse = ApiSuccessResponse<DashboardCallPerformanceItem[]>;

export interface DashboardOwnerRankingQuery extends DashboardQuery {
    metric?: 'won_amount' | 'won_count' | 'call_count';
}

export interface DashboardOwnerRankingItem {
    user: {
        id: UUID;
        name: string;
    };
    value: number;
}

export type DashboardOwnerRankingResponse = ApiSuccessResponse<DashboardOwnerRankingItem[]>;

export interface DashboardActivityFeedQuery {
    businessScope?: BusinessScopeType;
    limit?: number;
}

export interface DashboardActivityFeedItem {
    type: string;
    occurredAt: ISODateString;
    summary: string;
    entityId: UUID;
    entityType: 'deal' | 'call' | 'company' | 'contact' | string;
}

export type DashboardActivityFeedResponse = ApiSuccessResponse<DashboardActivityFeedItem[]>;
