-- マイグレーション 0010: business_goals / ai_weekly_summaries テーブル追加
-- 実行前に必ずバックアップを取ること

-- ─── 会社目標テーブル ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "business_goals" (
    "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "business_unit_id"     UUID NOT NULL REFERENCES "business_units"("id"),
    "period_type"          TEXT NOT NULL,   -- 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY'
    "period_key"           TEXT NOT NULL,   -- 例: '2025', '2025-H1', '2025-Q1', '2025-01'
    "revenue_target"       NUMERIC(18, 2),
    "gross_profit_target"  NUMERIC(18, 2),
    "contract_count_target" INTEGER,
    "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_by_user_id"   UUID REFERENCES "users"("id"),
    CONSTRAINT "business_goals_bu_period_unique"
        UNIQUE ("business_unit_id", "period_type", "period_key")
);

CREATE INDEX IF NOT EXISTS "business_goals_bu_idx"
    ON "business_goals"("business_unit_id");

-- ─── AI 週次サマリーテーブル ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai_weekly_summaries" (
    "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "summary_type"        TEXT NOT NULL,        -- 'PERSONAL' | 'TEAM'
    "business_unit_id"    UUID REFERENCES "business_units"("id"),
    "target_user_id"      UUID REFERENCES "users"("id"),
    "week_start_date"     DATE NOT NULL,
    "week_end_date"       DATE NOT NULL,
    "summary_body"        TEXT,
    "model_id"            TEXT,
    "prompt_version"      TEXT,
    "generation_status"   TEXT NOT NULL DEFAULT 'PENDING',
    "error_message"       TEXT,
    "retry_count"         INTEGER NOT NULL DEFAULT 0,
    "input_tokens"        INTEGER,
    "output_tokens"       INTEGER,
    "generated_at"        TIMESTAMPTZ,
    "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ai_weekly_summaries_week_user_idx"
    ON "ai_weekly_summaries"("week_start_date", "target_user_id");

CREATE INDEX IF NOT EXISTS "ai_weekly_summaries_week_team_idx"
    ON "ai_weekly_summaries"("week_start_date", "summary_type", "business_unit_id");

CREATE INDEX IF NOT EXISTS "ai_weekly_summaries_status_idx"
    ON "ai_weekly_summaries"("generation_status");
