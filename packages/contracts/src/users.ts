import { BusinessScopeType, Role, RoleType } from './permissions';
import {
    ApiSuccessResponse,
    EntityTimestamps,
    ISODateString,
    ListQuery,
    PaginationMeta,
    UUID,
} from './common';
import { SessionPermissionModules } from './auth';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserListQuery extends ListQuery {
    keyword?: string;
    roles?: RoleType[];
    businessScope?: BusinessScopeType;
    status?: UserStatus;
}

export interface UserListItem {
    id: UUID;
    name: string;
    email: string;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
    status: UserStatus;
    lastLoginAt: ISODateString | null;
}

export type UserListResponse = ApiSuccessResponse<UserListItem[], PaginationMeta>;

export interface CreateUserRequest {
    larkUserId: string;
    name: string;
    email: string;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
}

export type CreateUserResponse = ApiSuccessResponse<{
    id: UUID;
    name: string;
    email: string;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
    status: UserStatus;
}>;

export interface UserDetail extends EntityTimestamps {
    name: string;
    email: string;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
    status: UserStatus;
    larkUserId: string;
}

export type UserDetailResponse = ApiSuccessResponse<UserDetail>;

export interface UpdateUserRequest {
    roles?: RoleType[];
    businessScopes?: BusinessScopeType[];
    status?: UserStatus;
}

export type UpdateUserResponse = ApiSuccessResponse<{
    id: UUID;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
    status: UserStatus;
    updatedAt: ISODateString;
}>;

export type MeResponse = ApiSuccessResponse<{
    id: UUID;
    name: string;
    email: string;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
    permissions: SessionPermissionModules;
}>;

export interface RoleOption {
    key: RoleType;
    label: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
    { key: Role.SUPER_ADMIN, label: 'Super Admin' },
    { key: Role.ADMIN, label: 'Admin' },
    { key: Role.MANAGER, label: 'Manager' },
    { key: Role.OPERATOR, label: 'Operator' },
    { key: Role.VIEWER, label: 'Viewer' },
];

export type RolesResponse = ApiSuccessResponse<RoleOption[]>;
