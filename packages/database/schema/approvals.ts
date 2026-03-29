import { pgTable, text, timestamp, boolean, uuid, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { businessUnits } from './business-units';
import { users } from './users';
import { deals } from './sales';

// ─── 承認ルート設定 ──────────────────────────────────────────────────────
export const approvalRoutes = pgTable('approval_routes', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    approvalType: text('approval_type').notNull(), // PRE_MEETING | ESTIMATE_PRESENTATION | TECH_REVIEW
    routeName: text('route_name').notNull(),
    approverUserId: uuid('approver_user_id').notNull().references(() => users.id),
    routeOrder: integer('route_order').notNull().default(1),
    allowSelfApproval: boolean('allow_self_approval').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    conditions: jsonb('conditions'), // 案件種別/金額等の分岐条件
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    businessUnitTypeIdx: index('approval_routes_business_unit_type_idx')
        .on(table.businessUnitId, table.approvalType),
}));

// ─── 承認申請 ────────────────────────────────────────────────────────────
export const approvalRequests = pgTable('approval_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    approvalType: text('approval_type').notNull(), // PRE_MEETING | ESTIMATE_PRESENTATION
    approvalStatus: text('approval_status').notNull().default('PENDING'),
        // PENDING | APPROVED | REJECTED | RETURNED | EXPIRED
    applicantUserId: uuid('applicant_user_id').notNull().references(() => users.id),
    approverUserId: uuid('approver_user_id').references(() => users.id),
    appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }),
    meetingDate: timestamp('meeting_date', { withTimezone: true }), // 商談日（日時）
    documentUrl: text('document_url'), // 資料URL
    decisionComment: text('decision_comment'),
    expiryReason: text('expiry_reason'),
    snapshotData: jsonb('snapshot_data'), // 申請時点のスナップショット
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    dealIdx: index('approval_requests_deal_idx').on(table.dealId),
    applicantIdx: index('approval_requests_applicant_idx').on(table.applicantUserId),
    approverIdx: index('approval_requests_approver_idx').on(table.approverUserId),
    statusIdx: index('approval_requests_status_idx').on(table.approvalStatus),
    businessUnitTypeIdx: index('approval_requests_business_unit_type_idx')
        .on(table.businessUnitId, table.approvalType),
    deadlineIdx: index('approval_requests_deadline_idx').on(table.deadlineAt),
}));

// ─── 承認チェック項目 ────────────────────────────────────────────────────
export const approvalCheckItems = pgTable('approval_check_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    approvalRequestId: uuid('approval_request_id').notNull()
        .references(() => approvalRequests.id, { onDelete: 'cascade' }),
    itemCode: text('item_code').notNull(),
        // VALUE_SEPARATION | OPTION_SCOPE | COST_CASHFLOW | MAINTENANCE_AGREEMENT
    inputValue: text('input_value'),       // 入力値・説明内容
    checkResult: boolean('check_result'),  // チェック結果
    comment: text('comment'),
    evidenceFileUrl: text('evidence_file_url'),
    customerReaction: text('customer_reaction'), // 顧客反応/理解状況
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    requestIdx: index('approval_check_items_request_idx').on(table.approvalRequestId),
}));
