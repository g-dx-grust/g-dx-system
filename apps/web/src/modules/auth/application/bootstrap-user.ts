import { BusinessScope, Role, type BusinessScopeType } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import {
    businessUnits,
    roles,
    userBusinessMemberships,
    userRoleAssignments,
    users,
} from '@g-dx/database/schema';
import { and, eq, isNull, or } from 'drizzle-orm';
import { getDefaultBusinessScope, issueSession, setActiveBusinessScopeCookie } from '@/shared/server/session';

export interface BootstrapUserProfile {
    openId: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
}

interface BusinessScopeResolution {
    id: string | null;
    code: BusinessScopeType;
}

async function ensureDefaultBusinessUnit() {
    const defaultScope = getDefaultBusinessScope();
    const [defaultUnit] = await db
        .select({
            id: businessUnits.id,
            code: businessUnits.code,
        })
        .from(businessUnits)
        .where(and(eq(businessUnits.code, defaultScope), eq(businessUnits.isActive, true)))
        .limit(1);

    if (defaultUnit) {
        return defaultUnit;
    }

    const [createdUnit] = await db
        .insert(businessUnits)
        .values({
            code: defaultScope,
            name: 'Lark Support',
            isActive: true,
            sortOrder: 0,
        })
        .returning({
            id: businessUnits.id,
            code: businessUnits.code,
        });

    return createdUnit;
}

async function ensureOperatorRole() {
    const [operatorRole] = await db
        .select({
            id: roles.id,
        })
        .from(roles)
        .where(eq(roles.code, Role.OPERATOR))
        .limit(1);

    if (operatorRole) {
        return operatorRole;
    }

    const [createdRole] = await db
        .insert(roles)
        .values({
            code: Role.OPERATOR,
            name: 'Operator',
            isSystemRole: true,
            sortOrder: 0,
        })
        .returning({
            id: roles.id,
        });

    return createdRole;
}

async function ensureDefaultBusinessMembership(userId: string): Promise<BusinessScopeResolution> {
    const defaultScope = getDefaultBusinessScope();
    const defaultUnit = await ensureDefaultBusinessUnit();
    if (!defaultUnit) {
        return {
            id: null,
            code: BusinessScope.LARK_SUPPORT,
        };
    }

    const [existingMembership] = await db
        .select({
            id: userBusinessMemberships.id,
            membershipStatus: userBusinessMemberships.membershipStatus,
            isDefault: userBusinessMemberships.isDefault,
        })
        .from(userBusinessMemberships)
        .where(
            and(
                eq(userBusinessMemberships.userId, userId),
                eq(userBusinessMemberships.businessUnitId, defaultUnit.id),
            ),
        )
        .limit(1);

    if (!existingMembership) {
        await db.insert(userBusinessMemberships).values({
            userId,
            businessUnitId: defaultUnit.id,
            membershipStatus: 'active',
            isDefault: true,
        });
    } else if (existingMembership.membershipStatus !== 'active' || !existingMembership.isDefault) {
        await db
            .update(userBusinessMemberships)
            .set({
                membershipStatus: 'active',
                isDefault: true,
            })
            .where(eq(userBusinessMemberships.id, existingMembership.id));
    }

    return {
        id: defaultUnit.id,
        code: defaultUnit.code as BusinessScopeType,
    };
}

async function ensureDefaultRoleAssignment(userId: string, businessUnitId: string | null): Promise<void> {
    const existingAssignments = await db
        .select({
            id: userRoleAssignments.id,
        })
        .from(userRoleAssignments)
        .where(
            and(
                eq(userRoleAssignments.userId, userId),
                businessUnitId
                    ? or(isNull(userRoleAssignments.businessUnitId), eq(userRoleAssignments.businessUnitId, businessUnitId))
                    : isNull(userRoleAssignments.businessUnitId),
            ),
        )
        .limit(1);

    if (existingAssignments.length > 0) {
        return;
    }

    const operatorRole = await ensureOperatorRole();

    if (!operatorRole) {
        return;
    }

    await db.insert(userRoleAssignments).values({
        userId,
        roleId: operatorRole.id,
        businessUnitId,
    });
}

async function syncGhostMembershipsAndRoles(canonicalUserId: string, email: string): Promise<void> {
    if (!email) {
        return;
    }

    const ghostUsers = await db
        .select({
            id: users.id,
        })
        .from(users)
        .where(
            and(
                eq(users.email, email),
                isNull(users.larkOpenId),
                isNull(users.deletedAt),
            ),
        );

    if (ghostUsers.length === 0) {
        return;
    }

    const [canonicalRoleRows, canonicalMembershipRows] = await Promise.all([
        db
            .select({
                roleId: userRoleAssignments.roleId,
                businessUnitId: userRoleAssignments.businessUnitId,
            })
            .from(userRoleAssignments)
            .where(eq(userRoleAssignments.userId, canonicalUserId)),
        db
            .select({
                id: userBusinessMemberships.id,
                businessUnitId: userBusinessMemberships.businessUnitId,
                membershipStatus: userBusinessMemberships.membershipStatus,
                isDefault: userBusinessMemberships.isDefault,
            })
            .from(userBusinessMemberships)
            .where(eq(userBusinessMemberships.userId, canonicalUserId)),
    ]);

    const canonicalRoleKeys = new Set(
        canonicalRoleRows.map((row) => `${row.roleId}:${row.businessUnitId ?? 'global'}`),
    );
    const canonicalMembershipByBusinessUnitId = new Map(
        canonicalMembershipRows.map((row) => [row.businessUnitId, row]),
    );

    for (const ghostUser of ghostUsers) {
        const [ghostRoleRows, ghostMembershipRows] = await Promise.all([
            db
                .select({
                    roleId: userRoleAssignments.roleId,
                    businessUnitId: userRoleAssignments.businessUnitId,
                    grantedByUserId: userRoleAssignments.grantedByUserId,
                    expiresAt: userRoleAssignments.expiresAt,
                })
                .from(userRoleAssignments)
                .where(eq(userRoleAssignments.userId, ghostUser.id)),
            db
                .select({
                    businessUnitId: userBusinessMemberships.businessUnitId,
                    membershipStatus: userBusinessMemberships.membershipStatus,
                    isDefault: userBusinessMemberships.isDefault,
                })
                .from(userBusinessMemberships)
                .where(eq(userBusinessMemberships.userId, ghostUser.id)),
        ]);

        for (const roleRow of ghostRoleRows) {
            const roleKey = `${roleRow.roleId}:${roleRow.businessUnitId ?? 'global'}`;
            if (canonicalRoleKeys.has(roleKey)) {
                continue;
            }

            await db.insert(userRoleAssignments).values({
                userId: canonicalUserId,
                roleId: roleRow.roleId,
                businessUnitId: roleRow.businessUnitId,
                grantedByUserId: roleRow.grantedByUserId,
                expiresAt: roleRow.expiresAt,
            });

            canonicalRoleKeys.add(roleKey);
        }

        for (const membershipRow of ghostMembershipRows) {
            const existingMembership = canonicalMembershipByBusinessUnitId.get(membershipRow.businessUnitId);

            if (!existingMembership) {
                await db.insert(userBusinessMemberships).values({
                    userId: canonicalUserId,
                    businessUnitId: membershipRow.businessUnitId,
                    membershipStatus: membershipRow.membershipStatus,
                    isDefault: membershipRow.isDefault,
                });

                canonicalMembershipByBusinessUnitId.set(membershipRow.businessUnitId, {
                    id: '',
                    businessUnitId: membershipRow.businessUnitId,
                    membershipStatus: membershipRow.membershipStatus,
                    isDefault: membershipRow.isDefault,
                });
                continue;
            }

            if (existingMembership.membershipStatus !== 'active' && membershipRow.membershipStatus === 'active') {
                await db
                    .update(userBusinessMemberships)
                    .set({
                        membershipStatus: 'active',
                    })
                    .where(eq(userBusinessMemberships.id, existingMembership.id));
                existingMembership.membershipStatus = 'active';
            }

            if (!existingMembership.isDefault && membershipRow.isDefault) {
                await db
                    .update(userBusinessMemberships)
                    .set({
                        isDefault: true,
                    })
                    .where(eq(userBusinessMemberships.id, existingMembership.id));
                existingMembership.isDefault = true;
            }
        }
    }
}

async function finalizeBootstrap(userId: string, profile: BootstrapUserProfile) {
    const defaultBusinessMembership = await ensureDefaultBusinessMembership(userId);
    await ensureDefaultRoleAssignment(userId, defaultBusinessMembership.id);
    await issueSession(userId, defaultBusinessMembership.code);
    await setActiveBusinessScopeCookie(defaultBusinessMembership.code);

    return {
        success: true,
        user: {
            id: userId,
            displayName: profile.name,
            email: profile.email,
        },
        activeBusinessScope: defaultBusinessMembership.code,
    };
}

export async function bootstrapUser(profile: BootstrapUserProfile) {
    const now = new Date();

    const [existingByOpenId] = await db
        .select({
            id: users.id,
        })
        .from(users)
        .where(and(eq(users.larkOpenId, profile.openId), isNull(users.deletedAt)))
        .limit(1);

    if (existingByOpenId) {
        await syncGhostMembershipsAndRoles(existingByOpenId.id, profile.email);

        await db
            .update(users)
            .set({
                displayName: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl ?? null,
                status: 'active',
                lastLoginAt: now,
                updatedAt: now,
            })
            .where(eq(users.id, existingByOpenId.id));

        return finalizeBootstrap(existingByOpenId.id, profile);
    }

    const [existingByEmail] = await db
        .select({
            id: users.id,
        })
        .from(users)
        .where(
            and(
                eq(users.email, profile.email),
                isNull(users.larkOpenId),
                isNull(users.deletedAt),
            ),
        )
        .limit(1);

    if (existingByEmail) {
        await db
            .update(users)
            .set({
                larkOpenId: profile.openId,
                displayName: profile.name,
                avatarUrl: profile.avatarUrl ?? null,
                status: 'active',
                lastLoginAt: now,
                updatedAt: now,
            })
            .where(eq(users.id, existingByEmail.id));

        return finalizeBootstrap(existingByEmail.id, profile);
    }

    const [user] = await db
        .insert(users)
        .values({
            larkOpenId: profile.openId,
            displayName: profile.name,
            email: profile.email,
            avatarUrl: profile.avatarUrl ?? null,
            status: 'active',
            lastLoginAt: now,
        })
        .onConflictDoUpdate({
            target: users.larkOpenId,
            set: {
                displayName: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl ?? null,
                status: 'active',
                lastLoginAt: now,
                updatedAt: now,
            },
        })
        .returning({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
        });

    return finalizeBootstrap(user.id, {
        openId: profile.openId,
        name: user.displayName ?? profile.name,
        email: user.email ?? profile.email,
        avatarUrl: profile.avatarUrl ?? null,
    });
}
