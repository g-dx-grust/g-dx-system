export const Role = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    OPERATOR: 'OPERATOR',
    VIEWER: 'VIEWER',
    IS_MEMBER: 'IS_MEMBER', // IS担当
    TECH: 'TECH',           // 技術部門
} as const;

export type RoleType = typeof Role[keyof typeof Role];

export const BusinessScope = {
    LARK_SUPPORT: 'LARK_SUPPORT',
    WATER_SAVING: 'WATER_SAVING',
} as const;

export type BusinessScopeType = typeof BusinessScope[keyof typeof BusinessScope];

export const PermissionLevel = {
    YES: 'Y',
    CONDITIONAL: 'C',
    NO: 'N',
} as const;

export type PermissionLevelType = typeof PermissionLevel[keyof typeof PermissionLevel];
