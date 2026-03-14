import { db } from '@g-dx/database';
import { auditLogs } from '@g-dx/database/schema';
import { businessUnits, companies, contacts, contracts, deals, users } from '@g-dx/database/schema';
import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type {
    BusinessScopeType,
    ContractDetail,
    ContractDashboardSummary,
    ContractListItem,
    ContractStatus,
    UUID,
} from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';

function nextId() {
    return crypto.randomUUID();
}
function nextAuditId() {
    return crypto.randomUUID();
}

// ─── List ─────────────────────────────────────────────────────────────────────

export interface ContractListFilters {
    keyword?: string;
    contractStatus?: ContractStatus;
}

export async function listContracts(
    businessScope: BusinessScopeType,
    filters: ContractListFilters = {},
): Promise<{ data: ContractListItem[]; total: number }> {
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
            serviceStartDate: contracts.serviceStartDate,
            serviceEndDate: contracts.serviceEndDate,
            dealId: contracts.dealId,
            createdAt: contracts.createdAt,
            companyId: companies.id,
            companyName: companies.displayName,
            ownerUserId: users.id,
            ownerUserName: users.displayName,
            businessScopeCode: businessUnits.code,
        })
        .from(contracts)
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .innerJoin(users, eq(contracts.ownerUserId, users.id))
        .innerJoin(businessUnits, eq(contracts.businessUnitId, businessUnits.id))
        .where(
            and(
                eq(contracts.businessUnitId, businessUnit.id),
                isNull(contracts.deletedAt),
                filters.contractStatus ? eq(contracts.contractStatus, filters.contractStatus) : undefined,
                filters.keyword
                    ? or(
                          ilike(contracts.title, `%${filters.keyword}%`),
                          ilike(companies.displayName, `%${filters.keyword}%`),
                          contracts.contractNumber ? ilike(contracts.contractNumber, `%${filters.keyword}%`) : undefined,
                      )
                    : undefined,
            ),
        )
        .orderBy(desc(contracts.createdAt));

    const data: ContractListItem[] = rows.map((row) => ({
        id: row.id as UUID,
        businessScope: row.businessScopeCode as BusinessScopeType,
        title: row.title,
        contractNumber: row.contractNumber,
        contractStatus: row.contractStatus as ContractStatus,
        company: { id: row.companyId as UUID, name: row.companyName },
        ownerUser: { id: row.ownerUserId as UUID, name: row.ownerUserName ?? 'Unknown' },
        amount: row.amount !== null ? Number(row.amount) : null,
        contractDate: row.contractDate,
        serviceStartDate: row.serviceStartDate,
        serviceEndDate: row.serviceEndDate,
        dealId: row.dealId as UUID | null,
        createdAt: row.createdAt.toISOString(),
    }));

    return { data, total: data.length };
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getContractById(contractId: string): Promise<ContractDetail | null> {
    const fsUsers = alias(users, 'fs_users');
    const isUsers = alias(users, 'is_users');

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
            serviceEndDate: contracts.serviceEndDate,
            dealId: contracts.dealId,
            memo: contracts.memo,
            fsInChargeUserId: contracts.fsInChargeUserId,
            fsInChargeUserName: fsUsers.displayName,
            isInChargeUserId: contracts.isInChargeUserId,
            isInChargeUserName: isUsers.displayName,
            productCode: contracts.productCode,
            hasSubsidy: contracts.hasSubsidy,
            licensePlanCode: contracts.licensePlanCode,
            freeSupportMonths: contracts.freeSupportMonths,
            enterpriseLicenseCount: contracts.enterpriseLicenseCount,
            proLicenseCount: contracts.proLicenseCount,
            a2LicenseCount: contracts.a2LicenseCount,
            createdAt: contracts.createdAt,
            updatedAt: contracts.updatedAt,
            companyId: companies.id,
            companyName: companies.displayName,
            ownerUserId: users.id,
            ownerUserName: users.displayName,
            contactId: contacts.id,
            contactName: contacts.fullName,
            businessScopeCode: businessUnits.code,
        })
        .from(contracts)
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .innerJoin(users, eq(contracts.ownerUserId, users.id))
        .innerJoin(businessUnits, eq(contracts.businessUnitId, businessUnits.id))
        .leftJoin(contacts, eq(contracts.primaryContactId, contacts.id))
        .leftJoin(fsUsers, eq(contracts.fsInChargeUserId, fsUsers.id))
        .leftJoin(isUsers, eq(contracts.isInChargeUserId, isUsers.id))
        .where(and(eq(contracts.id, contractId), isNull(contracts.deletedAt)))
        .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];

    return {
        id: row.id as UUID,
        businessScope: row.businessScopeCode as BusinessScopeType,
        title: row.title,
        contractNumber: row.contractNumber,
        contractStatus: row.contractStatus as ContractStatus,
        company: { id: row.companyId as UUID, name: row.companyName },
        ownerUser: { id: row.ownerUserId as UUID, name: row.ownerUserName ?? 'Unknown' },
        primaryContact: row.contactId ? { id: row.contactId as UUID, name: row.contactName ?? '' } : null,
        amount: row.amount !== null ? Number(row.amount) : null,
        contractDate: row.contractDate,
        invoiceDate: row.invoiceDate,
        paymentDate: row.paymentDate,
        serviceStartDate: row.serviceStartDate,
        serviceEndDate: row.serviceEndDate,
        dealId: row.dealId as UUID | null,
        memo: row.memo,
        fsInChargeUser: row.fsInChargeUserId ? { id: row.fsInChargeUserId as UUID, name: row.fsInChargeUserName ?? 'Unknown' } : null,
        isInChargeUser: row.isInChargeUserId ? { id: row.isInChargeUserId as UUID, name: row.isInChargeUserName ?? 'Unknown' } : null,
        productCode: row.productCode,
        hasSubsidy: row.hasSubsidy,
        licensePlanCode: row.licensePlanCode,
        freeSupportMonths: row.freeSupportMonths,
        enterpriseLicenseCount: row.enterpriseLicenseCount,
        proLicenseCount: row.proLicenseCount,
        a2LicenseCount: row.a2LicenseCount,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateContractInput {
    businessScope: BusinessScopeType;
    dealId?: string;
    companyId: string;
    title: string;
    contractNumber?: string;
    contractStatus?: ContractStatus;
    amount?: number;
    contractDate?: string;
    invoiceDate?: string;
    paymentDate?: string;
    serviceStartDate?: string;
    serviceEndDate?: string;
    memo?: string;
    ownerUserId: string;
    actorUserId: string;
    fsInChargeUserId?: string;
    isInChargeUserId?: string;
    productCode?: string;
    hasSubsidy?: boolean;
    licensePlanCode?: string;
    freeSupportMonths?: number;
    enterpriseLicenseCount?: number;
    proLicenseCount?: number;
    a2LicenseCount?: number;
}

export async function createContract(input: CreateContractInput): Promise<{ id: string }> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const id = nextId();
    const now = new Date();

    await db.transaction(async (tx) => {
        await tx.insert(contracts).values({
            id,
            businessUnitId: businessUnit.id,
            dealId: input.dealId ?? null,
            companyId: input.companyId,
            ownerUserId: input.ownerUserId,
            title: input.title.trim(),
            contractNumber: input.contractNumber ?? null,
            contractStatus: input.contractStatus ?? 'CONTRACTED',
            amount: input.amount !== undefined ? String(input.amount) : null,
            contractDate: input.contractDate ?? null,
            invoiceDate: input.invoiceDate ?? null,
            paymentDate: input.paymentDate ?? null,
            serviceStartDate: input.serviceStartDate ?? null,
            serviceEndDate: input.serviceEndDate ?? null,
            memo: input.memo ?? null,
            fsInChargeUserId: input.fsInChargeUserId ?? null,
            isInChargeUserId: input.isInChargeUserId ?? null,
            productCode: input.productCode ?? null,
            hasSubsidy: input.hasSubsidy ?? null,
            licensePlanCode: input.licensePlanCode ?? null,
            freeSupportMonths: input.freeSupportMonths ?? null,
            enterpriseLicenseCount: input.enterpriseLicenseCount ?? null,
            proLicenseCount: input.proLicenseCount ?? null,
            a2LicenseCount: input.a2LicenseCount ?? null,
            createdAt: now,
            updatedAt: now,
            createdByUserId: input.actorUserId,
            updatedByUserId: input.actorUserId,
        });

        await tx.insert(auditLogs).values({
            id: Date.now(),
            tableName: 'contracts',
            recordPk: id,
            action: 'INSERT',
            actorUserId: input.actorUserId,
            sourceType: 'web',
            afterData: { title: input.title, contractStatus: input.contractStatus ?? 'CONTRACTED' },
        });
    });

    return { id };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateContractInput {
    contractId: string;
    title?: string;
    contractNumber?: string | null;
    contractStatus?: ContractStatus;
    amount?: number | null;
    contractDate?: string | null;
    invoiceDate?: string | null;
    paymentDate?: string | null;
    serviceStartDate?: string | null;
    serviceEndDate?: string | null;
    memo?: string | null;
    fsInChargeUserId?: string | null;
    isInChargeUserId?: string | null;
    productCode?: string | null;
    hasSubsidy?: boolean | null;
    licensePlanCode?: string | null;
    freeSupportMonths?: number | null;
    enterpriseLicenseCount?: number | null;
    proLicenseCount?: number | null;
    a2LicenseCount?: number | null;
    actorUserId: string;
}

export async function updateContract(input: UpdateContractInput): Promise<void> {
    const existing = await getContractById(input.contractId);
    if (!existing) throw new AppError('NOT_FOUND');

    const updatedAt = new Date();

    await db
        .update(contracts)
        .set({
            ...(input.title !== undefined && { title: input.title.trim() }),
            ...(input.contractNumber !== undefined && { contractNumber: input.contractNumber }),
            ...(input.contractStatus !== undefined && { contractStatus: input.contractStatus }),
            ...(input.amount !== undefined && { amount: input.amount !== null ? String(input.amount) : null }),
            ...(input.contractDate !== undefined && { contractDate: input.contractDate }),
            ...(input.invoiceDate !== undefined && { invoiceDate: input.invoiceDate }),
            ...(input.paymentDate !== undefined && { paymentDate: input.paymentDate }),
            ...(input.serviceStartDate !== undefined && { serviceStartDate: input.serviceStartDate }),
            ...(input.serviceEndDate !== undefined && { serviceEndDate: input.serviceEndDate }),
            ...(input.memo !== undefined && { memo: input.memo }),
            ...(input.fsInChargeUserId !== undefined && { fsInChargeUserId: input.fsInChargeUserId }),
            ...(input.isInChargeUserId !== undefined && { isInChargeUserId: input.isInChargeUserId }),
            ...(input.productCode !== undefined && { productCode: input.productCode }),
            ...(input.hasSubsidy !== undefined && { hasSubsidy: input.hasSubsidy }),
            ...(input.licensePlanCode !== undefined && { licensePlanCode: input.licensePlanCode }),
            ...(input.freeSupportMonths !== undefined && { freeSupportMonths: input.freeSupportMonths }),
            ...(input.enterpriseLicenseCount !== undefined && { enterpriseLicenseCount: input.enterpriseLicenseCount }),
            ...(input.proLicenseCount !== undefined && { proLicenseCount: input.proLicenseCount }),
            ...(input.a2LicenseCount !== undefined && { a2LicenseCount: input.a2LicenseCount }),
            updatedAt,
            updatedByUserId: input.actorUserId,
        })
        .where(eq(contracts.id, input.contractId));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getContractDashboardSummary(businessScope: BusinessScopeType): Promise<ContractDashboardSummary> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const allContracts = await db
        .select({
            id: contracts.id,
            contractStatus: contracts.contractStatus,
            amount: contracts.amount,
        })
        .from(contracts)
        .where(and(eq(contracts.businessUnitId, businessUnit.id), isNull(contracts.deletedAt)));

    const statusLabels: Record<ContractStatus, string> = {
        CONTRACTED: '契約',
        INVOICED: '請求書発行',
        PAID: '入金済み',
        SERVICE_STARTED: 'サービス開始',
        SERVICE_ENDED: 'サービス終了',
    };

    const statusMap = new Map<ContractStatus, { count: number; totalAmount: number }>();
    const statuses: ContractStatus[] = ['CONTRACTED', 'INVOICED', 'PAID', 'SERVICE_STARTED', 'SERVICE_ENDED'];
    for (const s of statuses) statusMap.set(s, { count: 0, totalAmount: 0 });

    let totalContracts = 0;
    let contractedCount = 0; let contractedAmount = 0;
    let invoicedCount = 0; let invoicedAmount = 0;
    let paidCount = 0; let paidAmount = 0;
    let activeServiceCount = 0; let activeServiceAmount = 0;

    for (const c of allContracts) {
        totalContracts++;
        const amount = c.amount !== null ? Number(c.amount) : 0;
        const status = c.contractStatus as ContractStatus;
        const existing = statusMap.get(status) ?? { count: 0, totalAmount: 0 };
        statusMap.set(status, { count: existing.count + 1, totalAmount: existing.totalAmount + amount });

        if (status === 'CONTRACTED') { contractedCount++; contractedAmount += amount; }
        else if (status === 'INVOICED') { invoicedCount++; invoicedAmount += amount; }
        else if (status === 'PAID') { paidCount++; paidAmount += amount; }
        else if (status === 'SERVICE_STARTED') { activeServiceCount++; activeServiceAmount += amount; }
    }

    const byStatus = statuses.map((s) => ({
        status: s,
        label: statusLabels[s],
        count: statusMap.get(s)?.count ?? 0,
        totalAmount: statusMap.get(s)?.totalAmount ?? 0,
    }));

    // Recent contracts
    const recentRows = await db
        .select({
            id: contracts.id,
            title: contracts.title,
            contractNumber: contracts.contractNumber,
            contractStatus: contracts.contractStatus,
            amount: contracts.amount,
            contractDate: contracts.contractDate,
            serviceStartDate: contracts.serviceStartDate,
            serviceEndDate: contracts.serviceEndDate,
            dealId: contracts.dealId,
            createdAt: contracts.createdAt,
            companyId: companies.id,
            companyName: companies.displayName,
            ownerUserId: users.id,
            ownerUserName: users.displayName,
            businessScopeCode: businessUnits.code,
        })
        .from(contracts)
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .innerJoin(users, eq(contracts.ownerUserId, users.id))
        .innerJoin(businessUnits, eq(contracts.businessUnitId, businessUnits.id))
        .where(and(eq(contracts.businessUnitId, businessUnit.id), isNull(contracts.deletedAt)))
        .orderBy(desc(contracts.createdAt))
        .limit(10);

    const recentContracts: ContractListItem[] = recentRows.map((row) => ({
        id: row.id as UUID,
        businessScope: row.businessScopeCode as BusinessScopeType,
        title: row.title,
        contractNumber: row.contractNumber,
        contractStatus: row.contractStatus as ContractStatus,
        company: { id: row.companyId as UUID, name: row.companyName },
        ownerUser: { id: row.ownerUserId as UUID, name: row.ownerUserName ?? 'Unknown' },
        amount: row.amount !== null ? Number(row.amount) : null,
        contractDate: row.contractDate,
        serviceStartDate: row.serviceStartDate,
        serviceEndDate: row.serviceEndDate,
        dealId: row.dealId as UUID | null,
        createdAt: row.createdAt.toISOString(),
    }));

    return {
        totalContracts,
        byStatus,
        contractedGroup: { count: contractedCount, totalAmount: contractedAmount },
        invoicedGroup: { count: invoicedCount, totalAmount: invoicedAmount },
        paidGroup: { count: paidCount, totalAmount: paidAmount },
        activeServiceGroup: { count: activeServiceCount, totalAmount: activeServiceAmount },
        recentContracts,
    };
}
