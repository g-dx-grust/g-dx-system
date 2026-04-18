import { db } from '@g-dx/database';
import { facilities, companies, contracts, users, businessUnits } from '@g-dx/database/schema';
import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import type { FacilityDetail, FacilityListItem, JetContractListItem } from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';

// ─── List ──────────────────────────────────────────────────────────────────────

export async function listFacilities(keyword?: string): Promise<FacilityListItem[]> {
    const rows = await db
        .select({
            id: facilities.id,
            companyId: facilities.companyId,
            companyName: companies.displayName,
            name: facilities.name,
            prefecture: facilities.prefecture,
            city: facilities.city,
            addressLine1: facilities.addressLine1,
            managerName: facilities.managerName,
        })
        .from(facilities)
        .innerJoin(companies, eq(facilities.companyId, companies.id))
        .where(
            and(
                isNull(facilities.deletedAt),
                keyword
                    ? or(
                        ilike(facilities.name, `%${keyword}%`),
                        ilike(companies.displayName, `%${keyword}%`),
                        ilike(facilities.managerName, `%${keyword}%`)
                    )
                    : undefined
            )
        )
        .orderBy(companies.displayName, facilities.name);

    // Count contracts per facility
    const contractCounts = await db
        .select({ facilityId: contracts.facilityId, total: count() })
        .from(contracts)
        .where(isNull(contracts.deletedAt))
        .groupBy(contracts.facilityId);

    const countMap = new Map(contractCounts.map((r) => [r.facilityId, Number(r.total)]));

    return rows.map((row) => ({
        id: row.id,
        companyId: row.companyId,
        companyName: row.companyName,
        name: row.name,
        prefecture: row.prefecture,
        city: row.city,
        addressLine1: row.addressLine1,
        managerName: row.managerName,
        contractCount: countMap.get(row.id) ?? 0,
    }));
}

// ─── Detail ────────────────────────────────────────────────────────────────────

export async function getFacilityDetail(facilityId: string): Promise<FacilityDetail> {
    const [row] = await db
        .select({
            id: facilities.id,
            companyId: facilities.companyId,
            companyName: companies.displayName,
            name: facilities.name,
            postalCode: facilities.postalCode,
            prefecture: facilities.prefecture,
            city: facilities.city,
            addressLine1: facilities.addressLine1,
            mainPhone: facilities.mainPhone,
            managerName: facilities.managerName,
            memo: facilities.memo,
            createdAt: facilities.createdAt,
            updatedAt: facilities.updatedAt,
        })
        .from(facilities)
        .innerJoin(companies, eq(facilities.companyId, companies.id))
        .where(and(eq(facilities.id, facilityId), isNull(facilities.deletedAt)))
        .limit(1);

    if (!row) throw new AppError('NOT_FOUND', `Facility ${facilityId} not found`);

    const contractRows = await db
        .select({
            id: contracts.id,
            title: contracts.title,
            contractNumber: contracts.contractNumber,
            contractStatus: contracts.contractStatus,
            companyId: contracts.companyId,
            companyName: companies.displayName,
            facilityId: contracts.facilityId,
            facilityName: facilities.name,
            ownerId: contracts.ownerUserId,
            ownerName: users.displayName,
            amount: contracts.amount,
            serviceStartDate: contracts.serviceStartDate,
            serviceEndDate: contracts.serviceEndDate,
            terminationDate: contracts.terminationDate,
            rebateRequired: contracts.rebateRequired,
            rebateAmount: contracts.rebateAmount,
            rebateStatus: contracts.rebateStatus,
            gdxReferralPossible: contracts.gdxReferralPossible,
            gdxReferralStatus: contracts.gdxReferralStatus,
            createdAt: contracts.createdAt,
        })
        .from(contracts)
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .leftJoin(facilities, eq(contracts.facilityId, facilities.id))
        .leftJoin(users, eq(contracts.ownerUserId, users.id))
        .where(and(eq(contracts.facilityId, facilityId), isNull(contracts.deletedAt)))
        .orderBy(desc(contracts.createdAt));

    return {
        id: row.id,
        companyId: row.companyId,
        companyName: row.companyName,
        name: row.name,
        postalCode: row.postalCode ?? null,
        prefecture: row.prefecture ?? null,
        city: row.city ?? null,
        addressLine1: row.addressLine1 ?? null,
        mainPhone: row.mainPhone ?? null,
        managerName: row.managerName ?? null,
        memo: row.memo ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        relatedContracts: contractRows.map((c) => ({
            id: c.id,
            title: c.title,
            contractNumber: c.contractNumber ?? null,
            contractStatus: c.contractStatus as JetContractListItem['contractStatus'],
            company: { id: c.companyId, name: c.companyName },
            facility: c.facilityId ? { id: c.facilityId, name: c.facilityName ?? '' } : null,
            ownerUser: { id: c.ownerId, name: c.ownerName ?? '-' },
            amount: c.amount !== null ? Number(c.amount) : null,
            serviceStartDate: c.serviceStartDate ?? null,
            serviceEndDate: c.serviceEndDate ?? null,
            terminationDate: c.terminationDate ?? null,
            rebateRequired: c.rebateRequired ?? null,
            rebateAmount: c.rebateAmount !== null ? Number(c.rebateAmount) : null,
            rebateStatus: (c.rebateStatus as JetContractListItem['rebateStatus']) ?? null,
            gdxReferralPossible: c.gdxReferralPossible ?? null,
            gdxReferralStatus: (c.gdxReferralStatus as JetContractListItem['gdxReferralStatus']) ?? null,
            createdAt: c.createdAt.toISOString(),
        })),
    };
}

// ─── Create / Update ───────────────────────────────────────────────────────────

interface UpsertFacilityData {
    companyId: string;
    name: string;
    postalCode?: string;
    prefecture?: string;
    city?: string;
    addressLine1?: string;
    mainPhone?: string;
    managerName?: string;
    memo?: string;
}

export async function createFacility(data: UpsertFacilityData, createdByUserId: string): Promise<string> {
    const [row] = await db
        .insert(facilities)
        .values({
            companyId: data.companyId,
            name: data.name,
            postalCode: data.postalCode ?? null,
            prefecture: data.prefecture ?? null,
            city: data.city ?? null,
            addressLine1: data.addressLine1 ?? null,
            mainPhone: data.mainPhone ?? null,
            managerName: data.managerName ?? null,
            memo: data.memo ?? null,
            createdByUserId,
        })
        .returning({ id: facilities.id });

    return row.id;
}

export async function updateFacility(facilityId: string, data: Partial<Omit<UpsertFacilityData, 'companyId'>>): Promise<void> {
    await db
        .update(facilities)
        .set({
            ...(data.name !== undefined && { name: data.name }),
            ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
            ...(data.prefecture !== undefined && { prefecture: data.prefecture }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
            ...(data.mainPhone !== undefined && { mainPhone: data.mainPhone }),
            ...(data.managerName !== undefined && { managerName: data.managerName }),
            ...(data.memo !== undefined && { memo: data.memo }),
            updatedAt: new Date(),
        })
        .where(and(eq(facilities.id, facilityId), isNull(facilities.deletedAt)));
}
