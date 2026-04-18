import { pgTable, text, timestamp, uuid, numeric, date, jsonb, index, integer, unique } from 'drizzle-orm/pg-core';
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
}, (table) => ({
    businessUnitDateIdx: index('ddm_business_unit_date_idx').on(table.businessUnitId, table.metricDate),
    metricKeyIdx: index('ddm_metric_key_idx').on(table.metricKey),
}));

// ─── 会社目標（年間/半期/四半期/月間） ────────────────────────────────────────
// periodType: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY'
// periodKey:
//   ANNUAL      → 'YYYY'         例: '2025'
//   SEMI_ANNUAL → 'YYYY-HN'      例: '2025-H1' / '2025-H2'
//   QUARTERLY   → 'YYYY-QN'      例: '2025-Q1' .. '2025-Q4'
//   MONTHLY     → 'YYYY-MM'      例: '2025-01'
export const businessGoals = pgTable('business_goals', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    periodType: text('period_type').notNull(),
    periodKey: text('period_key').notNull(),
    revenueTarget: numeric('revenue_target', { precision: 18, scale: 2 }),
    grossProfitTarget: numeric('gross_profit_target', { precision: 18, scale: 2 }),
    contractCountTarget: integer('contract_count_target'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
}, (table) => ({
    uniqueBuPeriod: unique('business_goals_bu_period_unique').on(
        table.businessUnitId, table.periodType, table.periodKey
    ),
    buIdx: index('business_goals_bu_idx').on(table.businessUnitId),
}));

// ─── AI 週次サマリー ──────────────────────────────────────────────────────────
// summaryType: 'PERSONAL' | 'TEAM'
// generationStatus: 'PENDING' | 'COMPLETED' | 'FAILED'
export const aiWeeklySummaries = pgTable('ai_weekly_summaries', {
    id: uuid('id').primaryKey().defaultRandom(),
    summaryType: text('summary_type').notNull(), // 'PERSONAL' | 'TEAM'
    businessUnitId: uuid('business_unit_id').references(() => businessUnits.id),
    targetUserId: uuid('target_user_id').references(() => users.id), // PERSONAL 時のみ設定
    weekStartDate: date('week_start_date').notNull(), // 週の月曜日
    weekEndDate: date('week_end_date').notNull(),     // 週の日曜日
    summaryBody: text('summary_body'),
    modelId: text('model_id'),           // 使用したモデル ID (env: AI_SUMMARY_MODEL)
    promptVersion: text('prompt_version'), // プロンプトのバージョン管理用
    generationStatus: text('generation_status').notNull().default('PENDING'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0).notNull(),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    generatedAt: timestamp('generated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    weekUserIdx: index('ai_weekly_summaries_week_user_idx').on(
        table.weekStartDate, table.targetUserId
    ),
    weekTeamIdx: index('ai_weekly_summaries_week_team_idx').on(
        table.weekStartDate, table.summaryType, table.businessUnitId
    ),
    statusIdx: index('ai_weekly_summaries_status_idx').on(table.generationStatus),
}));
