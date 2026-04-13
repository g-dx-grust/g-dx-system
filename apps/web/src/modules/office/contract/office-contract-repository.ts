import { db } from '@g-dx/database';
import { businessUnits, companies, contracts, users } from '@g-dx/database/schema';
import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import type { BusinessScopeType, ContractStatus } from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';

export interface OfficeContractItem {
    id: string;
    title: string;
    contractNumber: string | null;
    contractStatus: ContractStatus;
    company: { id: string; name: string };
    ownerUser: { id: string; name: string };
    amount: number | null;
    contractDate: string | null;
    invoiceDate: string | null;
    paymentDate: string | null;
    serviceStartDate: string | null;
    createdAt: Date;
}

export interface OfficeContractFilters {
    keyword?: string;
    contractStatus?: ContractStatus;
}

export async function listContractsForOffice(
    businessScope: BusinessScopeType,
    filters: OfficeContractFilters = {},
): Promise<{ data: OfficeContractItem[]; total: number }> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const rows = await db
        .select({
            id: contracts.id,
            title: contracts.title,
            contractNumber: contracts.contractNumber,
            contractStatus: contracts.contractStatus,
            amount: contracts.amount,
            contractDate: contracts.contractDate,
            invoiceDate: contracts.invoiceDate,
            paymentDate: contracts.paymentDate,
            serviceStartDate: contracts.serviceStartDate,
            createdAt: contracts.createdAt,
            companyId: companies.id,
            companyName: companies.displayName,
            ownerUserId: users.id,
            ownerUserName: users.displayName,
        })
        .from(contracts)
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .innerJoin(users, eq(contracts.ownerUserId, users.id))
        .where(
            and(
                eq(contracts.businessUnitId, businessUnit.id),
                isNull(contracts.deletedAt),
                filters.contractStatus ? eq(contracts.contractStatus, filters.contractStatus) : undefined,
                filters.keyword
                    ? or(
                          ilike(contracts.title, `%${filters.keyword}%`),
                          ilike(companies.displayName, `%${filters.keyword}%`),
                      )
                    : undefined,
            ),
        )
        .orderBy(desc(contracts.createdAt));

    const data: OfficeContractItem[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        contractNumber: r.contractNumber ?? null,
        contractStatus: r.contractStatus as ContractStatus,
        company: { id: r.companyId, name: r.companyName ?? '' },
        ownerUser: { id: r.ownerUserId, name: r.ownerUserName ?? '名前未設定' },
        amount: r.amount !== null ? Number(r.amount) : null,
        contractDate: r.contractDate ?? null,
        invoiceDate: r.invoiceDate ?? null,
        paymentDate: r.paymentDate ?? null,
        serviceStartDate: r.serviceStartDate ?? null,
        createdAt: r.createdAt,
    }));

    return { data, total: data.length };
}
