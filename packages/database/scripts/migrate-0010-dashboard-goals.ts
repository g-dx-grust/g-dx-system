/**
 * Migration 0010: business_goals / ai_weekly_summaries テーブル追加
 *
 * 実行方法:
 *   pnpm --filter @g-dx/database exec tsx scripts/migrate-0010-dashboard-goals.ts
 *
 * 冪等（IF NOT EXISTS / IF NOT EXISTS）なので再実行しても安全。
 */
import { config } from 'dotenv';
config({ path: '../../apps/web/.env.local' });

import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();
    console.log('Connected to DB');

    try {
        await client.query('BEGIN');

        // ─── business_goals テーブル ──────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS "business_goals" (
                "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "business_unit_id"      UUID NOT NULL REFERENCES "business_units"("id"),
                "period_type"           TEXT NOT NULL,
                "period_key"            TEXT NOT NULL,
                "revenue_target"        NUMERIC(18, 2),
                "gross_profit_target"   NUMERIC(18, 2),
                "contract_count_target" INTEGER,
                "created_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
                "created_by_user_id"    UUID REFERENCES "users"("id"),
                CONSTRAINT "business_goals_bu_period_unique"
                    UNIQUE ("business_unit_id", "period_type", "period_key")
            )
        `);
        console.log('✓ business_goals テーブル');

        await client.query(`
            CREATE INDEX IF NOT EXISTS "business_goals_bu_idx"
                ON "business_goals"("business_unit_id")
        `);
        console.log('✓ business_goals インデックス');

        // ─── ai_weekly_summaries テーブル ─────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS "ai_weekly_summaries" (
                "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "summary_type"      TEXT NOT NULL,
                "business_unit_id"  UUID REFERENCES "business_units"("id"),
                "target_user_id"    UUID REFERENCES "users"("id"),
                "week_start_date"   DATE NOT NULL,
                "week_end_date"     DATE NOT NULL,
                "summary_body"      TEXT,
                "model_id"          TEXT,
                "prompt_version"    TEXT,
                "generation_status" TEXT NOT NULL DEFAULT 'PENDING',
                "error_message"     TEXT,
                "retry_count"       INTEGER NOT NULL DEFAULT 0,
                "input_tokens"      INTEGER,
                "output_tokens"     INTEGER,
                "generated_at"      TIMESTAMPTZ,
                "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);
        console.log('✓ ai_weekly_summaries テーブル');

        await client.query(`
            CREATE INDEX IF NOT EXISTS "ai_weekly_summaries_week_user_idx"
                ON "ai_weekly_summaries"("week_start_date", "target_user_id")
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS "ai_weekly_summaries_week_team_idx"
                ON "ai_weekly_summaries"("week_start_date", "summary_type", "business_unit_id")
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS "ai_weekly_summaries_status_idx"
                ON "ai_weekly_summaries"("generation_status")
        `);
        console.log('✓ ai_weekly_summaries インデックス');

        await client.query('COMMIT');
        console.log('\n✅ Migration 0010 完了!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('ROLLBACK:', err);
        throw err;
    } finally {
        await client.end();
    }
}

run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
