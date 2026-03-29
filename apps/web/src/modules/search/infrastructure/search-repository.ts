import { db } from '@g-dx/database';
import { companies, companyBusinessProfiles, contacts, deals, pipelineStages } from '@g-dx/database/schema';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { BusinessScopeType, SearchResultItem } from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';

const STAGE_LABELS: Record<string, string> = {
    APO_ACQUIRED: 'Appointment',
    NEGOTIATING: 'Negotiating',
    ALLIANCE: 'Alliance',
    PENDING: 'Pending',
    APO_CANCELLED: 'Cancelled',
    LOST: 'Lost',
    CONTRACTED: 'Contracted',
};

export async function globalSearch(
    keyword: string,
    businessScope: BusinessScopeType,
    limit = 5
): Promise<SearchResultItem[]> {
    const q = keyword.trim();
    if (!q) return [];

    const businessUnit = await findBusinessUnitByScope(businessScope);
    const businessUnitId = businessUnit?.id;

    const [companyRows, contactRows, dealRows] = await Promise.all([
        db
            .select({ id: companies.id, name: companies.displayName })
            .from(companyBusinessProfiles)
            .innerJoin(companies, eq(companyBusinessProfiles.companyId, companies.id))
            .where(
                and(
                    businessUnitId ? eq(companyBusinessProfiles.businessUnitId, businessUnitId) : sql`1 = 1`,
                    or(
                        ilike(companies.displayName, `%${q}%`),
                        ilike(companies.legalName, `%${q}%`)
                    )
                )
            )
            .limit(limit),
        db
            .select({ id: contacts.id, fullName: contacts.fullName, email: contacts.email })
            .from(contacts)
            .where(
                or(
                    ilike(contacts.fullName, `%${q}%`),
                    ilike(contacts.email, `%${q}%`)
                )
            )
            .limit(limit),
        businessUnitId
            ? db
                .select({
                    id: deals.id,
                    title: deals.title,
                    stageKey: pipelineStages.stageKey,
                })
                .from(deals)
                .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
                .where(
                    and(
                        eq(deals.businessUnitId, businessUnitId),
                        isNull(deals.deletedAt),
                        ilike(deals.title, `%${q}%`)
                    )
                )
                .limit(limit)
            : Promise.resolve([]),
    ]);

    const results: SearchResultItem[] = [];

    for (const row of companyRows) {
        results.push({
            type: 'company',
            id: row.id,
            title: row.name,
            subtitle: 'Company',
            href: `/customers/companies/${row.id}`,
        });
    }

    for (const row of contactRows) {
        results.push({
            type: 'contact',
            id: row.id,
            title: row.fullName,
            subtitle: row.email ? `Contact / ${row.email}` : 'Contact',
            href: `/customers/contacts/${row.id}`,
        });
    }

    for (const row of dealRows) {
        results.push({
            type: 'deal',
            id: row.id,
            title: row.title,
            subtitle: `Deal / ${STAGE_LABELS[row.stageKey] ?? row.stageKey}`,
            href: `/sales/deals/${row.id}`,
        });
    }

    return results;
}
