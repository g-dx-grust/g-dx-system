import { pgTable, text, timestamp, boolean, uuid, index } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';

// ─── 通知 ────────────────────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').references(() => businessUnits.id),
    recipientUserId: uuid('recipient_user_id').notNull().references(() => users.id),
    notificationType: text('notification_type').notNull(),
        // APPROVAL_REQUESTED | APPROVAL_APPROVED | APPROVAL_REJECTED
        // APPROVAL_RETURNED | APPROVAL_DEADLINE | CRM_SYNC_FAILED
        // AI_GENERATION_COMPLETE | AI_GENERATION_FAILED
    title: text('title').notNull(),
    body: text('body'),
    relatedEntityType: text('related_entity_type'), // deal | approval_request | company
    relatedEntityId: uuid('related_entity_id'),
    linkUrl: text('link_url'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    recipientIdx: index('notifications_recipient_idx')
        .on(table.recipientUserId, table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));
