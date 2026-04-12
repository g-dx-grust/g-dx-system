/**
 * Production safe migration script.
 * Applies only schema changes that may not have been run yet,
 * using IF NOT EXISTS / conditional checks to avoid re-apply errors.
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

        // 1. Create master_lead_source table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "master_lead_source" (
                "流入経路コード" text PRIMARY KEY NOT NULL,
                "表示名" text NOT NULL,
                "カテゴリ" text NOT NULL,
                "並び順" integer NOT NULL
            )
        `);
        console.log('✓ master_lead_source table');

        // 2. Create user_kpi_targets if not exists (Drizzle FK style)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "user_kpi_targets" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "user_id" uuid NOT NULL,
                "business_unit_id" uuid NOT NULL,
                "target_month" text NOT NULL,
                "call_target" integer DEFAULT 0 NOT NULL,
                "visit_target" integer DEFAULT 0 NOT NULL,
                "appointment_target" integer DEFAULT 0 NOT NULL,
                "negotiation_target" integer DEFAULT 0 NOT NULL,
                "contract_target" integer DEFAULT 0 NOT NULL,
                "revenue_target" numeric(18, 2) DEFAULT '0' NOT NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
                CONSTRAINT "user_kpi_targets_user_id_business_unit_id_target_month_unique"
                    UNIQUE("user_id","business_unit_id","target_month")
            )
        `);
        console.log('✓ user_kpi_targets table');

        // 3. call_logs.started_at default
        await client.query(`
            ALTER TABLE "call_logs" ALTER COLUMN "started_at" SET DEFAULT now()
        `).catch(() => console.log('  (call_logs.started_at default already set)'));

        // 4. contracts new columns
        const contractCols: [string, string][] = [
            ['fs_in_charge_user_id', 'uuid'],
            ['is_in_charge_user_id', 'uuid'],
            ['product_code', 'text'],
            ['has_subsidy', 'boolean'],
            ['license_plan_code', 'text'],
            ['free_support_months', 'integer'],
            ['enterprise_license_count', 'integer'],
            ['pro_license_count', 'integer'],
            ['a2_license_count', 'integer'],
        ];
        for (const [col, type] of contractCols) {
            await client.query(
                `ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "${col}" ${type}`
            );
        }
        console.log('✓ contracts new columns');

        // 5. deals new columns
        await client.query(`ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "lark_chat_id" text`);
        await client.query(`ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "lark_calendar_id" text`);
        console.log('✓ deals new columns');

        // 6. call_logs new columns
        await client.query(`ALTER TABLE "call_logs" ADD COLUMN IF NOT EXISTS "next_call_datetime" timestamp with time zone`);
        console.log('✓ call_logs new columns');

        // 7. Indexes (all idempotent via IF NOT EXISTS)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "app_settings" (
                "key" text PRIMARY KEY NOT NULL,
                "value" text,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
                "updated_by_user_id" uuid REFERENCES "users"("id")
            )
        `);
        console.log('笨・app_settings table');

        const indexes: string[] = [
            `CREATE INDEX IF NOT EXISTS "ubm_user_idx" ON "user_business_memberships" USING btree ("user_id")`,
            `CREATE INDEX IF NOT EXISTS "ubm_business_unit_idx" ON "user_business_memberships" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "ubm_user_business_unit_idx" ON "user_business_memberships" USING btree ("user_id","business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "ura_user_idx" ON "user_role_assignments" USING btree ("user_id")`,
            `CREATE INDEX IF NOT EXISTS "ura_role_idx" ON "user_role_assignments" USING btree ("role_id")`,
            `CREATE INDEX IF NOT EXISTS "ura_user_role_idx" ON "user_role_assignments" USING btree ("user_id","role_id")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "companies_normalized_name_idx" ON "companies" USING btree ("normalized_name")`,
            `CREATE INDEX IF NOT EXISTS "companies_display_name_idx" ON "companies" USING btree ("display_name")`,
            `CREATE INDEX IF NOT EXISTS "companies_updated_at_idx" ON "companies" USING btree ("updated_at")`,
            `CREATE INDEX IF NOT EXISTS "cbp_business_unit_idx" ON "company_business_profiles" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "cbp_company_idx" ON "company_business_profiles" USING btree ("company_id")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "cbp_company_business_unit_idx" ON "company_business_profiles" USING btree ("company_id","business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "cbp_owner_user_idx" ON "company_business_profiles" USING btree ("owner_user_id")`,
            `CREATE INDEX IF NOT EXISTS "ccl_company_idx" ON "company_contact_links" USING btree ("company_id")`,
            `CREATE INDEX IF NOT EXISTS "ccl_contact_idx" ON "company_contact_links" USING btree ("contact_id")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "ccl_company_contact_idx" ON "company_contact_links" USING btree ("company_id","contact_id")`,
            `CREATE INDEX IF NOT EXISTS "cbpr_contact_idx" ON "contact_business_profiles" USING btree ("contact_id")`,
            `CREATE INDEX IF NOT EXISTS "cbpr_business_unit_idx" ON "contact_business_profiles" USING btree ("business_unit_id")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "cbpr_contact_business_unit_idx" ON "contact_business_profiles" USING btree ("contact_id","business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "contacts_full_name_idx" ON "contacts" USING btree ("full_name")`,
            `CREATE INDEX IF NOT EXISTS "contacts_email_idx" ON "contacts" USING btree ("email")`,
            `CREATE INDEX IF NOT EXISTS "contract_activities_contract_idx" ON "contract_activities" USING btree ("contract_id")`,
            `CREATE INDEX IF NOT EXISTS "contract_activities_business_unit_idx" ON "contract_activities" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "contracts_business_unit_idx" ON "contracts" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "contracts_company_idx" ON "contracts" USING btree ("company_id")`,
            `CREATE INDEX IF NOT EXISTS "contracts_deal_idx" ON "contracts" USING btree ("deal_id")`,
            `CREATE INDEX IF NOT EXISTS "contracts_owner_user_idx" ON "contracts" USING btree ("owner_user_id")`,
            `CREATE INDEX IF NOT EXISTS "deal_activities_deal_idx" ON "deal_activities" USING btree ("deal_id")`,
            `CREATE INDEX IF NOT EXISTS "deal_activities_business_unit_idx" ON "deal_activities" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "deal_stage_history_deal_idx" ON "deal_stage_history" USING btree ("deal_id")`,
            `CREATE INDEX IF NOT EXISTS "deal_stage_history_changed_at_idx" ON "deal_stage_history" USING btree ("changed_at")`,
            `CREATE INDEX IF NOT EXISTS "deals_business_unit_idx" ON "deals" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "deals_company_idx" ON "deals" USING btree ("company_id")`,
            `CREATE INDEX IF NOT EXISTS "deals_owner_user_idx" ON "deals" USING btree ("owner_user_id")`,
            `CREATE INDEX IF NOT EXISTS "deals_pipeline_idx" ON "deals" USING btree ("pipeline_id")`,
            `CREATE INDEX IF NOT EXISTS "deals_current_stage_idx" ON "deals" USING btree ("current_stage_id")`,
            `CREATE INDEX IF NOT EXISTS "deals_updated_at_idx" ON "deals" USING btree ("updated_at")`,
            `CREATE INDEX IF NOT EXISTS "deals_company_deleted_idx" ON "deals" USING btree ("company_id","deleted_at")`,
            `CREATE INDEX IF NOT EXISTS "facilities_company_idx" ON "facilities" USING btree ("company_id")`,
            `CREATE INDEX IF NOT EXISTS "pipeline_stages_pipeline_idx" ON "pipeline_stages" USING btree ("pipeline_id")`,
            `CREATE INDEX IF NOT EXISTS "pipelines_business_unit_idx" ON "pipelines" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "call_campaigns_business_unit_idx" ON "call_campaigns" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "call_logs_business_unit_idx" ON "call_logs" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "call_logs_user_idx" ON "call_logs" USING btree ("user_id")`,
            `CREATE INDEX IF NOT EXISTS "call_logs_company_idx" ON "call_logs" USING btree ("company_id")`,
            `CREATE INDEX IF NOT EXISTS "call_logs_started_at_idx" ON "call_logs" USING btree ("started_at")`,
            `CREATE INDEX IF NOT EXISTS "call_logs_deal_idx" ON "call_logs" USING btree ("deal_id")`,
            `CREATE INDEX IF NOT EXISTS "call_targets_campaign_idx" ON "call_targets" USING btree ("campaign_id")`,
            `CREATE INDEX IF NOT EXISTS "call_targets_business_unit_idx" ON "call_targets" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "call_targets_company_idx" ON "call_targets" USING btree ("company_id")`,
            `CREATE INDEX IF NOT EXISTS "call_targets_assigned_user_idx" ON "call_targets" USING btree ("assigned_user_id")`,
            `CREATE INDEX IF NOT EXISTS "tasks_assigned_user_idx" ON "tasks" USING btree ("assigned_user_id")`,
            `CREATE INDEX IF NOT EXISTS "tasks_business_unit_idx" ON "tasks" USING btree ("business_unit_id")`,
            `CREATE INDEX IF NOT EXISTS "tasks_deal_idx" ON "tasks" USING btree ("deal_id")`,
            `CREATE INDEX IF NOT EXISTS "tasks_company_idx" ON "tasks" USING btree ("company_id")`,
            `CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" USING btree ("status")`,
            `CREATE INDEX IF NOT EXISTS "tasks_due_at_idx" ON "tasks" USING btree ("due_at")`,
            `CREATE INDEX IF NOT EXISTS "ddm_business_unit_date_idx" ON "dashboard_daily_metrics" USING btree ("business_unit_id","metric_date")`,
            `CREATE INDEX IF NOT EXISTS "ddm_metric_key_idx" ON "dashboard_daily_metrics" USING btree ("metric_key")`,
            `CREATE INDEX IF NOT EXISTS "audit_logs_table_record_idx" ON "audit_logs" USING btree ("table_name","record_pk")`,
            `CREATE INDEX IF NOT EXISTS "audit_logs_occurred_at_idx" ON "audit_logs" USING btree ("occurred_at")`,
            `CREATE INDEX IF NOT EXISTS "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id")`,
            `CREATE INDEX IF NOT EXISTS "erl_entity_idx" ON "external_record_links" USING btree ("entity_type","entity_id")`,
            `CREATE INDEX IF NOT EXISTS "erl_external_record_idx" ON "external_record_links" USING btree ("external_system","external_record_id")`,
            `CREATE INDEX IF NOT EXISTS "app_settings_updated_at_idx" ON "app_settings" USING btree ("updated_at")`,
            `CREATE INDEX IF NOT EXISTS "lark_sync_jobs_status_idx" ON "lark_sync_jobs" USING btree ("status")`,
            `CREATE INDEX IF NOT EXISTS "lark_sync_jobs_run_after_idx" ON "lark_sync_jobs" USING btree ("run_after")`,
        ];
        for (const sql of indexes) {
            await client.query(sql).catch((e: Error) => console.log(`  skip index: ${e.message}`));
        }
        console.log('✓ indexes');

        // receive_ai_summary column on user_business_memberships
        await client.query(`
            ALTER TABLE "user_business_memberships"
            ADD COLUMN IF NOT EXISTS "receive_ai_summary" boolean DEFAULT true NOT NULL
        `);
        console.log('✓ user_business_memberships.receive_ai_summary column');

        // deal_activities: lark_meeting_url column
        await client.query(`
            ALTER TABLE "deal_activities"
            ADD COLUMN IF NOT EXISTS "lark_meeting_url" text
        `);
        console.log('✓ deal_activities.lark_meeting_url column');

        // deal_activities: NegotiationOutcome migration
        // POSITIVE→HIGH, NEUTRAL→MEDIUM, PENDING→LOW, NEGATIVE→NONE
        await client.query(`
            UPDATE "deal_activities"
            SET "negotiation_outcome" = CASE "negotiation_outcome"
                WHEN 'POSITIVE' THEN 'HIGH'
                WHEN 'NEUTRAL'  THEN 'MEDIUM'
                WHEN 'PENDING'  THEN 'LOW'
                WHEN 'NEGATIVE' THEN 'NONE'
                ELSE "negotiation_outcome"
            END
            WHERE "negotiation_outcome" IN ('POSITIVE','NEUTRAL','PENDING','NEGATIVE')
        `);
        console.log('✓ deal_activities.negotiation_outcome data migration');

        // deal_activities: set meeting_count=0 for non-meeting types (CALL/EMAIL/OTHER)
        await client.query(`
            UPDATE "deal_activities"
            SET "meeting_count" = 0
            WHERE "activity_type" NOT IN ('VISIT','ONLINE')
        `);
        console.log('✓ deal_activities.meeting_count fixed for non-meeting types');

        // contract_activities: new CS fields
        const contractActivityCols: [string, string][] = [
            ['initiated_by', 'text'],
            ['session_number', 'integer'],
            ['progress_status', 'text'],
            ['lark_meeting_url', 'text'],
            ['next_session_type', 'text'],
            ['next_session_date', 'date'],
            ['updated_at', 'timestamp with time zone DEFAULT now()'],
        ];
        for (const [col, type] of contractActivityCols) {
            await client.query(
                `ALTER TABLE "contract_activities" ADD COLUMN IF NOT EXISTS "${col}" ${type}`
            );
        }
        // rename activity_type values for old entries (keep as-is, new ones use REGULAR/SPOT)
        console.log('✓ contract_activities new columns');

        // contracts: CS management fields
        const contractCsCols: [string, string][] = [
            ['cs_phase', 'text'],
            ['regular_meeting_weekday', 'text'],
            ['regular_meeting_time', 'text'],
            ['regular_meeting_frequency', 'text'],
            ['total_session_count', 'integer DEFAULT 0 NOT NULL'],
        ];
        for (const [col, type] of contractCsCols) {
            await client.query(
                `ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "${col}" ${type}`
            );
        }
        console.log('✓ contracts CS fields');

        // deal_activities: updated_at column
        await client.query(`
            ALTER TABLE "deal_activities"
            ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now()
        `);
        console.log('✓ deal_activities.updated_at');

        // alliance_activities table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "alliance_activities" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "alliance_id" uuid NOT NULL REFERENCES "alliances"("id"),
                "business_unit_id" uuid NOT NULL REFERENCES "business_units"("id"),
                "user_id" uuid NOT NULL REFERENCES "users"("id"),
                "activity_type" text NOT NULL,
                "activity_date" date NOT NULL,
                "summary" text,
                "lark_meeting_url" text,
                "next_action_date" date,
                "next_action_content" text,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL
            )
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS "alliance_activities_alliance_idx"
            ON "alliance_activities" USING btree ("alliance_id")
        `).catch(() => {});
        await client.query(`
            CREATE INDEX IF NOT EXISTS "alliance_activities_business_unit_idx"
            ON "alliance_activities" USING btree ("business_unit_id")
        `).catch(() => {});
        await client.query(`
            ALTER TABLE "alliance_activities"
            ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now()
        `).catch(() => {});
        console.log('✓ alliance_activities table');

        await client.query('COMMIT');
        console.log('\n✅ Migration complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        await client.end();
    }
}

run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
