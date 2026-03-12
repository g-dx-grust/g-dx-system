import { db } from '@g-dx/database';
import { contracts, companies, facilities, users, businessUnits } from '@g-dx/database/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { JetContractListItem } from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';

export async function listJetContracts(businessScope: string): Promise<JetContractListItem[]> {
    const [bu] = await db
        .select({ id: businessUnits.id })
        .from(businessUnits)
        .where(eq(businessUnits.code, businessScope))
        .limit(1);

    if (!bu) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const rows = await db
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
        .where(and(eq(contracts.businessUnitId, bu.id), isNull(contracts.deletedAt)))
        .orderBy(desc(contracts.createdAt));

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        contractNumber: row.contractNumber ?? null,
        contractStatus: row.contractStatus as JetContractListItem['contractStatus'],
        company: { id: row.companyId, name: row.companyName },
        facility: row.facilityId ? { id: row.facilityId, name: row.facilityName ?? '' } : null,
        ownerUser: { id: row.ownerId, name: row.ownerName ?? '-' },
        amount: row.amount !== null ? Number(row.amount) : null,
        serviceStartDate: row.serviceStartDate ?? null,
        serviceEndDate: row.serviceEndDate ?? null,
        terminationDate: row.terminationDate ?? null,
        rebateRequired: row.rebateRequired ?? null,
        rebateAmount: row.rebateAmount !== null ? Number(row.rebateAmount) : null,
        rebateStatus: (row.rebateStatus as JetContractListItem['rebateStatus']) ?? null,
        gdxReferralPossible: row.gdxReferralPossible ?? null,
        gdxReferralStatus: (row.gdxReferralStatus as JetContractListItem['gdxReferralStatus']) ?? null,
        createdAt: row.createdAt.toISOString(),
    }));
}
