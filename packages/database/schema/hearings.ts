import { pgTable, text, timestamp, boolean, uuid, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';
import { deals } from './sales';
import { companies } from './companies';

// ─── 商談記録（ヒアリング5項目） ────────────────────────────────────────────
export const hearingRecords = pgTable('hearing_records', {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),

    // 1. 現状と理想のギャップ
    gapCurrentSituation: text('gap_current_situation'),
    gapIdealState: text('gap_ideal_state'),
    gapEffectGoal: text('gap_effect_goal'),
    gapAgreementMemo: text('gap_agreement_memo'),
    gapCompleted: boolean('gap_completed').notNull().default(false),

    // 2. 導入対象者とID数
    targetUserSegments: text('target_user_segments'),
    targetIdEstimate: integer('target_id_estimate'),
    targetPlanCandidate: text('target_plan_candidate'),
    targetCompleted: boolean('target_completed').notNull().default(false),

    // 3. 標準/オプション境界
    scopeIsStandard: boolean('scope_is_standard'),
    scopeOptionRequirements: text('scope_option_requirements'),
    scopeTechLiaisonFlag: boolean('scope_tech_liaison_flag').notNull().default(false),
    scopeCompleted: boolean('scope_completed').notNull().default(false),

    // 4. 助成金・補助金適格性
    subsidyInsuranceStatus: text('subsidy_insurance_status'),
    subsidyCompanyCategory: text('subsidy_company_category'),
    subsidyApplicableProgram: text('subsidy_applicable_program'),
    subsidyLaborConsultantOk: boolean('subsidy_labor_consultant_ok'),
    subsidyCompleted: boolean('subsidy_completed').notNull().default(false),

    // 5. 決裁フローとタイムライン
    decisionApproverInfo: text('decision_approver_info'),
    decisionTimeline: text('decision_timeline'), // date stored as text (YYYY-MM-DD)
    decisionNextMeetingAttendee: text('decision_next_meeting_attendee'),
    decisionCriteria: text('decision_criteria'),
    decisionNextPlan: text('decision_next_plan'),
    decisionCompleted: boolean('decision_completed').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
}, (table) => ({
    dealIdx: uniqueIndex('hearing_records_deal_idx').on(table.dealId),
    businessUnitIdx: index('hearing_records_business_unit_idx').on(table.businessUnitId),
}));

// ─── 流入経路変更履歴 ────────────────────────────────────────────────────
export const leadSourceHistory = pgTable('lead_source_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    previousLeadSourceCode: text('previous_lead_source_code'),
    newLeadSourceCode: text('new_lead_source_code'),
    changedByUserId: uuid('changed_by_user_id').notNull().references(() => users.id),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
    changeReason: text('change_reason'),
}, (table) => ({
    companyIdx: index('lead_source_history_company_idx').on(table.companyId),
}));
