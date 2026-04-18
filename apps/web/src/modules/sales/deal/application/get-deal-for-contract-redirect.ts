import { db } from '@g-dx/database';
import { deals } from '@g-dx/database/schema';
import { eq, isNull, and } from 'drizzle-orm';

export async function getDealForContractRedirect(dealId: string) {
    const [row] = await db
        .select({
            id: deals.id,
            title: deals.title,
            companyId: deals.companyId,
            amount: deals.amount,
        })
        .from(deals)
        .where(and(eq(deals.id, dealId), isNull(deals.deletedAt)))
        .limit(1);

    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        companyId: row.companyId,
        amount: row.amount !== null ? Number(row.amount) : null,
    };
}
