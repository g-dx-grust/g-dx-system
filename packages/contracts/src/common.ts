import { BusinessScopeType, RoleType } from './permissions';

export type UUID = string;
export type ISODateString = string;
export type ISODateOnlyString = string;

export interface ApiSuccessResponse<TData, TMeta = undefined> {
    data: TData;
    meta: TMeta extends undefined ? Record<string, never> | undefined : TMeta;
}

export interface FieldValidationErrors {
    [field: string]: string[];
}

export interface ApiErrorDetail {
    fields?: FieldValidationErrors;
    [key: string]: unknown;
}

export interface ApiErrorResponse {
    error: {
        code: ApiErrorCode;
        message: string;
        details?: ApiErrorDetail;
    };
}

export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
}

export interface ListQuery {
    page?: number;
    pageSize?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface DateRangeQuery {
    from?: ISODateOnlyString;
    to?: ISODateOnlyString;
}

export interface EntityTimestamps {
    id: UUID;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}

export interface UserSummary {
    id: UUID;
    name: string;
    email: string;
    avatarUrl?: string | null;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
}

export interface BusinessScopedEntitySummary extends EntityTimestamps {
    businessScope: BusinessScopeType;
}

export type ApiErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'BUSINESS_SCOPE_FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'DUPLICATE_COMPANY'
    | 'INVALID_STAGE_TRANSITION'
    | 'DEAL_SCOPE_MISMATCH'
    | 'CALL_SCOPE_MISMATCH'
    | 'LARK_SYNC_FAILED'
    | 'LARK_AUTH_PROVIDER_ERROR'
    | 'NOT_IMPLEMENTED'
    | 'INTERNAL_SERVER_ERROR';
