import { pgTable, varchar, timestamp, primaryKey, uuid, text, boolean, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { businessUnits } from './business-units';

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(), // e.g. SUPER_ADMIN
    name: text('name').notNull(),
    moduleKey: text('module_key'),
    description: text('description'),
    isSystemRole: boolean('is_system_role').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userRoleAssignments = pgTable('user_role_assignments', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    roleId: uuid('role_id').notNull().references(() => roles.id),
    businessUnitId: uuid('business_unit_id').references(() => businessUnits.id),
    grantedByUserId: uuid('granted_by_user_id').references(() => users.id),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
    userIdx: index('ura_user_idx').on(table.userId),
    roleIdx: index('ura_role_idx').on(table.roleId),
    userRoleIdx: index('ura_user_role_idx').on(table.userId, table.roleId),
}));

export const userBusinessMemberships = pgTable('user_business_memberships', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    membershipStatus: text('membership_status').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    receiveAiSummary: boolean('receive_ai_summary').default(true).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index('ubm_user_idx').on(table.userId),
    businessUnitIdx: index('ubm_business_unit_idx').on(table.businessUnitId),
    userBusinessUnitIdx: index('ubm_user_business_unit_idx').on(table.userId, table.businessUnitId),
}));
