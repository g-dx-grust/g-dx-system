import { pgTable, text, timestamp, boolean, uuid, integer, numeric, date, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';
import { companies } from './companies';
import { contacts } from './contacts';
import { masterJetCreditStatus, masterJetDealStatus, masterJetStatus2 } from './masters';

// ─── JET（節水事業）: 施設管理 ─────────────────────────────────────────────
export const facilities = pgTable('facilities', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    name: text('name').notNull(),
    postalCode: text('postal_code'),
    prefecture: text('prefecture'),
    city: text('city'),
    addressLine1: text('address_line1'),
    mainPhone: text('main_phone'),
    managerName: text('manager_name'),
    memo: text('memo'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    companyIdx: index('facilities_company_idx').on(table.companyId),
}));

export const pipelines = pgTable('pipelines', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    businessUnitIdx: index('pipelines_business_unit_idx').on(table.businessUnitId),
}));

export const pipelineStages = pgTable('pipeline_stages', {
    id: uuid('id').primaryKey().defaultRandom(),
    pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
    stageKey: text('stage_key').notNull(),
    name: text('name').notNull(),
    stageOrder: integer('stage_order').notNull(),
    probabilityPct: numeric('probability_pct', { precision: 5, scale: 2 }),
    isClosedWon: boolean('is_closed_won').default(false).notNull(),
    isClosedLost: boolean('is_closed_lost').default(false).notNull(),
    slaDays: integer('sla_days'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    pipelineIdx: index('pipeline_stages_pipeline_idx').on(table.pipelineId),
}));

export const deals = pgTable('deals', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    primaryContactId: uuid('primary_contact_id').references(() => contacts.id),
    ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
    pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
    currentStageId: uuid('current_stage_id').notNull().references(() => pipelineStages.id),
    title: text('title').notNull(),
    dealStatus: text('deal_status').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }),
    currencyCode: text('currency_code').default('JPY').notNull(),
    expectedCloseDate: date('expected_close_date'),
    wonAt: timestamp('won_at', { withTimezone: true }),
    lostAt: timestamp('lost_at', { withTimezone: true }),
    lossReasonCode: text('loss_reason_code'),
    sourceCode: text('source_code'),
    acquisitionMethod: text('acquisition_method'),
    // JET事業部（WATER_SAVING）のみで使用するフィールド
    jetDealStatus: text('jet_deal_status').references(() => masterJetDealStatus.statusCode),
    jetCreditStatus: text('jet_credit_status').references(() => masterJetCreditStatus.creditProgressCode),
    jetStatus2: text('jet_status2').references(() => masterJetStatus2.status2Code),
    nextActionDate: date('next_action_date'),
    nextActionTime: text('next_action_time'), // HH:MM (JST)
    nextActionContent: text('next_action_content'),
    larkChatId: text('lark_chat_id'),
    larkCalendarId: text('lark_calendar_id'),
    dealAttributes: jsonb('deal_attributes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    businessUnitIdx: index('deals_business_unit_idx').on(table.businessUnitId),
    companyIdx: index('deals_company_idx').on(table.companyId),
    ownerUserIdx: index('deals_owner_user_idx').on(table.ownerUserId),
    pipelineIdx: index('deals_pipeline_idx').on(table.pipelineId),
    currentStageIdx: index('deals_current_stage_idx').on(table.currentStageId),
    updatedAtIdx: index('deals_updated_at_idx').on(table.updatedAt),
    companyDeletedIdx: index('deals_company_deleted_idx').on(table.companyId, table.deletedAt),
}));

export const dealStageHistory = pgTable('deal_stage_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    fromStageId: uuid('from_stage_id').references(() => pipelineStages.id),
    toStageId: uuid('to_stage_id').notNull().references(() => pipelineStages.id),
    changedByUserId: uuid('changed_by_user_id').references(() => users.id),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
    changeNote: text('change_note'),
    snapshotAmount: numeric('snapshot_amount', { precision: 18, scale: 2 }),
}, (table) => ({
    dealIdx: index('deal_stage_history_deal_idx').on(table.dealId),
    changedAtIdx: index('deal_stage_history_changed_at_idx').on(table.changedAt),
}));

export const contracts = pgTable('contracts', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    dealId: uuid('deal_id').references(() => deals.id),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    primaryContactId: uuid('primary_contact_id').references(() => contacts.id),
    ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
    contractNumber: text('contract_number'),
    title: text('title').notNull(),
    contractStatus: text('contract_status').notNull().default('CONTRACTED'),
    amount: numeric('amount', { precision: 18, scale: 2 }),
    currencyCode: text('currency_code').default('JPY').notNull(),
    contractDate: date('contract_date'),
    invoiceDate: date('invoice_date'),
    paymentDate: date('payment_date'),
    serviceStartDate: date('service_start_date'),
    serviceEndDate: date('service_end_date'),
    memo: text('memo'),
    // JET（節水事業）専用フィールド
    facilityId: uuid('facility_id').references(() => facilities.id),
    terminationDate: date('termination_date'),
    rebateRequired: boolean('rebate_required'),
    rebateAmount: numeric('rebate_amount', { precision: 18, scale: 2 }),
    rebateStatus: text('rebate_status'), // PENDING | PROCESSED | NOT_APPLICABLE
    rebatePaidAt: date('rebate_paid_at'),
    gdxReferralPossible: boolean('gdx_referral_possible'),
    gdxReferralStatus: text('gdx_referral_status'), // POSSIBLE | REFERRED | NOT_APPLICABLE
    gdxReferralDate: date('gdx_referral_date'),
    gdxReferralNote: text('gdx_referral_note'),
    // G-DX営業管理 拡張フィールド
    fsInChargeUserId: uuid('fs_in_charge_user_id').references(() => users.id),
    isInChargeUserId: uuid('is_in_charge_user_id').references(() => users.id),
    productCode: text('product_code'),
    hasSubsidy: boolean('has_subsidy'),
    licensePlanCode: text('license_plan_code'),
    freeSupportMonths: integer('free_support_months'),
    enterpriseLicenseCount: integer('enterprise_license_count'),
    proLicenseCount: integer('pro_license_count'),
    a2LicenseCount: integer('a2_license_count'),
    // CS（伴走支援）管理フィールド
    csPhase: text('cs_phase'), // 現在の伴走フェーズ
    regularMeetingWeekday: text('regular_meeting_weekday'), // 定例曜日: MON|TUE|WED|THU|FRI
    regularMeetingTime: text('regular_meeting_time'), // 定例時間 (HH:MM)
    regularMeetingFrequency: text('regular_meeting_frequency'), // WEEKLY|BIWEEKLY|MONTHLY
    totalSessionCount: integer('total_session_count').default(0).notNull(), // 累計実施回数
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    businessUnitIdx: index('contracts_business_unit_idx').on(table.businessUnitId),
    companyIdx: index('contracts_company_idx').on(table.companyId),
    dealIdx: index('contracts_deal_idx').on(table.dealId),
    ownerUserIdx: index('contracts_owner_user_idx').on(table.ownerUserId),
}));

// ─── 契約活動記録（伴走支援CS用）────────────────────────────────────────────
export const contractActivities = pgTable('contract_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id').notNull().references(() => contracts.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    activityType: text('activity_type').notNull(), // REGULAR(定例) | SPOT(急遽) | CALL | EMAIL | INTERNAL | OTHER
    initiatedBy: text('initiated_by'), // CLIENT(顧客から) | US(弊社から)
    activityDate: date('activity_date').notNull(),
    summary: text('summary'),
    sessionNumber: integer('session_number'), // 何回目の実施
    progressStatus: text('progress_status'), // CS進捗ステータス
    larkMeetingUrl: text('lark_meeting_url'),
    nextSessionType: text('next_session_type'), // REGULAR | SPOT
    nextSessionDate: date('next_session_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    contractIdx: index('contract_activities_contract_idx').on(table.contractId),
    businessUnitIdx: index('contract_activities_business_unit_idx').on(table.businessUnitId),
}));

export const dealActivities = pgTable('deal_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    activityType: text('activity_type').notNull(), // VISIT | ONLINE | CALL | EMAIL | OTHER
    activityDate: date('activity_date').notNull(),
    summary: text('summary'),
    meetingCount: integer('meeting_count').notNull().default(0),
    visitCategory: text('visit_category'), // NEW | REPEAT
    targetType: text('target_type'), // INDIVIDUAL | CORPORATE
    isNegotiation: boolean('is_negotiation').notNull().default(false),
    negotiationOutcome: text('negotiation_outcome'), // HIGH | MEDIUM | LOW | NONE
    competitorInfo: text('competitor_info'),
    larkMeetingUrl: text('lark_meeting_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    dealIdx: index('deal_activities_deal_idx').on(table.dealId),
    businessUnitIdx: index('deal_activities_business_unit_idx').on(table.businessUnitId),
}));

// ─── アライアンス活動記録 ─────────────────────────────────────────────────────
export const allianceActivities = pgTable('alliance_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    allianceId: uuid('alliance_id').notNull().references(() => alliances.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    activityType: text('activity_type').notNull(), // VISIT | ONLINE | CALL | EMAIL | OTHER
    activityDate: date('activity_date').notNull(),
    summary: text('summary'),
    larkMeetingUrl: text('lark_meeting_url'),
    nextActionDate: date('next_action_date'),
    nextActionContent: text('next_action_content'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    allianceIdx: index('alliance_activities_alliance_idx').on(table.allianceId),
    businessUnitIdx: index('alliance_activities_business_unit_idx').on(table.businessUnitId),
}));

// ─── アライアンス管理 ────────────────────────────────────────────────────────
export const alliances = pgTable('alliances', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    name: text('name').notNull(),
    allianceType: text('alliance_type').notNull().default('COMPANY'),
    contactPersonName: text('contact_person_name'),
    contactPersonRole: text('contact_person_role'),
    contactPersonEmail: text('contact_person_email'),
    contactPersonPhone: text('contact_person_phone'),
    agreementSummary: text('agreement_summary'),
    relationshipStatus: text('relationship_status').notNull().default('PROSPECT'),
    notes: text('notes'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    businessUnitIdx: index('alliances_business_unit_idx').on(table.businessUnitId),
    statusIdx: index('alliances_status_idx').on(table.relationshipStatus),
}));

export const allianceDealLinks = pgTable('alliance_deal_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    allianceId: uuid('alliance_id').notNull().references(() => alliances.id),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    referralType: text('referral_type').notNull().default('INTRODUCER'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    uniqueAllianceDeal: unique('alliance_deal_links_alliance_id_deal_id_unique').on(table.allianceId, table.dealId),
    allianceIdx: index('alliance_deal_links_alliance_idx').on(table.allianceId),
    dealIdx: index('alliance_deal_links_deal_idx').on(table.dealId),
}));

// ─── 個人 KPI 目標 ───────────────────────────────────────────────────────────
export const userKpiTargets = pgTable('user_kpi_targets', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    targetMonth: text('target_month').notNull(), // format: 'YYYY-MM'
    callTarget: integer('call_target').default(0).notNull(),
    visitTarget: integer('visit_target').default(0).notNull(),
    newVisitTarget: integer('new_visit_target').default(0).notNull(),
    appointmentTarget: integer('appointment_target').default(0).notNull(),
    negotiationTarget: integer('negotiation_target').default(0).notNull(),
    newNegotiationTarget: integer('new_negotiation_target').default(0).notNull(),
    contractTarget: integer('contract_target').default(0).notNull(),
    revenueTarget: numeric('revenue_target', { precision: 18, scale: 2 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    uniqueUserMonthScope: unique('user_kpi_targets_user_id_business_unit_id_target_month_unique')
        .on(table.userId, table.businessUnitId, table.targetMonth),
}));
