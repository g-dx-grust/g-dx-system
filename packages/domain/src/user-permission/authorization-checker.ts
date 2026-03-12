import { RoleType, BusinessScopeType, PermissionKey, RolePermissionMatrix, PermissionLevel, PermissionLevelType } from '@g-dx/contracts';

export interface UserContext {
    userId: string;
    roles: RoleType[];
    businessScopes: BusinessScopeType[];
}

export class AuthorizationChecker {
    /**
     * Evaluates whether a user has permission to perform an action.
     * `allow = role_permission && business_scope_match`
     */
    static isAllowed(
        user: UserContext,
        permissionKey: PermissionKey,
        requiredBusinessScope?: BusinessScopeType
    ): boolean {
        // 1. Evaluate Role-based Permission
        let hasRolePermission = false;
        for (const role of user.roles) {
            const permissionLevel = RolePermissionMatrix[role][permissionKey];
            if (permissionLevel === PermissionLevel.YES || permissionLevel === PermissionLevel.CONDITIONAL) {
                hasRolePermission = true;
                break;
            }
        }

        if (!hasRolePermission) {
            return false;
        }

        // 2. Evaluate Business Scope Match
        if (requiredBusinessScope) {
            if (!user.businessScopes.includes(requiredBusinessScope)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Helper to determine conditionality. Returns true if the user's highest permission
     * for the action is CONDITIONAL.
     */
    static isConditional(user: UserContext, permissionKey: PermissionKey): boolean {
        let highestLevel: PermissionLevelType = PermissionLevel.NO;

        for (const role of user.roles) {
            const level = RolePermissionMatrix[role][permissionKey];
            if (level === PermissionLevel.YES) {
                return false; // If they have an unconditional YES, it's not conditional overall
            }
            if (level === PermissionLevel.CONDITIONAL) {
                highestLevel = PermissionLevel.CONDITIONAL;
            }
        }

        return highestLevel === PermissionLevel.CONDITIONAL;
    }
}
