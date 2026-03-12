import { db } from '@g-dx/database';
import { companies, contacts, deals, pipelineStages, businessUnits, companyBusinessProfiles } from '@g-dx/database/schema';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { BusinessScopeType, SearchResultItem } from '@g-dx/contracts';

export async function globalSearch(
    keyword: string,
    businessScope: BusinessScopeType,
    limit = 5
): Promise<SearchResultItem[]> {
    const q = keyword.trim();
    if (!q) return [];

    const [buRow] = await db
        .select({ id: businessUnits.id })
        .from(businessUnits)
        .where(eq(businessUnits.code, businessScope))
        .limit(1);

    const results: SearchResultItem[] = [];

    // Companies
    const companyRows = await db
        .select({ id: companies.id, name: companies.displayName })
        .from(companyBusinessProfiles)
        .innerJoin(companies, eq(companyBusinessProfiles.companyId, companies.id))
        .where(
            and(
                buRow ? eq(companyBusinessProfiles.businessUnitId, buRow.id) : sql`1=1`,
                or(
                    ilike(companies.displayName, `%${q}%`),
                    ilike(companies.legalName, `%${q}%`)
                )
            )
        )
        .limit(limit);

    for (const row of companyRows) {
        results.push({
            type: 'company',
            id: row.id,
            title: row.name,
            subtitle: '会社',
            href: `/customers/companies/${row.id}`,
        });
    }

    // Contacts
    const contactRows = await db
        .select({ id: contacts.id, fullName: contacts.fullName, email: contacts.email })
        .from(contacts)
        .where(
            or(
                ilike(contacts.fullName, `%${q}%`),
                ilike(contacts.email, `%${q}%`)
            )
        )
        .limit(limit);

    for (const row of contactRows) {
        results.push({
            type: 'contact',
            id: row.id,
            title: row.fullName,
            subtitle: row.email ? `コンタクト · ${row.email}` : 'コンタクト',
            href: `/customers/contacts/${row.id}`,
        });
    }

    // Deals (business-scoped)
    if (buRow) {
        const dealRows = await db
            .select({
                id: deals.id,
                title: deals.title,
                stageKey: pipelineStages.stageKey,
            })
            .from(deals)
            .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
            .where(
                and(
                    eq(deals.businessUnitId, buRow.id),
                    isNull(deals.deletedAt),
                    ilike(deals.title, `%${q}%`)
                )
            )
            .limit(limit);

        const STAGE_LABELS: Record<string, string> = {
            APO_ACQUIRED: 'アポ獲得',
            NEGOTIATING: '商談中',
            ALLIANCE: 'アライアンス',
            PENDING: 'ペンディング',
            APO_CANCELLED: 'アポキャン',
            LOST: '失注',
            CONTRACTED: '契約済み',
        };

        for (const row of dealRows) {
            results.push({
                type: 'deal',
                id: row.id,
                title: row.title,
                subtitle: `案件 · ${STAGE_LABELS[row.stageKey] ?? row.stageKey}`,
                href: `/sales/deals/${row.id}`,
            });
        }
    }

    return results;
}
