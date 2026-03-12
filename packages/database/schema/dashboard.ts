import { pgTable, text, timestamp, uuid, numeric, date, jsonb } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';
import { pipelines, pipelineStages } from './sales';
import { callCampaigns } from './calls';

export const dashboardDailyMetrics = pgTable('dashboard_daily_metrics', {
    id: uuid('id').primaryKey().defaultRandom(),
    metricDate: date('metric_date').notNull(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    moduleKey: text('module_key').notNull(), // e.g. 'sales', 'calls'
    metricKey: text('metric_key').notNull(),
    ownerUserId: uuid('owner_user_id').references(() => users.id),
    pipelineId: uuid('pipeline_id').references(() => pipelines.id),
    stageId: uuid('stage_id').references(() => pipelineStages.id),
    campaignId: uuid('campaign_id').references(() => callCampaigns.id),
    metricValue: numeric('metric_value', { precision: 18, scale: 2 }).notNull(),
    dimensions: jsonb('dimensions'),
    aggregatedAt: timestamp('aggregated_at', { withTimezone: true }).defaultNow().notNull(),
});
