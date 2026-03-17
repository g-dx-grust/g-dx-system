import { pgTable, text, timestamp, boolean, uuid, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';
import { companies } from './companies';
import { contacts } from './contacts';
import { deals } from './sales';

export const callCampaigns = pgTable('call_campaigns', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    name: text('name').notNull(),
    status: text('status').notNull(),
    ownerUserId: uuid('owner_user_id').references(() => users.id),
    targetSourceType: text('target_source_type').notNull(),
    criteriaJsonb: jsonb('criteria_jsonb'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
}, (table) => ({
    businessUnitIdx: index('call_campaigns_business_unit_idx').on(table.businessUnitId),
}));

export const callTargets = pgTable('call_targets', {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').notNull().references(() => callCampaigns.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    contactId: uuid('contact_id').references(() => contacts.id),
    assignedUserId: uuid('assigned_user_id').references(() => users.id),
    phoneNumber: text('phone_number').notNull(),
    priority: integer('priority').default(0).notNull(),
    targetStatus: text('target_status').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    lastCallAt: timestamp('last_call_at', { withTimezone: true }),
    nextCallbackAt: timestamp('next_callback_at', { withTimezone: true }),
    targetAttributes: jsonb('target_attributes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    campaignIdx: index('call_targets_campaign_idx').on(table.campaignId),
    businessUnitIdx: index('call_targets_business_unit_idx').on(table.businessUnitId),
    companyIdx: index('call_targets_company_idx').on(table.companyId),
    assignedUserIdx: index('call_targets_assigned_user_idx').on(table.assignedUserId),
}));

export const callLogs = pgTable('call_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    callTargetId: uuid('call_target_id').references(() => callTargets.id),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    contactId: uuid('contact_id').references(() => contacts.id),
    dealId: uuid('deal_id').references(() => deals.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    providerCallId: text('provider_call_id'),
    direction: text('direction').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationSec: integer('duration_sec'),
    resultCode: text('result_code').notNull(),
    recordingUrl: text('recording_url'),
    summary: text('summary'),
    nextCallDatetime: timestamp('next_call_datetime', { withTimezone: true }),
    providerPayload: jsonb('provider_payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    businessUnitIdx: index('call_logs_business_unit_idx').on(table.businessUnitId),
    userIdx: index('call_logs_user_idx').on(table.userId),
    companyIdx: index('call_logs_company_idx').on(table.companyId),
    startedAtIdx: index('call_logs_started_at_idx').on(table.startedAt),
    dealIdx: index('call_logs_deal_idx').on(table.dealId),
}));
