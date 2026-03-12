import { BusinessScopeType, PermissionKey } from './permissions';
import { ApiSuccessResponse, ISODateString, UserSummary } from './common';

export interface LarkAuthStartRequest {
    redirectTo?: string;
}

export type LarkAuthStartResponse = ApiSuccessResponse<{
    authUrl: string;
}>;

export interface LarkAuthCallbackRequest {
    code: string;
    state: string;
}

export type LarkAuthCallbackResponse = ApiSuccessResponse<{
    user: UserSummary;
    session: {
        expiresAt: ISODateString;
    };
}>;

export interface SessionPermissionModules {
    sales_management?: Array<'read' | 'create' | 'update'>;
    customer_management?: Array<'read' | 'create' | 'update'>;
    call_system?: Array<'read' | 'create' | 'update'>;
    dashboard?: Array<'read'>;
}

export type SessionResponse = ApiSuccessResponse<{
    isAuthenticated: boolean;
    user: UserSummary | null;
    activeBusinessScope?: BusinessScopeType;
    permissions?: {
        modules: SessionPermissionModules;
        grantedKeys?: PermissionKey[];
    };
}>;

export interface SessionScopeUpdateRequest {
    activeBusinessScope: BusinessScopeType;
}

export type SessionScopeUpdateResponse = ApiSuccessResponse<{
    activeBusinessScope: BusinessScopeType;
}>;

export type LogoutResponse = ApiSuccessResponse<{
    loggedOut: true;
}>;
