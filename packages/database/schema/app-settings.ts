import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const appSettings = pgTable('app_settings', {
    key: text('key').primaryKey(),
    value: text('value'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
}, (table) => ({
    updatedAtIdx: index('app_settings_updated_at_idx').on(table.updatedAt),
}));
