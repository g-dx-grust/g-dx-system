import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { appConfig } from '@g-dx/config';
import * as schema from '../schema';

let pool: Pool;

// Ensure we don't hold multiple pools in hot reloads
const connectionString = appConfig.database.url;
const max = appConfig.database.poolMax;

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString,
        max,
    });
} else {
    if (!(global as any).pool) {
        (global as any).pool = new Pool({
            connectionString,
            max,
        });
    }
    pool = (global as any).pool;
}

export const db = drizzle(pool, { schema });
