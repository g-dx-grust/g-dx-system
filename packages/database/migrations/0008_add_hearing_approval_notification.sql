-- Migration: Phase 1 - 商談記録強化・承認フロー・通知・流入経路履歴
-- Requirements: G-DX_追加機能_要件定義書_draft1

-- ═══════════════════════════════════════════════════════════════════════
-- 1. 商談記録（ヒアリング5項目）
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hearing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),

    -- 1. 現状と理想のギャップ
    gap_current_situation TEXT,          -- 現行ツールの分断状況、時間/金額コスト
    gap_ideal_state TEXT,                -- 理想状態
    gap_effect_goal TEXT,                -- 効果目標
    gap_agreement_memo TEXT,             -- 目的ベースの合意メモ
    gap_completed BOOLEAN NOT NULL DEFAULT false,

    -- 2. 導入対象者とID数
    target_user_segments TEXT,           -- オフィス/現場の区分、利用者属性
    target_id_estimate INTEGER,          -- 必要ID概算
    target_plan_candidate TEXT,          -- 料金プラン候補
    target_completed BOOLEAN NOT NULL DEFAULT false,

    -- 3. 標準/オプション境界
    scope_is_standard BOOLEAN,           -- 標準プラン範囲か
    scope_option_requirements TEXT,      -- 追加開発・連携要件
    scope_tech_liaison_flag BOOLEAN NOT NULL DEFAULT false,  -- 技術連携フラグ
    scope_completed BOOLEAN NOT NULL DEFAULT false,

    -- 4. 助成金・補助金適格性
    subsidy_insurance_status TEXT,       -- 雇用保険加入状況
    subsidy_company_category TEXT,       -- 企業区分
    subsidy_applicable_program TEXT,     -- 適用見込み制度
    subsidy_labor_consultant_ok BOOLEAN, -- 社労士連携可否
    subsidy_completed BOOLEAN NOT NULL DEFAULT false,

    -- 5. 決裁フローとタイムライン
    decision_approver_info TEXT,         -- 決裁者情報
    decision_timeline DATE,             -- 意思決定予定日
    decision_next_meeting_attendee TEXT, -- 次回同席有無
    decision_criteria TEXT,             -- 判断基準
    decision_next_plan TEXT,            -- 次回商談計画
    decision_completed BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS hearing_records_deal_idx ON hearing_records(deal_id);
CREATE INDEX IF NOT EXISTS hearing_records_business_unit_idx ON hearing_records(business_unit_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. 承認ルート設定
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS approval_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    approval_type TEXT NOT NULL,         -- PRE_MEETING | ESTIMATE_PRESENTATION | TECH_REVIEW
    route_name TEXT NOT NULL,
    approver_user_id UUID NOT NULL REFERENCES users(id),
    route_order INTEGER NOT NULL DEFAULT 1,
    allow_self_approval BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    conditions JSONB,                    -- 案件種別/金額等の分岐条件
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approval_routes_business_unit_type_idx
    ON approval_routes(business_unit_id, approval_type);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. 承認申請
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    deal_id UUID NOT NULL REFERENCES deals(id),
    approval_type TEXT NOT NULL,         -- PRE_MEETING | ESTIMATE_PRESENTATION
    approval_status TEXT NOT NULL DEFAULT 'PENDING',
        -- PENDING | APPROVED | REJECTED | RETURNED | EXPIRED
    applicant_user_id UUID NOT NULL REFERENCES users(id),
    approver_user_id UUID REFERENCES users(id),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ,
    meeting_date DATE,                   -- 面談日（事前準備承認用）
    decision_comment TEXT,
    expiry_reason TEXT,                  -- 失効理由
    snapshot_data JSONB,                 -- 申請時点のスナップショット
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approval_requests_deal_idx ON approval_requests(deal_id);
CREATE INDEX IF NOT EXISTS approval_requests_applicant_idx ON approval_requests(applicant_user_id);
CREATE INDEX IF NOT EXISTS approval_requests_approver_idx ON approval_requests(approver_user_id);
CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON approval_requests(approval_status);
CREATE INDEX IF NOT EXISTS approval_requests_business_unit_type_idx
    ON approval_requests(business_unit_id, approval_type);
CREATE INDEX IF NOT EXISTS approval_requests_deadline_idx ON approval_requests(deadline_at)
    WHERE approval_status = 'PENDING';

-- ═══════════════════════════════════════════════════════════════════════
-- 4. 承認チェック項目（スナップショット保持）
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS approval_check_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,             -- VALUE_SEPARATION | OPTION_SCOPE | COST_CASHFLOW | MAINTENANCE_AGREEMENT
    input_value TEXT,                    -- 入力値・説明内容
    check_result BOOLEAN,               -- チェック結果
    comment TEXT,                        -- コメント
    evidence_file_url TEXT,              -- 証跡ファイルURL
    customer_reaction TEXT,              -- 顧客反応/理解状況
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approval_check_items_request_idx
    ON approval_check_items(approval_request_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. 通知
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID REFERENCES business_units(id),
    recipient_user_id UUID NOT NULL REFERENCES users(id),
    notification_type TEXT NOT NULL,
        -- APPROVAL_REQUESTED | APPROVAL_APPROVED | APPROVAL_REJECTED
        -- APPROVAL_RETURNED | APPROVAL_DEADLINE | CRM_SYNC_FAILED
        -- AI_GENERATION_COMPLETE | AI_GENERATION_FAILED
    title TEXT NOT NULL,
    body TEXT,
    related_entity_type TEXT,            -- deal | approval_request | company
    related_entity_id UUID,
    link_url TEXT,                       -- アプリ内遷移先
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
    ON notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx
    ON notifications(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. 流入経路変更履歴
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lead_source_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    previous_lead_source_code TEXT,
    new_lead_source_code TEXT,
    changed_by_user_id UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    change_reason TEXT
);

CREATE INDEX IF NOT EXISTS lead_source_history_company_idx
    ON lead_source_history(company_id, changed_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 7. 会社テーブル拡張（流入経路の初回値保持）
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE company_business_profiles
    ADD COLUMN IF NOT EXISTS initial_lead_source_code TEXT,
    ADD COLUMN IF NOT EXISTS company_overview TEXT,
    ADD COLUMN IF NOT EXISTS business_description TEXT;

-- 既存データの初回値を現在値で埋める
UPDATE company_business_profiles
SET initial_lead_source_code = lead_source_code
WHERE initial_lead_source_code IS NULL AND lead_source_code IS NOT NULL;
