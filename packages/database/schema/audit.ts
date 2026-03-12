import { pgTable, text, timestamp, uuid, jsonb, bigint } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    tableName: text('table_name').notNull(),
    recordPk: text('record_pk').notNull(),
    action: text('action').notNull(),
    businessUnitId: uuid('business_unit_id').references(() => businessUnits.id),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    sourceType: text('source_type').notNull(),
    requestId: text('request_id'),
    beforeData: jsonb('before_data'),
    afterData: jsonb('after_data'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});
