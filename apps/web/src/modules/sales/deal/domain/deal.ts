import type { BusinessScopeType, DealDetail, DealListItem, DealStageKey, DealStatus, UUID } from '@g-dx/contracts';

export interface DealListFilters {
    page?: number;
    pageSize?: number;
    keyword?: string;
    businessScope: BusinessScopeType;
    stage?: DealStageKey;
    ownerUserId?: UUID;
    companyId?: UUID;
    amountMin?: number;
    amountMax?: number;
    nextActionStatus?: 'NOT_SET' | 'OVERDUE' | 'THIS_WEEK' | 'ALL';
    dealStatus?: DealStatus;
}

export interface DealListResult {
    data: DealListItem[];
    meta: { page: number; pageSize: number; total: number };
}

export interface CreateDealInput {
    businessScope: BusinessScopeType;
    companyId: UUID;
    primaryContactId?: UUID;
    name: string;
    stage: DealStageKey;
    amount?: number;
    expectedCloseDate?: string | null;
    nextActionDate?: string | null;
    nextActionContent?: string | null;
    ownerUserId: UUID;
    source?: string;
    memo?: string;
    actorUserId: UUID;
}

export interface CreatedDeal {
    id: UUID;
    businessScope: BusinessScopeType;
    name: string;
    stage: DealStageKey;
    createdAt: string;
}

export interface UpdateDealInput {
    dealId: UUID;
    primaryContactId?: UUID | null;
    name?: string;
    amount?: number | null;
    expectedCloseDate?: string | null;
    ownerUserId?: UUID;
    source?: string | null;
    memo?: string | null;
    acquisitionMethod?: string | null;
    nextActionDate?: string | null;
    nextActionContent?: string | null;
    businessScope: BusinessScopeType;
    actorUserId: UUID;
}

export interface UpdatedDeal {
    id: UUID;
    updatedAt: string;
}

export interface ChangeDealStageInput {
    dealId: UUID;
    toStage: DealStageKey;
    note?: string;
    businessScope: BusinessScopeType;
    actorUserId: UUID;
}

export interface ChangedDealStage {
    id: UUID;
    previousStage: DealStageKey;
    currentStage: DealStageKey;
    updatedAt: string;
}

export interface PipelineDefinition {
    businessScope: BusinessScopeType;
    stages: Array<{ key: DealStageKey; label: string; order: number }>;
}

export interface PipelineBoardColumn {
    stage: DealStageKey;
    deals: Array<{ id: UUID; name: string; amount: number | null }>;
}

// Re-export for convenience
export type { DealDetail, DealListItem };

export interface DealDashboardFilters {
    businessScope: BusinessScopeType;
}
