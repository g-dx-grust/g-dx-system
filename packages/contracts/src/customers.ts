import {
    ApiSuccessResponse,
    ISODateString,
    ListQuery,
    PaginationMeta,
    UUID,
} from './common';
import { BusinessScopeType } from './permissions';

export type CustomerStatus = 'active' | 'inactive' | 'archived';

export interface CompanyOwnerSummary {
    id: UUID;
    name: string;
}

export interface CompanyListQuery extends ListQuery {
    keyword?: string;
    industry?: string;
    businessScope?: BusinessScopeType;
    assignedUserId?: UUID;
    status?: CustomerStatus;
}

export interface CompanyListItem {
    id: UUID;
    name: string;
    industry: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    sharedAcrossBusinesses: boolean;
    tags: string[];
    ownerUser: CompanyOwnerSummary | null;
}

export type CompanyListResponse = ApiSuccessResponse<CompanyListItem[], PaginationMeta>;

export interface CreateCompanyRequest {
    name: string;
    industry?: string;
    phone?: string;
    website?: string;
    postalCode?: string;
    address?: string;
    ownerUserId?: UUID;
    tags?: string[];
    sharedAcrossBusinesses?: boolean;
}

export type CreateCompanyResponse = ApiSuccessResponse<{
    id: UUID;
    name: string;
    sharedAcrossBusinesses: boolean;
    createdAt: ISODateString;
}>;

export interface CompanyContactSummary {
    id: UUID;
    name: string;
    department: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
}

export interface CompanyRelatedDeal {
    id: UUID;
    businessScope: string;
    title: string;
    stageKey: string;
    stageName: string;
    amount: number | null;
    ownerName: string;
    dealStatus: string;
    expectedCloseDate: string | null;
}

export interface CompanyDetail {
    id: UUID;
    name: string;
    industry: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    ownerUser: CompanyOwnerSummary | null;
    contacts: CompanyContactSummary[];
    openDealsSummary: Partial<Record<BusinessScopeType, number>>;
    relatedDeals: CompanyRelatedDeal[];
}

export type CompanyDetailResponse = ApiSuccessResponse<CompanyDetail>;

export interface UpdateCompanyRequest {
    industry?: string;
    phone?: string;
    ownerUserId?: UUID;
    tags?: string[];
}

export type UpdateCompanyResponse = ApiSuccessResponse<{
    id: UUID;
    updatedAt: ISODateString;
}>;

export interface ContactListQuery extends ListQuery {
    keyword?: string;
    companyId?: UUID;
    businessScope?: BusinessScopeType;
}

export interface ContactListItem {
    id: UUID;
    companyId: UUID;
    companyName: string;
    name: string;
    department: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
}

export type ContactListResponse = ApiSuccessResponse<ContactListItem[], PaginationMeta>;

export interface CreateContactRequest {
    companyId: UUID;
    name: string;
    department?: string;
    title?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
}

export type CreateContactResponse = ApiSuccessResponse<{
    id: UUID;
    companyId: UUID;
    name: string;
}>;

export interface UpdateContactRequest {
    department?: string;
    title?: string;
    email?: string;
    phone?: string;
}

export type UpdateContactResponse = ApiSuccessResponse<{
    id: UUID;
    updatedAt: ISODateString;
}>;

export interface CompanyTimelineQuery extends ListQuery { }

export interface CompanyTimelineItem {
    type: 'deal_created' | 'call_logged' | string;
    occurredAt: ISODateString;
    businessScope: BusinessScopeType;
    summary: string;
}

export type CompanyTimelineResponse = ApiSuccessResponse<CompanyTimelineItem[]>;
