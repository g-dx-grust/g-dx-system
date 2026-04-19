import { db } from '@g-dx/database';
import { businessUnits, roles, userRoleAssignments } from '@g-dx/database/schema';
import { and, eq, gt, inArray, isNull, or } from 'drizzle-orm';
import type { BusinessScopeType } from '@g-dx/contracts';
import { Role } from '@g-dx/contracts';

// SUPER_ADMIN と TECH ロールを持つユーザーは活動ダッシュボードから除外
const EXCLUDED_ROLE_CODES = [Role.SUPER_ADMIN, Role.TECH];

export async function getExcludedMemberIds(scope: BusinessScopeType): Promise<Set<string>> {
    const [businessUnit] = await db
        .select({ id: businessUnits.id })
        .from(businessUnits)
        .where(eq(businessUnits.code, scope))
        .limit(1);

    if (!businessUnit) return new Set();

    const rows = await db
        .select({ userId: userRoleAssignments.userId })
        .from(userRoleAssignments)
        .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
        .where(
            and(
                inArray(roles.code, EXCLUDED_ROLE_CODES),
                or(
                    isNull(userRoleAssignments.businessUnitId),
                    eq(userRoleAssignments.businessUnitId, businessUnit.id),
                ),
                or(
                    isNull(userRoleAssignments.expiresAt),
                    gt(userRoleAssignments.expiresAt, new Date()),
                ),
            ),
        );

    return new Set(rows.map((r) => r.userId));
}
