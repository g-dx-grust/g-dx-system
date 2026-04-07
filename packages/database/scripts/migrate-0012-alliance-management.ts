import { config } from 'dotenv';
config({ path: '../../apps/web/.env.local' });

import pg from 'pg';

const { Client } = pg;

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

        await client.query(`
            CREATE TABLE IF NOT EXISTS "alliances" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "business_unit_id" UUID NOT NULL REFERENCES "business_units"("id"),
                "name" TEXT NOT NULL,
                "alliance_type" TEXT NOT NULL DEFAULT 'COMPANY',
                "contact_person_name" TEXT,
                "contact_person_role" TEXT,
                "contact_person_email" TEXT,
                "contact_person_phone" TEXT,
                "agreement_summary" TEXT,
                "relationship_status" TEXT NOT NULL DEFAULT 'PROSPECT',
                "notes" TEXT,
                "created_by_user_id" UUID REFERENCES "users"("id"),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMPTZ
            )
        `);
        console.log('OK: alliances table');

        await client.query(`
            CREATE INDEX IF NOT EXISTS "alliances_business_unit_idx"
                ON "alliances"("business_unit_id")
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS "alliances_status_idx"
                ON "alliances"("relationship_status")
        `);
        console.log('OK: alliances indexes');

        await client.query(`
            CREATE TABLE IF NOT EXISTS "alliance_deal_links" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "alliance_id" UUID NOT NULL REFERENCES "alliances"("id"),
                "deal_id" UUID NOT NULL REFERENCES "deals"("id"),
                "referral_type" TEXT NOT NULL DEFAULT 'INTRODUCER',
                "note" TEXT,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "alliance_deal_links_alliance_id_deal_id_unique"
                    UNIQUE ("alliance_id", "deal_id")
            )
        `);
        console.log('OK: alliance_deal_links table');

        await client.query(`
            CREATE INDEX IF NOT EXISTS "alliance_deal_links_alliance_idx"
                ON "alliance_deal_links"("alliance_id")
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS "alliance_deal_links_deal_idx"
                ON "alliance_deal_links"("deal_id")
        `);
        console.log('OK: alliance_deal_links indexes');

        await client.query('COMMIT');

        const verification = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('alliances', 'alliance_deal_links')
            ORDER BY table_name
        `);

        console.log(
            JSON.stringify(
                {
                    createdTables: verification.rows.map((row) => row.table_name),
                },
                null,
                2,
            ),
        );
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.end();
    }
}

run().catch((error) => {
    console.error('Migration 0012 failed:', error);
    process.exit(1);
});
