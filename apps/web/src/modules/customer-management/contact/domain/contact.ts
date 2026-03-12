import type { BusinessScopeType, ContactListItem, UUID } from '@g-dx/contracts';

export interface ContactListFilters {
    page?: number;
    pageSize?: number;
    keyword?: string;
    companyId?: UUID;
    businessScope: BusinessScopeType;
}

export interface ContactListResult {
    data: ContactListItem[];
    meta: {
        page: number;
        pageSize: number;
        total: number;
    };
}

export interface CreateContactInput {
    companyId: UUID;
    name: string;
    department?: string;
    title?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
    businessScope: BusinessScopeType;
    actorUserId: UUID;
}

export interface CreatedContact {
    id: UUID;
    companyId: UUID;
    name: string;
}

export interface ContactDetail {
    id: UUID;
    name: string;
    department: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
    linkedCompanies: Array<{
        id: UUID;
        name: string;
        isPrimary: boolean;
    }>;
}

export interface UpdateContactInput {
    contactId: UUID;
    department?: string;
    title?: string;
    email?: string;
    phone?: string;
    businessScope: BusinessScopeType;
    actorUserId: UUID;
}

export interface UpdatedContact {
    id: UUID;
    updatedAt: string;
}
