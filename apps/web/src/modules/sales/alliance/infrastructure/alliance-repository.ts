import { db } from '@g-dx/database';
import { allianceDealLinks, alliances, businessUnits, companies, deals, pipelineStages } from '@g-dx/database/schema';
import { and, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import type {
    AllianceDetail,
    AllianceLinkedDeal,
    AllianceListItem,
    AllianceReferralType,
    AllianceStatus,
    AllianceType,
    BusinessScopeType,
    DealStageKey,
    UUID,
} from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import type { AllianceListFilters, CreateAllianceInput, UpdateAllianceInput } from '../domain/alliance';

function nextId() {
    return crypto.randomUUID();
}

async function getBusinessUnitOrThrow(businessScope: BusinessScopeType) {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    return businessUnit;
}

async function verifyAllianceScope(allianceId: string, businessUnitId: string): Promise<void> {
    const [alliance] = await db
        .select({ id: alliances.id })
        .from(alliances)
        .where(
            and(
                eq(alliances.id, allianceId),
                eq(alliances.businessUnitId, businessUnitId),
                isNull(alliances.deletedAt),
            ),
        )
        .limit(1);

    if (!alliance) {
        throw new AppError('NOT_FOUND', 'Alliance was not found in the active business scope.');
    }
}

async function verifyDealScope(dealId: string, businessUnitId: string): Promise<void> {
    const [deal] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(
            and(
                eq(deals.id, dealId),
                eq(deals.businessUnitId, businessUnitId),
                isNull(deals.deletedAt),
            ),
        )
        .limit(1);

    if (!deal) {
        throw new AppError('NOT_FOUND', 'Deal was not found in the active business scope.');
    }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listAlliances(
    businessScope: BusinessScopeType,
    filters: AllianceListFilters = {},
): Promise<{ data: AllianceListItem[]; total: number }> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const rows = await db
        .select({
            id: alliances.id,
            name: alliances.name,
            allianceType: alliances.allianceType,
            contactPersonName: alliances.contactPersonName,
            relationshipStatus: alliances.relationshipStatus,
            createdAt: alliances.createdAt,
        })
        .from(alliances)
        .where(
            and(
                eq(alliances.businessUnitId, businessUnit.id),
                isNull(alliances.deletedAt),
                filters.relationshipStatus ? eq(alliances.relationshipStatus, filters.relationshipStatus) : undefined,
                filters.keyword
                    ? or(
                          ilike(alliances.name, `%${filters.keyword}%`),
                          ilike(alliances.contactPersonName, `%${filters.keyword}%`),
                      )
                    : undefined,
            ),
        )
        .orderBy(desc(alliances.createdAt));

    const allianceIds = rows.map((r) => r.id);

    // Count linked deals per alliance
    const linkCounts = allianceIds.length > 0
        ? await db
              .select({ allianceId: allianceDealLinks.allianceId, cnt: count() })
              .from(allianceDealLinks)
              .where(inArray(allianceDealLinks.allianceId, allianceIds))
              .groupBy(allianceDealLinks.allianceId)
        : [];

    const countMap = new Map(linkCounts.map((r) => [r.allianceId, Number(r.cnt)]));

    const data: AllianceListItem[] = rows.map((row) => ({
        id: row.id as UUID,
        name: row.name,
        allianceType: row.allianceType as AllianceType,
        contactPersonName: row.contactPersonName,
        relationshipStatus: row.relationshipStatus as AllianceStatus,
        linkedDealCount: countMap.get(row.id) ?? 0,
        createdAt: row.createdAt.toISOString(),
    }));

    return { data, total: data.length };
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getAllianceById(
    allianceId: string,
    businessScope: BusinessScopeType,
): Promise<AllianceDetail | null> {
    const businessUnit = await getBusinessUnitOrThrow(businessScope);

    const rows = await db
        .select({
            id: alliances.id,
            name: alliances.name,
            allianceType: alliances.allianceType,
            contactPersonName: alliances.contactPersonName,
            contactPersonRole: alliances.contactPersonRole,
            contactPersonEmail: alliances.contactPersonEmail,
            contactPersonPhone: alliances.contactPersonPhone,
            agreementSummary: alliances.agreementSummary,
            relationshipStatus: alliances.relationshipStatus,
            notes: alliances.notes,
            createdAt: alliances.createdAt,
            updatedAt: alliances.updatedAt,
            businessScopeCode: businessUnits.code,
        })
        .from(alliances)
        .innerJoin(businessUnits, eq(alliances.businessUnitId, businessUnits.id))
        .where(
            and(
                eq(alliances.id, allianceId),
                eq(alliances.businessUnitId, businessUnit.id),
                isNull(alliances.deletedAt),
            ),
        )
        .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];

    // Get linked deals
    const linkedDealRows = await db
        .select({
            dealId: allianceDealLinks.dealId,
            dealName: deals.title,
            companyName: companies.displayName,
            stageKey: pipelineStages.stageKey,
            referralType: allianceDealLinks.referralType,
            note: allianceDealLinks.note,
        })
        .from(allianceDealLinks)
        .innerJoin(deals, eq(allianceDealLinks.dealId, deals.id))
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
        .where(
            and(
                eq(allianceDealLinks.allianceId, allianceId),
                eq(deals.businessUnitId, businessUnit.id),
                isNull(deals.deletedAt),
            ),
        );

    const linkedDeals: AllianceLinkedDeal[] = linkedDealRows.map((r) => ({
        dealId: r.dealId as UUID,
        dealName: r.dealName,
        companyName: r.companyName,
        stageKey: r.stageKey as DealStageKey,
        referralType: r.referralType as AllianceReferralType,
        note: r.note,
    }));

    return {
        id: row.id as UUID,
        name: row.name,
        allianceType: row.allianceType as AllianceType,
        contactPersonName: row.contactPersonName,
        contactPersonRole: row.contactPersonRole,
        contactPersonEmail: row.contactPersonEmail,
        contactPersonPhone: row.contactPersonPhone,
        agreementSummary: row.agreementSummary,
        relationshipStatus: row.relationshipStatus as AllianceStatus,
        notes: row.notes,
        businessScope: row.businessScopeCode as BusinessScopeType,
        linkedDeals,
        linkedDealCount: linkedDeals.length,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createAlliance(
    businessScope: BusinessScopeType,
    input: CreateAllianceInput,
    actorUserId: string,
): Promise<{ id: string }> {
    const businessUnit = await getBusinessUnitOrThrow(businessScope);

    const id = nextId();
    const now = new Date();

    await db.insert(alliances).values({
        id,
        businessUnitId: businessUnit.id,
        name: input.name.trim(),
        allianceType: input.allianceType ?? 'COMPANY',
        contactPersonName: input.contactPersonName ?? null,
        contactPersonRole: input.contactPersonRole ?? null,
        contactPersonEmail: input.contactPersonEmail ?? null,
        contactPersonPhone: input.contactPersonPhone ?? null,
        agreementSummary: input.agreementSummary ?? null,
        relationshipStatus: input.relationshipStatus ?? 'PROSPECT',
        notes: input.notes ?? null,
        createdByUserId: actorUserId,
        createdAt: now,
        updatedAt: now,
    });

    return { id };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateAlliance(
    allianceId: string,
    businessScope: BusinessScopeType,
    input: UpdateAllianceInput,
): Promise<void> {
    const businessUnit = await getBusinessUnitOrThrow(businessScope);
    await verifyAllianceScope(allianceId, businessUnit.id);

    await db
        .update(alliances)
        .set({
            ...(input.name !== undefined && { name: input.name.trim() }),
            ...(input.allianceType !== undefined && { allianceType: input.allianceType }),
            ...(input.contactPersonName !== undefined && { contactPersonName: input.contactPersonName }),
            ...(input.contactPersonRole !== undefined && { contactPersonRole: input.contactPersonRole }),
            ...(input.contactPersonEmail !== undefined && { contactPersonEmail: input.contactPersonEmail }),
            ...(input.contactPersonPhone !== undefined && { contactPersonPhone: input.contactPersonPhone }),
            ...(input.agreementSummary !== undefined && { agreementSummary: input.agreementSummary }),
            ...(input.relationshipStatus !== undefined && { relationshipStatus: input.relationshipStatus }),
            ...(input.notes !== undefined && { notes: input.notes }),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(alliances.id, allianceId),
                eq(alliances.businessUnitId, businessUnit.id),
                isNull(alliances.deletedAt),
            ),
        );
}

// ─── Deal Links ───────────────────────────────────────────────────────────────

export async function linkAllianceToDeal(input: {
    businessScope: BusinessScopeType;
    allianceId: string;
    dealId: string;
    referralType: AllianceReferralType;
    note?: string;
}): Promise<void> {
    const businessUnit = await getBusinessUnitOrThrow(input.businessScope);
    await Promise.all([
        verifyAllianceScope(input.allianceId, businessUnit.id),
        verifyDealScope(input.dealId, businessUnit.id),
    ]);

    const id = nextId();
    await db.insert(allianceDealLinks).values({
        id,
        allianceId: input.allianceId,
        dealId: input.dealId,
        referralType: input.referralType,
        note: input.note ?? null,
    });
}

export async function unlinkAllianceFromDeal(
    allianceId: string,
    dealId: string,
    businessScope: BusinessScopeType,
): Promise<void> {
    const businessUnit = await getBusinessUnitOrThrow(businessScope);
    await Promise.all([
        verifyAllianceScope(allianceId, businessUnit.id),
        verifyDealScope(dealId, businessUnit.id),
    ]);

    await db
        .delete(allianceDealLinks)
        .where(and(eq(allianceDealLinks.allianceId, allianceId), eq(allianceDealLinks.dealId, dealId)));
}

// ─── Linked alliances for a deal ─────────────────────────────────────────────

export interface DealLinkedAlliance {
    allianceId: string;
    allianceName: string;
    allianceType: AllianceType;
    referralType: AllianceReferralType;
    note: string | null;
}

export async function listAlliancesForDeal(
    dealId: string,
    businessScope: BusinessScopeType,
): Promise<DealLinkedAlliance[]> {
    const businessUnit = await getBusinessUnitOrThrow(businessScope);
    await verifyDealScope(dealId, businessUnit.id);

    const rows = await db
        .select({
            allianceId: allianceDealLinks.allianceId,
            allianceName: alliances.name,
            allianceType: alliances.allianceType,
            referralType: allianceDealLinks.referralType,
            note: allianceDealLinks.note,
        })
        .from(allianceDealLinks)
        .innerJoin(alliances, eq(allianceDealLinks.allianceId, alliances.id))
        .where(
            and(
                eq(allianceDealLinks.dealId, dealId),
                eq(alliances.businessUnitId, businessUnit.id),
                isNull(alliances.deletedAt),
            ),
        );

    return rows.map((r) => ({
        allianceId: r.allianceId,
        allianceName: r.allianceName,
        allianceType: r.allianceType as AllianceType,
        referralType: r.referralType as AllianceReferralType,
        note: r.note,
    }));
}

// ─── List all alliances (for selects) ────────────────────────────────────────

export async function listAllianceOptions(businessScope: BusinessScopeType): Promise<{ id: string; name: string }[]> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) return [];

    return db
        .select({ id: alliances.id, name: alliances.name })
        .from(alliances)
        .where(and(eq(alliances.businessUnitId, businessUnit.id), isNull(alliances.deletedAt), eq(alliances.relationshipStatus, 'ACTIVE')))
        .orderBy(alliances.name);
}
