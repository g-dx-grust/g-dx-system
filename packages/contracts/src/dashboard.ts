import {
    ApiSuccessResponse,
    DateRangeQuery,
    ISODateOnlyString,
    ISODateString,
    UUID,
} from './common';
import { BusinessScopeType } from './permissions';
import { DealStageKey } from './sales';

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
