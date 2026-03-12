import { config } from 'dotenv';
config({ path: '../../apps/web/.env.local' });

import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./schema/index.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    }
});
