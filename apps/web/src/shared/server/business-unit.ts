import { cache } from 'react';
import type { BusinessScopeType } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import { businessUnits } from '@g-dx/database/schema';
import { and, eq } from 'drizzle-orm';

export interface BusinessUnitRecord {
    id: string;
    code: string;
}

const findBusinessUnitByScopeCached = cache(
    async (scope: BusinessScopeType): Promise<BusinessUnitRecord | null> => {
        const [record] = await db
            .select({
                id: businessUnits.id,
                code: businessUnits.code,
            })
            .from(businessUnits)
            .where(and(eq(businessUnits.code, scope), eq(businessUnits.isActive, true)))
            .limit(1);

        return record ?? null;
    }
);

export async function findBusinessUnitByScope(
    scope: BusinessScopeType
): Promise<BusinessUnitRecord | null> {
    return findBusinessUnitByScopeCached(scope);
}
