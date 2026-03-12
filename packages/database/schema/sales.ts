import { pgTable, text, timestamp, boolean, uuid, integer, numeric, date, jsonb } from 'drizzle-orm/pg-core';
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
});

export const pipelines = pgTable('pipelines', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
});

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
    nextActionContent: text('next_action_content'),
    dealAttributes: jsonb('deal_attributes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const dealStageHistory = pgTable('deal_stage_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    fromStageId: uuid('from_stage_id').references(() => pipelineStages.id),
    toStageId: uuid('to_stage_id').notNull().references(() => pipelineStages.id),
    changedByUserId: uuid('changed_by_user_id').references(() => users.id),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
    changeNote: text('change_note'),
    snapshotAmount: numeric('snapshot_amount', { precision: 18, scale: 2 }),
});

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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ─── JET（節水事業）: 契約活動記録 ───────────────────────────────────────────
export const contractActivities = pgTable('contract_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id').notNull().references(() => contracts.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    activityType: text('activity_type').notNull(), // VISIT | CALL | EMAIL | INTERNAL | OTHER
    activityDate: date('activity_date').notNull(),
    summary: text('summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dealActivities = pgTable('deal_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    activityType: text('activity_type').notNull(), // VISIT | ONLINE | CALL | EMAIL | OTHER
    activityDate: date('activity_date').notNull(),
    summary: text('summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
