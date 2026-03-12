import { pgTable, text, timestamp, varchar, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    larkOpenId: text('lark_open_id').unique(),
    larkUnionId: text('lark_union_id'),
    larkTenantKey: text('lark_tenant_key'),
    email: text('email'), // Using text as citext requires an extension which may not be present by default
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    employeeCode: text('employee_code'),
    status: text('status'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
