import type { BusinessScopeType, CompanyDetail, CompanyListItem, UUID } from '@g-dx/contracts';

export interface CompanyListFilters {
    page?: number;
    pageSize?: number;
    keyword?: string;
    businessScope: BusinessScopeType;
}

export interface CompanyListResult {
    data: CompanyListItem[];
    meta: {
        page: number;
        pageSize: number;
        total: number;
    };
}

export interface CreateCompanyInput {
    name: string;
    industry?: string;
    phone?: string;
    website?: string;
    postalCode?: string;
    address?: string;
    ownerUserId?: UUID;
    tags?: string[];
    businessScope: BusinessScopeType;
    actorUserId: UUID;
}

export interface CreatedCompany {
    id: UUID;
    name: string;
    sharedAcrossBusinesses: boolean;
    createdAt: string;
}

export interface CompanyDetailResult extends CompanyDetail {}

export interface UpdateCompanyInput {
    companyId: UUID;
    industry?: string;
    phone?: string;
    ownerUserId?: UUID;
    tags?: string[];
    businessScope: BusinessScopeType;
    actorUserId: UUID;
}

export interface UpdatedCompany {
    id: UUID;
    updatedAt: string;
}
