import { config } from 'dotenv';
config({ path: '../../apps/web/.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and } from 'drizzle-orm';
import * as schema from '../schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });
const { roles, businessUnits, pipelines, pipelineStages } = schema;

async function main() {
    console.log('Seeding Business Units...');
    const units = [
        { code: 'LARK_SUPPORT', name: 'Lark Support' },
        { code: 'WATER_SAVING', name: 'Water Saving' },
    ];
    for (const unit of units) {
        await db.insert(businessUnits).values({ code: unit.code, name: unit.name, isActive: true }).onConflictDoNothing({ target: businessUnits.code });
    }

    console.log('Seeding Roles...');
    const defaultRoles = [
        { code: 'ADMIN', name: '管理者', isSystemRole: true },
        { code: 'OPERATOR', name: '営業', isSystemRole: true },
    ];
    for (const role of defaultRoles) {
        await db.insert(roles).values(role).onConflictDoNothing({ target: roles.code });
    }

    console.log('Seeding Pipelines...');
    const stageDefinitions = [
        { stageKey: 'APO_ACQUIRED', name: 'アポ獲得', stageOrder: 1, isClosedWon: false, isClosedLost: false },
        { stageKey: 'NEGOTIATING', name: '商談中・見積提示', stageOrder: 2, isClosedWon: false, isClosedLost: false },
        { stageKey: 'ALLIANCE', name: 'アライアンス', stageOrder: 3, isClosedWon: false, isClosedLost: false },
        { stageKey: 'PENDING', name: 'ペンディング', stageOrder: 4, isClosedWon: false, isClosedLost: false },
        { stageKey: 'APO_CANCELLED', name: 'アポキャン', stageOrder: 5, isClosedWon: false, isClosedLost: false },
        { stageKey: 'LOST', name: '失注・不明', stageOrder: 6, isClosedWon: false, isClosedLost: true },
        { stageKey: 'CONTRACTED', name: '契約済み', stageOrder: 7, isClosedWon: true, isClosedLost: false },
    ];

    for (const unit of units) {
        const [bu] = await db
            .select({ id: businessUnits.id })
            .from(businessUnits)
            .where(eq(businessUnits.code, unit.code))
            .limit(1);

        if (!bu) continue;

        const [existingPipeline] = await db
            .select({ id: pipelines.id })
            .from(pipelines)
            .where(and(eq(pipelines.businessUnitId, bu.id), eq(pipelines.isDefault, true)))
            .limit(1);

        let pipelineId: string;

        if (existingPipeline) {
            pipelineId = existingPipeline.id;
            console.log(`  Updating stages for ${unit.code} pipeline...`);
            // Delete existing stages and recreate
            await db.delete(pipelineStages).where(eq(pipelineStages.pipelineId, pipelineId));
        } else {
            const [pipeline] = await db
                .insert(pipelines)
                .values({
                    businessUnitId: bu.id,
                    code: 'DEFAULT',
                    name: `${unit.name} Pipeline`,
                    isDefault: true,
                    isActive: true,
                })
                .returning({ id: pipelines.id });
            pipelineId = pipeline.id;
            console.log(`  Created pipeline for ${unit.code}.`);
        }

        for (const stage of stageDefinitions) {
            await db.insert(pipelineStages).values({ pipelineId, ...stage });
        }
        console.log(`  Seeded 7 stages for ${unit.code}.`);
    }

    console.log('Seeding completed successfully.');
    await pool.end();
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
