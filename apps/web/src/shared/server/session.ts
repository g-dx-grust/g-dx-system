import { cookies } from 'next/headers';
import {
    BusinessScope,
    PermissionKey,
    PermissionLevel,
    Role,
    RolePermissionMatrix,
    type BusinessScopeType,
    type RoleType,
    type UserSummary,
} from '@g-dx/contracts';
import { appConfig } from '@g-dx/config';
import { db } from '@g-dx/database';
import {
    businessUnits,
    roles,
    userBusinessMemberships,
    userRoleAssignments,
    users,
} from '@g-dx/database/schema';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { isBusinessScopeType } from '@/shared/constants/business-scopes';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const ACTIVE_SCOPE_COOKIE_NAME = 'gdx_active_scope';

export interface BusinessMembershipSummary {
    code: BusinessScopeType;
    name: string;
    isDefault: boolean;
}

export interface AuthenticatedAppSession {
    user: UserSummary;
    activeBusinessScope: BusinessScopeType;
    businessMemberships: BusinessMembershipSummary[];
    expiresAt: string;
}

export interface SessionPermissionModules {
    sales_management: Array<'read' | 'create' | 'update'>;
    customer_management: Array<'read' | 'create' | 'update'>;
    call_system: Array<'read' | 'create' | 'update'>;
    dashboard: Array<'read'>;
}

interface RoleAssignmentSummary {
    role: RoleType;
    businessScope: BusinessScopeType | null;
}

export function getSessionCookieName(): string {
    return appConfig.auth.sessionCookieName;
}

function getSessionMaxAge(): number {
    return SESSION_MAX_AGE_SECONDS;
}

function getSessionExpiryIso(): string {
    return new Date(Date.now() + getSessionMaxAge() * 1000).toISOString();
}

function getActiveScopeCookieName(): string {
    return ACTIVE_SCOPE_COOKIE_NAME;
}

function dedupePermissions<T extends string>(values: T[]): T[] {
    return [...new Set(values)];
}

function mapPermissionKeysToModules(permissionKeys: PermissionKey[]): SessionPermissionModules {
    const sales: Array<'read' | 'create' | 'update'> = [];
    const customer: Array<'read' | 'create' | 'update'> = [];
    const callSystem: Array<'read' | 'create' | 'update'> = [];
    const dashboard: Array<'read'> = [];

    if (permissionKeys.some((key) => key === 'sales.deal.read' || key === 'sales.contract.read')) {
        sales.push('read');
    }
    if (permissionKeys.some((key) => key === 'sales.deal.create' || key === 'sales.contract.create')) {
        sales.push('create');
    }
    if (permissionKeys.some((key) => key.startsWith('sales.deal.update') || key.startsWith('sales.contract.update') || key === 'sales.deal.reassign')) {
        sales.push('update');
    }

    if (permissionKeys.some((key) => key === 'customer.company.read' || key === 'customer.contact.read')) {
        customer.push('read');
    }
    if (permissionKeys.some((key) => key === 'customer.company.create' || key === 'customer.contact.create')) {
        customer.push('create');
    }
    if (permissionKeys.some((key) => key === 'customer.company.update' || key === 'customer.contact.update')) {
        customer.push('update');
    }

    if (permissionKeys.some((key) => key === 'call.task.read' || key === 'call.log.read')) {
        callSystem.push('read');
    }
    if (permissionKeys.some((key) => key === 'call.task.create' || key === 'call.log.create')) {
        callSystem.push('create');
    }
    if (permissionKeys.some((key) => key === 'call.task.assign' || key === 'call.log.update')) {
        callSystem.push('update');
    }

    if (permissionKeys.some((key) => key.startsWith('dashboard.'))) {
        dashboard.push('read');
    }

    return {
        sales_management: dedupePermissions(sales),
        customer_management: dedupePermissions(customer),
        call_system: dedupePermissions(callSystem),
        dashboard: dedupePermissions(dashboard),
    };
}

export async function issueSession(userId: string, activeBusinessScope: BusinessScopeType): Promise<void> {
    const cookieStore = cookies();
    const cookieBase = {
        httpOnly: true as const,
        sameSite: 'lax' as const,
        secure: appConfig.app.env === 'production',
        path: '/',
        maxAge: getSessionMaxAge(),
    };

    cookieStore.set(getSessionCookieName(), userId, cookieBase);
    cookieStore.set(getActiveScopeCookieName(), activeBusinessScope, {
        ...cookieBase,
        httpOnly: false,
    });
}

export async function clearSession(): Promise<void> {
    const cookieStore = cookies();
    cookieStore.delete(getSessionCookieName());
    cookieStore.delete(getActiveScopeCookieName());
}

export async function setActiveBusinessScopeCookie(activeBusinessScope: BusinessScopeType): Promise<void> {
    const cookieStore = cookies();
    cookieStore.set(getActiveScopeCookieName(), activeBusinessScope, {
        httpOnly: false,
        sameSite: 'lax',
        secure: appConfig.app.env === 'production',
        path: '/',
        maxAge: getSessionMaxAge(),
    });
}

export async function getAuthenticatedAppSession(): Promise<AuthenticatedAppSession | null> {
    const cookieStore = cookies();
    const userId = cookieStore.get(getSessionCookieName())?.value;

    if (!userId) {
        return null;
    }

    const [user] = await db
        .select({
            id: users.id,
            name: users.displayName,
            email: users.email,
            avatarUrl: users.avatarUrl,
            status: users.status,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user || user.status !== 'active') {
        return null;
    }

    const memberships = await db
        .select({
            code: businessUnits.code,
            name: businessUnits.name,
            isDefault: userBusinessMemberships.isDefault,
        })
        .from(userBusinessMemberships)
        .innerJoin(businessUnits, eq(userBusinessMemberships.businessUnitId, businessUnits.id))
        .where(
            and(
                eq(userBusinessMemberships.userId, userId),
                eq(userBusinessMemberships.membershipStatus, 'active'),
                eq(businessUnits.isActive, true)
            )
        );

    const businessMemberships = memberships
        .filter((membership): membership is typeof membership & { code: BusinessScopeType } => isBusinessScopeType(membership.code))
        .map((membership) => ({
            code: membership.code,
            name: membership.name,
            isDefault: membership.isDefault,
        }));

    if (businessMemberships.length === 0) {
        return null;
    }

    const roleRows = await db
        .select({
            code: roles.code,
            businessScope: businessUnits.code,
        })
        .from(userRoleAssignments)
        .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
        .leftJoin(businessUnits, eq(userRoleAssignments.businessUnitId, businessUnits.id))
        .where(
            and(
                eq(userRoleAssignments.userId, userId),
                or(isNull(userRoleAssignments.expiresAt), gt(userRoleAssignments.expiresAt, new Date()))
            )
        );

    // SUPER_ADMIN は全ビジネスユニットに自動アクセス
    if (roleRows.some(row => row.code === Role.SUPER_ADMIN)) {
        const allUnits = await db
            .select({ code: businessUnits.code, name: businessUnits.name })
            .from(businessUnits)
            .where(eq(businessUnits.isActive, true));
        for (const unit of allUnits) {
            if (isBusinessScopeType(unit.code) && !businessMemberships.some(m => m.code === unit.code)) {
                businessMemberships.push({ code: unit.code as BusinessScopeType, name: unit.name, isDefault: false });
            }
        }
    }

    const requestedScope = cookieStore.get(getActiveScopeCookieName())?.value;
    const defaultScope =
        businessMemberships.find((membership) => membership.isDefault)?.code ?? businessMemberships[0].code;
    const activeBusinessScope =
        requestedScope && isBusinessScopeType(requestedScope) && businessMemberships.some((membership) => membership.code === requestedScope)
            ? requestedScope
            : defaultScope;
    const activeRoleAssignments = roleRows
        .map((row) => ({
            role: row.code as RoleType,
            businessScope: row.businessScope && isBusinessScopeType(row.businessScope) ? row.businessScope : null,
        }))
        .filter((assignment): assignment is RoleAssignmentSummary => assignment.businessScope === null || assignment.businessScope === activeBusinessScope);
    const userRoles = [...new Set(activeRoleAssignments.map((assignment) => assignment.role))];

    return {
        user: {
            id: user.id,
            name: user.name ?? 'Unknown User',
            email: user.email ?? '',
            avatarUrl: user.avatarUrl ?? null,
            roles: userRoles,
            businessScopes: businessMemberships.map((membership) => membership.code),
        },
        activeBusinessScope,
        businessMemberships,
        expiresAt: getSessionExpiryIso(),
    };
}

export function getGrantedPermissionKeys(roles: RoleType[]): PermissionKey[] {
    const granted = new Set<PermissionKey>();

    for (const role of roles) {
        const permissionEntries = Object.entries(RolePermissionMatrix[role] ?? {}) as Array<[PermissionKey, string]>;
        for (const [permissionKey, level] of permissionEntries) {
            if (level === PermissionLevel.YES || level === PermissionLevel.CONDITIONAL) {
                granted.add(permissionKey);
            }
        }
    }

    return [...granted];
}

export function getSessionPermissionModules(roles: RoleType[]): SessionPermissionModules {
    return mapPermissionKeysToModules(getGrantedPermissionKeys(roles));
}

export function getDefaultBusinessScope(): BusinessScopeType {
    return BusinessScope.LARK_SUPPORT;
}
