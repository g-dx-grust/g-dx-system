import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';
import { companies } from './companies';
import { contacts } from './contacts';
import { deals } from './sales';
import { callTargets } from './calls';

export const tasks = pgTable('tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    companyId: uuid('company_id').references(() => companies.id),
    contactId: uuid('contact_id').references(() => contacts.id),
    dealId: uuid('deal_id').references(() => deals.id),
    callTargetId: uuid('call_target_id').references(() => callTargets.id),
    assignedUserId: uuid('assigned_user_id').notNull().references(() => users.id),
    createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),
    taskType: text('task_type').notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    assignedUserIdx: index('tasks_assigned_user_idx').on(table.assignedUserId),
    businessUnitIdx: index('tasks_business_unit_idx').on(table.businessUnitId),
    dealIdx: index('tasks_deal_idx').on(table.dealId),
    companyIdx: index('tasks_company_idx').on(table.companyId),
    statusIdx: index('tasks_status_idx').on(table.status),
    dueAtIdx: index('tasks_due_at_idx').on(table.dueAt),
}));
