import { pgTable, text, timestamp, uuid, jsonb, integer, index } from 'drizzle-orm/pg-core';

export const externalRecordLinks = pgTable('external_record_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(), // Polymorphic reference
    externalSystem: text('external_system').notNull(), // e.g. 'LARK_BASE'
    externalTableKey: text('external_table_key').notNull(),
    externalRecordId: text('external_record_id').notNull(),
    syncDirection: text('sync_direction').notNull(), // e.g. 'PULL', 'PUSH', 'TWO_WAY'
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastSyncHash: text('last_sync_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    entityIdx: index('erl_entity_idx').on(table.entityType, table.entityId),
    externalRecordIdx: index('erl_external_record_idx').on(table.externalSystem, table.externalRecordId),
}));

export const larkSyncJobs = pgTable('lark_sync_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    jobType: text('job_type').notNull(),
    direction: text('direction').notNull(),
    status: text('status').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    payload: jsonb('payload'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0).notNull(),
    runAfter: timestamp('run_after', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    statusIdx: index('lark_sync_jobs_status_idx').on(table.status),
    runAfterIdx: index('lark_sync_jobs_run_after_idx').on(table.runAfter),
}));
