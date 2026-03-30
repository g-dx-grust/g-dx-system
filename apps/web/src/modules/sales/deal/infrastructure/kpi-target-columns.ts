import { db } from '@g-dx/database';
import { sql } from 'drizzle-orm';

let segmentTargetColumnsPromise: Promise<boolean> | null = null;

export async function hasSegmentTargetColumns(): Promise<boolean> {
    if (!segmentTargetColumnsPromise) {
        segmentTargetColumnsPromise = db
            .execute<{ is_ready: boolean }>(sql`
                SELECT
                    EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'user_kpi_targets'
                          AND column_name = 'new_visit_target'
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'user_kpi_targets'
                          AND column_name = 'new_negotiation_target'
                    ) AS is_ready
            `)
            .then((result) => Boolean(result.rows[0]?.is_ready))
            .catch(() => false);
    }

    return segmentTargetColumnsPromise;
}
