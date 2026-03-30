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
                eq(userBusinessMemberships.businessUnitId, defaultUnit.id)
            )
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
                    : isNull(userRoleAssignments.businessUnitId)
            )
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

export async function bootstrapUser(profile: BootstrapUserProfile) {
    // 管理画面で larkOpenId なしで作成されたユーザーと Lark ログインユーザーの重複防止:
    // まず email で既存ユーザーを検索し、larkOpenId が未設定であれば紐付けてから upsert する。
    const [existingByEmail] = await db
        .select({ id: users.id, larkOpenId: users.larkOpenId })
        .from(users)
        .where(
            and(
                eq(users.email, profile.email),
                isNull(users.larkOpenId),
                isNull(users.deletedAt),
            )
        )
        .limit(1);

    if (existingByEmail) {
        // 管理画面で作成済みのユーザーに larkOpenId を紐付ける（ghost ユーザー解消）
        await db
            .update(users)
            .set({
                larkOpenId: profile.openId,
                displayName: profile.name,
                avatarUrl: profile.avatarUrl ?? null,
                status: 'active',
                lastLoginAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(users.id, existingByEmail.id));

        const defaultBusinessMembership = await ensureDefaultBusinessMembership(existingByEmail.id);
        await ensureDefaultRoleAssignment(existingByEmail.id, defaultBusinessMembership.id);
        await issueSession(existingByEmail.id, defaultBusinessMembership.code);
        await setActiveBusinessScopeCookie(defaultBusinessMembership.code);

        return {
            success: true,
            user: { id: existingByEmail.id, displayName: profile.name, email: profile.email },
            activeBusinessScope: defaultBusinessMembership.code,
        };
    }

    const [user] = await db
        .insert(users)
        .values({
            larkOpenId: profile.openId,
            displayName: profile.name,
            email: profile.email,
            avatarUrl: profile.avatarUrl ?? null,
            status: 'active',
            lastLoginAt: new Date(),
        })
        .onConflictDoUpdate({
            target: users.larkOpenId,
            set: {
                displayName: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl ?? null,
                status: 'active',
                lastLoginAt: new Date(),
                updatedAt: new Date(),
            },
        })
        .returning({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
        });

    const defaultBusinessMembership = await ensureDefaultBusinessMembership(user.id);
    await ensureDefaultRoleAssignment(user.id, defaultBusinessMembership.id);
    await issueSession(user.id, defaultBusinessMembership.code);
    await setActiveBusinessScopeCookie(defaultBusinessMembership.code);

    return {
        success: true,
        user,
        activeBusinessScope: defaultBusinessMembership.code,
    };
}
