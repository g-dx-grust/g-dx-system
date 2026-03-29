/**
 * Migration 0009: approval_requests に document_url 列を追加し
 *                 meeting_date を timestamp with time zone に変更する
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

        // 1. meeting_date を timestamp with time zone に変更（既に timestamp なら無視）
        await client.query(`
            ALTER TABLE approval_requests
            ALTER COLUMN meeting_date TYPE timestamp with time zone
            USING meeting_date::timestamp with time zone
        `).then(() => console.log('✓ meeting_date -> timestamp with time zone'))
          .catch((e: Error) => console.log(`  skip meeting_date type change: ${e.message}`));

        // 2. document_url 列を追加（既にあれば無視）
        await client.query(`
            ALTER TABLE approval_requests
            ADD COLUMN IF NOT EXISTS document_url text
        `);
        console.log('✓ document_url column added');

        await client.query('COMMIT');
        console.log('\n✅ Migration 0009 complete!');
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
