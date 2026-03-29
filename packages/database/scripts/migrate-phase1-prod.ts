/**
 * Production-safe migration for Phase 1 schema changes (migration 0008).
 *
 * This script is intentionally idempotent:
 * - creates missing tables only when absent
 * - adds missing profile columns only when absent
 * - backfills initial lead source only when empty
 * - creates indexes only when absent
 * - inserts new Phase 1 roles only when absent
 *
 * It does not touch Drizzle's migration journal because production is already
 * operating outside that journal history. This keeps the script focused on
 * making the live schema compatible with the shipped application code.
 */
import { config } from 'dotenv';
config({ path: '../../apps/web/.env.local' });

import pg from 'pg';

const { Client } = pg;

type RoleSeed = {
    code: string;
    name: string;
    sortOrder: number;
};

const phase1Roles: RoleSeed[] = [
    { code: 'IS_MEMBER', name: 'IS担当', sortOrder: 50 },
    { code: 'TECH', name: '技術部門', sortOrder: 60 },
];

const verificationTableNames = [
    'approval_check_items',
    'approval_requests',
    'approval_routes',
    'hearing_records',
    'lead_source_history',
    'notifications',
];

async function createPhase1Tables(client: pg.Client): Promise<void> {
    await client.query(`
        CREATE TABLE IF NOT EXISTS "hearing_records" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "deal_id" uuid NOT NULL REFERENCES "deals"("id"),
            "business_unit_id" uuid NOT NULL REFERENCES "business_units"("id"),
            "gap_current_situation" text,
            "gap_ideal_state" text,
            "gap_effect_goal" text,
            "gap_agreement_memo" text,
            "gap_completed" boolean DEFAULT false NOT NULL,
            "target_user_segments" text,
            "target_id_estimate" integer,
            "target_plan_candidate" text,
            "target_completed" boolean DEFAULT false NOT NULL,
            "scope_is_standard" boolean,
            "scope_option_requirements" text,
            "scope_tech_liaison_flag" boolean DEFAULT false NOT NULL,
            "scope_completed" boolean DEFAULT false NOT NULL,
            "subsidy_insurance_status" text,
            "subsidy_company_category" text,
            "subsidy_applicable_program" text,
            "subsidy_labor_consultant_ok" boolean,
            "subsidy_completed" boolean DEFAULT false NOT NULL,
            "decision_approver_info" text,
            "decision_timeline" text,
            "decision_next_meeting_attendee" text,
            "decision_criteria" text,
            "decision_next_plan" text,
            "decision_completed" boolean DEFAULT false NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
            "created_by_user_id" uuid REFERENCES "users"("id"),
            "updated_by_user_id" uuid REFERENCES "users"("id")
        )
    `);
    console.log('OK: hearing_records table');

    await client.query(`
        CREATE TABLE IF NOT EXISTS "approval_routes" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "business_unit_id" uuid NOT NULL REFERENCES "business_units"("id"),
            "approval_type" text NOT NULL,
            "route_name" text NOT NULL,
            "approver_user_id" uuid NOT NULL REFERENCES "users"("id"),
            "route_order" integer DEFAULT 1 NOT NULL,
            "allow_self_approval" boolean DEFAULT false NOT NULL,
            "is_active" boolean DEFAULT true NOT NULL,
            "conditions" jsonb,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        )
    `);
    console.log('OK: approval_routes table');

    await client.query(`
        CREATE TABLE IF NOT EXISTS "approval_requests" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "business_unit_id" uuid NOT NULL REFERENCES "business_units"("id"),
            "deal_id" uuid NOT NULL REFERENCES "deals"("id"),
            "approval_type" text NOT NULL,
            "approval_status" text DEFAULT 'PENDING' NOT NULL,
            "applicant_user_id" uuid NOT NULL REFERENCES "users"("id"),
            "approver_user_id" uuid REFERENCES "users"("id"),
            "applied_at" timestamp with time zone DEFAULT now() NOT NULL,
            "decided_at" timestamp with time zone,
            "deadline_at" timestamp with time zone,
            "meeting_date" date,
            "decision_comment" text,
            "expiry_reason" text,
            "snapshot_data" jsonb,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        )
    `);
    console.log('OK: approval_requests table');

    await client.query(`
        CREATE TABLE IF NOT EXISTS "approval_check_items" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "approval_request_id" uuid NOT NULL REFERENCES "approval_requests"("id") ON DELETE CASCADE,
            "item_code" text NOT NULL,
            "input_value" text,
            "check_result" boolean,
            "comment" text,
            "evidence_file_url" text,
            "customer_reaction" text,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        )
    `);
    console.log('OK: approval_check_items table');

    await client.query(`
        CREATE TABLE IF NOT EXISTS "notifications" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "business_unit_id" uuid REFERENCES "business_units"("id"),
            "recipient_user_id" uuid NOT NULL REFERENCES "users"("id"),
            "notification_type" text NOT NULL,
            "title" text NOT NULL,
            "body" text,
            "related_entity_type" text,
            "related_entity_id" uuid,
            "link_url" text,
            "is_read" boolean DEFAULT false NOT NULL,
            "read_at" timestamp with time zone,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
    `);
    console.log('OK: notifications table');

    await client.query(`
        CREATE TABLE IF NOT EXISTS "lead_source_history" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "company_id" uuid NOT NULL REFERENCES "companies"("id"),
            "business_unit_id" uuid NOT NULL REFERENCES "business_units"("id"),
            "previous_lead_source_code" text,
            "new_lead_source_code" text,
            "changed_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
            "changed_at" timestamp with time zone DEFAULT now() NOT NULL,
            "change_reason" text
        )
    `);
    console.log('OK: lead_source_history table');
}

async function addPhase1Columns(client: pg.Client): Promise<void> {
    await client.query(`
        ALTER TABLE "company_business_profiles"
            ADD COLUMN IF NOT EXISTS "initial_lead_source_code" text,
            ADD COLUMN IF NOT EXISTS "company_overview" text,
            ADD COLUMN IF NOT EXISTS "business_description" text
    `);

    await client.query(`
        UPDATE "company_business_profiles"
        SET "initial_lead_source_code" = "lead_source_code"
        WHERE "initial_lead_source_code" IS NULL
          AND "lead_source_code" IS NOT NULL
    `);

    console.log('OK: company_business_profiles Phase 1 columns');
}

async function addPhase1Indexes(client: pg.Client): Promise<void> {
    const indexStatements = [
        `CREATE UNIQUE INDEX IF NOT EXISTS "hearing_records_deal_idx" ON "hearing_records" ("deal_id")`,
        `CREATE INDEX IF NOT EXISTS "hearing_records_business_unit_idx" ON "hearing_records" ("business_unit_id")`,
        `CREATE INDEX IF NOT EXISTS "approval_routes_business_unit_type_idx" ON "approval_routes" ("business_unit_id", "approval_type")`,
        `CREATE INDEX IF NOT EXISTS "approval_requests_deal_idx" ON "approval_requests" ("deal_id")`,
        `CREATE INDEX IF NOT EXISTS "approval_requests_applicant_idx" ON "approval_requests" ("applicant_user_id")`,
        `CREATE INDEX IF NOT EXISTS "approval_requests_approver_idx" ON "approval_requests" ("approver_user_id")`,
        `CREATE INDEX IF NOT EXISTS "approval_requests_status_idx" ON "approval_requests" ("approval_status")`,
        `CREATE INDEX IF NOT EXISTS "approval_requests_business_unit_type_idx" ON "approval_requests" ("business_unit_id", "approval_type")`,
        `CREATE INDEX IF NOT EXISTS "approval_requests_deadline_idx" ON "approval_requests" ("deadline_at") WHERE "approval_status" = 'PENDING'`,
        `CREATE INDEX IF NOT EXISTS "approval_check_items_request_idx" ON "approval_check_items" ("approval_request_id")`,
        `CREATE INDEX IF NOT EXISTS "notifications_recipient_idx" ON "notifications" ("recipient_user_id", "is_read", "created_at" DESC)`,
        `CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at" DESC)`,
        `CREATE INDEX IF NOT EXISTS "lead_source_history_company_idx" ON "lead_source_history" ("company_id", "changed_at" DESC)`,
    ];

    for (const sql of indexStatements) {
        await client.query(sql);
    }

    console.log('OK: Phase 1 indexes');
}

async function seedPhase1Roles(client: pg.Client): Promise<void> {
    for (const role of phase1Roles) {
        await client.query(
            `
                INSERT INTO "roles" ("code", "name", "is_system_role", "sort_order")
                VALUES ($1, $2, true, $3)
                ON CONFLICT ("code") DO NOTHING
            `,
            [role.code, role.name, role.sortOrder],
        );
    }

    console.log('OK: Phase 1 roles');
}

async function verifyPhase1State(client: pg.Client): Promise<void> {
    const tables = await client.query(
        `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ANY($1::text[])
            ORDER BY table_name
        `,
        [verificationTableNames],
    );

    const columns = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'company_business_profiles'
          AND column_name IN ('initial_lead_source_code', 'company_overview', 'business_description')
        ORDER BY column_name
    `);

    const roles = await client.query(`
        SELECT code
        FROM roles
        WHERE code IN ('IS_MEMBER', 'TECH')
        ORDER BY code
    `);

    console.log('\nVerification summary:');
    console.log(
        JSON.stringify(
            {
                tables: tables.rows.map((row) => row.table_name),
                companyBusinessProfileColumns: columns.rows.map((row) => row.column_name),
                roles: roles.rows.map((row) => row.code),
            },
            null,
            2,
        ),
    );
}

async function run(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set.');
    }

    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to DB');

    try {
        await client.query('BEGIN');

        await createPhase1Tables(client);
        await addPhase1Columns(client);
        await addPhase1Indexes(client);
        await seedPhase1Roles(client);

        await client.query('COMMIT');
        console.log('\nOK: Phase 1 migration complete');

        await verifyPhase1State(client);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.end();
    }
}

run().catch((error) => {
    console.error('Phase 1 migration failed:', error);
    process.exit(1);
});
