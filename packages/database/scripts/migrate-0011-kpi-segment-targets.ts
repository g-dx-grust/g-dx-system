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
            ALTER TABLE "user_kpi_targets"
                ADD COLUMN IF NOT EXISTS "new_visit_target" INTEGER NOT NULL DEFAULT 0
        `);
        console.log('OK: new_visit_target column');

        await client.query(`
            ALTER TABLE "user_kpi_targets"
                ADD COLUMN IF NOT EXISTS "new_negotiation_target" INTEGER NOT NULL DEFAULT 0
        `);
        console.log('OK: new_negotiation_target column');

        await client.query(`
            UPDATE "user_kpi_targets"
            SET
                "new_visit_target" = CASE
                    WHEN "new_visit_target" = 0 THEN "visit_target"
                    ELSE "new_visit_target"
                END,
                "new_negotiation_target" = CASE
                    WHEN "new_negotiation_target" = 0 THEN "negotiation_target"
                    ELSE "new_negotiation_target"
                END
        `);
        console.log('OK: existing KPI targets backfilled');

        await client.query('COMMIT');

        const verification = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'user_kpi_targets'
              AND column_name IN ('new_visit_target', 'new_negotiation_target')
            ORDER BY column_name
        `);

        console.log(
            JSON.stringify(
                {
                    addedColumns: verification.rows.map((row) => row.column_name),
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
    console.error('Migration 0011 failed:', error);
    process.exit(1);
});
