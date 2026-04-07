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
            ALTER TABLE "deal_activities"
                ADD COLUMN IF NOT EXISTS "visit_category" TEXT
        `);
        await client.query(`
            ALTER TABLE "deal_activities"
                ADD COLUMN IF NOT EXISTS "target_type" TEXT
        `);
        console.log('OK: meeting category columns');

        await client.query('COMMIT');

        const verification = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'deal_activities'
              AND column_name IN ('target_type', 'visit_category')
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
    console.error('Migration 0013 failed:', error);
    process.exit(1);
});
