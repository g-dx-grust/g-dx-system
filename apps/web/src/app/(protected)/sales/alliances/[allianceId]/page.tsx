import { redirect } from 'next/navigation';
import { getAllianceDetail } from '@/modules/sales/alliance/application/get-alliance-detail';
import { AllianceDetailView } from '@/modules/sales/alliance/ui/alliance-detail';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { db } from '@g-dx/database';
import { allianceDealLinks, businessUnits, companies, deals } from '@g-dx/database/schema';
import { and, eq, isNull, notInArray } from 'drizzle-orm';

interface AllianceDetailPageProps {
    params: { allianceId: string };
    searchParams?: { created?: string; updated?: string; linked?: string; unlinked?: string };
}

export default async function AllianceDetailPage({ params, searchParams }: AllianceDetailPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    let alliance;
    try {
        alliance = await getAllianceDetail(params.allianceId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/alliances');
        throw error;
    }

    // Get active business unit
    const bu = await db
        .select({ id: businessUnits.id })
        .from(businessUnits)
        .where(eq(businessUnits.code, session.activeBusinessScope))
        .limit(1);

    const buId = bu[0]?.id;

    // Get already-linked deal IDs for this alliance
    const linkedIds = alliance.linkedDeals.map((d) => d.dealId);

    // Available deals = active deals in this scope not yet linked
    const availableDealsRows = buId
        ? await db
              .select({ id: deals.id, title: deals.title, companyName: companies.displayName })
              .from(deals)
              .innerJoin(companies, eq(deals.companyId, companies.id))
              .where(
                  and(
                      eq(deals.businessUnitId, buId),
                      isNull(deals.deletedAt),
                      linkedIds.length > 0 ? notInArray(deals.id, linkedIds) : undefined,
                  ),
              )
              .orderBy(deals.title)
              .limit(200)
        : [];

    const availableDeals = availableDealsRows.map((r) => ({
        id: r.id,
        name: r.title,
        companyName: r.companyName,
    }));

    return (
        <AllianceDetailView
            alliance={alliance}
            availableDeals={availableDeals}
            created={searchParams?.created === '1'}
            updated={searchParams?.updated === '1'}
            linked={searchParams?.linked === '1'}
            unlinked={searchParams?.unlinked === '1'}
        />
    );
}
