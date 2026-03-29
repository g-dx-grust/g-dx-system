import { db } from '@g-dx/database';
import {
    auditLogs,
    businessUnits,
    companies,
    companyBusinessProfiles,
    companyContactLinks,
    contactBusinessProfiles,
    contacts,
    deals,
    leadSourceHistory,
    pipelineStages,
    users,
} from '@g-dx/database/schema';
import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { BusinessScopeType, CompanyDetail } from '@g-dx/contracts';
import type {
    CompanyListFilters,
    CompanyListResult,
    CreateCompanyInput,
    CreatedCompany,
    UpdateCompanyInput,
    UpdatedCompany,
} from '@/modules/customer-management/company/domain/company';
import {
    findBusinessUnitByScope,
    nextAuditId,
} from '@/modules/customer-management/shared/infrastructure/customer-shared';
import { AppError } from '@/shared/server/errors';
import { normalizeCompanyName } from '../domain/normalize-company-name';

type CompanyProfileAttributes = {
    industry?: string;
    tags?: string[];
};

function formatAddress(parts: Array<string | null>): string | null {
    const values = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));
    return values.length > 0 ? values.join(' ') : null;
}

export async function listCompanies(filters: CompanyListFilters): Promise<CompanyListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const offset = (page - 1) * pageSize;
    const businessUnit = await findBusinessUnitByScope(filters.businessScope);

    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const whereClause = and(
        eq(companyBusinessProfiles.businessUnitId, businessUnit.id),
        filters.keyword
            ? sql`(${companies.displayName} ilike ${`%${filters.keyword}%`} or ${companies.legalName} ilike ${`%${filters.keyword}%`})`
            : undefined
    );

    const rows = await db
        .select({
            id: companies.id,
            name: companies.displayName,
            phone: companies.mainPhone,
            website: companies.website,
            postalCode: companies.postalCode,
            prefecture: companies.prefecture,
            city: companies.city,
            addressLine1: companies.addressLine1,
            addressLine2: companies.addressLine2,
            profileAttributes: companyBusinessProfiles.profileAttributes,
            leadSourceCode: companyBusinessProfiles.leadSourceCode,
            ownerUserId: users.id,
            ownerUserName: users.displayName,
        })
        .from(companyBusinessProfiles)
        .innerJoin(companies, eq(companyBusinessProfiles.companyId, companies.id))
        .leftJoin(users, eq(companyBusinessProfiles.ownerUserId, users.id))
        .where(whereClause)
        .orderBy(desc(companies.updatedAt))
        .limit(pageSize)
        .offset(offset);

    const [{ total }] = await db
        .select({
            total: count(),
        })
        .from(companyBusinessProfiles)
        .innerJoin(companies, eq(companyBusinessProfiles.companyId, companies.id))
        .where(whereClause);

    const companyIds = rows.map((row) => row.id);
    const sharedCounts =
        companyIds.length === 0
            ? []
            : await db
                .select({
                    companyId: companyBusinessProfiles.companyId,
                    profileCount: count(),
                })
                .from(companyBusinessProfiles)
                .where(inArray(companyBusinessProfiles.companyId, companyIds))
                .groupBy(companyBusinessProfiles.companyId);

    const sharedMap = new Map(sharedCounts.map((row) => [row.companyId, Number(row.profileCount) > 1]));

    return {
        data: rows.map((row) => {
            const attributes = (row.profileAttributes ?? {}) as CompanyProfileAttributes;
            return {
                id: row.id,
                name: row.name,
                industry: attributes.industry ?? null,
                phone: row.phone ?? null,
                website: row.website ?? null,
                address: formatAddress([row.postalCode, row.prefecture, row.city, row.addressLine1, row.addressLine2]),
                leadSource: row.leadSourceCode ?? null,
                sharedAcrossBusinesses: sharedMap.get(row.id) ?? false,
                tags: Array.isArray(attributes.tags) ? attributes.tags : [],
                ownerUser: row.ownerUserId
                    ? {
                        id: row.ownerUserId,
                        name: row.ownerUserName ?? 'Unknown User',
                    }
                    : null,
            };
        }),
        meta: {
            page,
            pageSize,
            total: Number(total),
        },
    };
}

export async function getCompanyDetail(
    companyId: string,
    businessScope: BusinessScopeType,
    visibleBusinessScopes: BusinessScopeType[]
): Promise<CompanyDetail> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const [row] = await db
        .select({
            id: companies.id,
            name: companies.displayName,
            phone: companies.mainPhone,
            website: companies.website,
            postalCode: companies.postalCode,
            prefecture: companies.prefecture,
            city: companies.city,
            addressLine1: companies.addressLine1,
            addressLine2: companies.addressLine2,
            profileAttributes: companyBusinessProfiles.profileAttributes,
            leadSourceCode: companyBusinessProfiles.leadSourceCode,
            ownerUserId: users.id,
            ownerUserName: users.displayName,
        })
        .from(companyBusinessProfiles)
        .innerJoin(companies, eq(companyBusinessProfiles.companyId, companies.id))
        .leftJoin(users, eq(companyBusinessProfiles.ownerUserId, users.id))
        .where(
            and(
                eq(companyBusinessProfiles.companyId, companyId),
                eq(companyBusinessProfiles.businessUnitId, businessUnit.id)
            )
        )
        .limit(1);

    if (!row) {
        throw new AppError('NOT_FOUND', 'Company was not found in the active business scope.');
    }

    const attributes = (row.profileAttributes ?? {}) as CompanyProfileAttributes;

    // Run independent queries in parallel for faster response
    const [contactRows, openDealRows, relatedDealRows] = await Promise.all([
        db
            .select({
                id: contacts.id,
                name: contacts.fullName,
                department: contacts.department,
                jobTitle: contacts.jobTitle,
                email: contacts.email,
                phone: contacts.mobilePhone,
            })
            .from(companyContactLinks)
            .innerJoin(contacts, eq(companyContactLinks.contactId, contacts.id))
            .innerJoin(
                contactBusinessProfiles,
                and(
                    eq(contactBusinessProfiles.contactId, contacts.id),
                    eq(contactBusinessProfiles.businessUnitId, businessUnit.id)
                )
            )
            .where(eq(companyContactLinks.companyId, companyId))
            .orderBy(desc(companyContactLinks.isPrimary), contacts.fullName),

        visibleBusinessScopes.length === 0
            ? Promise.resolve([])
            : db
                .select({
                    businessScope: businessUnits.code,
                    total: count(),
                })
                .from(deals)
                .innerJoin(businessUnits, eq(deals.businessUnitId, businessUnits.id))
                .where(
                    and(
                        eq(deals.companyId, companyId),
                        inArray(businessUnits.code, visibleBusinessScopes),
                        isNull(deals.deletedAt),
                        isNull(deals.wonAt),
                        isNull(deals.lostAt)
                    )
                )
                .groupBy(businessUnits.code),

        db
            .select({
                id: deals.id,
                title: deals.title,
                stageKey: pipelineStages.stageKey,
                stageName: pipelineStages.name,
                amount: deals.amount,
                ownerName: users.displayName,
                dealStatus: deals.dealStatus,
                expectedCloseDate: deals.expectedCloseDate,
                businessScopeCode: businessUnits.code,
            })
            .from(deals)
            .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
            .innerJoin(businessUnits, eq(deals.businessUnitId, businessUnits.id))
            .leftJoin(users, eq(deals.ownerUserId, users.id))
            .where(
                and(
                    eq(deals.companyId, companyId),
                    isNull(deals.deletedAt),
                    visibleBusinessScopes.length > 0
                        ? inArray(businessUnits.code, visibleBusinessScopes)
                        : undefined
                )
            )
            .orderBy(desc(deals.updatedAt))
            .limit(10),
    ]);

    const openDealsSummary: Partial<Record<BusinessScopeType, number>> = {};
    for (const summary of openDealRows) {
        openDealsSummary[summary.businessScope as BusinessScopeType] = Number(summary.total);
    }

    return {
        id: row.id,
        name: row.name,
        industry: attributes.industry ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        address: formatAddress([row.postalCode, row.prefecture, row.city, row.addressLine1, row.addressLine2]),
        leadSource: row.leadSourceCode ?? null,
        ownerUser: row.ownerUserId
            ? {
                id: row.ownerUserId,
                name: row.ownerUserName ?? 'Unknown User',
            }
            : null,
        contacts: contactRows.map((contact) => ({
            id: contact.id,
            name: contact.name,
            department: contact.department ?? null,
            title: contact.jobTitle ?? null,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
        })),
        openDealsSummary,
        relatedDeals: relatedDealRows.map((d) => ({
            id: d.id,
            businessScope: d.businessScopeCode,
            title: d.title,
            stageKey: d.stageKey,
            stageName: d.stageName,
            amount: d.amount !== null ? Number(d.amount) : null,
            ownerName: d.ownerName ?? '-',
            dealStatus: d.dealStatus,
            expectedCloseDate: d.expectedCloseDate,
        })),
    };
}

export async function createCompany(input: CreateCompanyInput): Promise<CreatedCompany> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const result = await db.transaction(async (tx) => {
        const normalizedName = normalizeCompanyName(input.name);
        const [existingCompany] = await tx
            .select({
                id: companies.id,
                name: companies.displayName,
                createdAt: companies.createdAt,
            })
            .from(companies)
            .where(eq(companies.normalizedName, normalizedName))
            .limit(1);

        if (existingCompany) {
            const [existingProfile] = await tx
                .select({
                    id: companyBusinessProfiles.id,
                })
                .from(companyBusinessProfiles)
                .where(
                    and(
                        eq(companyBusinessProfiles.companyId, existingCompany.id),
                        eq(companyBusinessProfiles.businessUnitId, businessUnit.id)
                    )
                )
                .limit(1);

            if (existingProfile) {
                throw new AppError('DUPLICATE_COMPANY', 'A company with the same name already exists in the active business scope.');
            }

            const [createdProfile] = await tx
                .insert(companyBusinessProfiles)
                .values({
                    companyId: existingCompany.id,
                    businessUnitId: businessUnit.id,
                    ownerUserId: input.ownerUserId ?? null,
                    customerStatus: 'active',
                    leadSourceCode: input.leadSource?.trim() || null,
                    initialLeadSourceCode: input.leadSource?.trim() || null,
                    profileAttributes: {
                        industry: input.industry?.trim() || undefined,
                        tags: input.tags ?? [],
                    },
                })
                .returning({
                    createdAt: companyBusinessProfiles.createdAt,
                });

            await tx.insert(auditLogs).values({
                id: nextAuditId(),
                tableName: 'company_business_profiles',
                recordPk: existingCompany.id,
                action: 'create',
                businessUnitId: businessUnit.id,
                actorUserId: input.actorUserId,
                sourceType: 'web',
                afterData: {
                    companyId: existingCompany.id,
                    name: existingCompany.name,
                    businessScope: input.businessScope,
                    sharedAcrossBusinesses: true,
                },
            });

            return {
                id: existingCompany.id,
                name: existingCompany.name,
                createdAt: createdProfile.createdAt,
                sharedAcrossBusinesses: true,
            };
        }

        const [createdCompany] = await tx
            .insert(companies)
            .values({
                legalName: input.name.trim(),
                displayName: input.name.trim(),
                normalizedName,
                website: input.website?.trim() || null,
                mainPhone: input.phone?.trim() || null,
                postalCode: input.postalCode?.trim() || null,
                addressLine1: input.address?.trim() || null,
                createdByUserId: input.actorUserId,
                updatedByUserId: input.actorUserId,
            })
            .returning({
                id: companies.id,
                name: companies.displayName,
                createdAt: companies.createdAt,
            });

        await tx.insert(companyBusinessProfiles).values({
            companyId: createdCompany.id,
            businessUnitId: businessUnit.id,
            ownerUserId: input.ownerUserId ?? null,
            customerStatus: 'active',
            leadSourceCode: input.leadSource?.trim() || null,
            initialLeadSourceCode: input.leadSource?.trim() || null,
            profileAttributes: {
                industry: input.industry?.trim() || undefined,
                tags: input.tags ?? [],
            },
        });

        await tx.insert(auditLogs).values({
            id: nextAuditId(),
            tableName: 'companies',
            recordPk: createdCompany.id,
            action: 'create',
            businessUnitId: businessUnit.id,
            actorUserId: input.actorUserId,
            sourceType: 'web',
            afterData: {
                name: createdCompany.name,
                website: input.website ?? null,
                phone: input.phone ?? null,
                businessScope: input.businessScope,
                sharedAcrossBusinesses: false,
            },
        });

        return {
            ...createdCompany,
            sharedAcrossBusinesses: false,
        };
    });

    return {
        id: result.id,
        name: result.name,
        sharedAcrossBusinesses: result.sharedAcrossBusinesses,
        createdAt: result.createdAt.toISOString(),
    };
}

export interface BulkCreateCompanyRow {
    name: string;
    normalizedName: string;
    industry?: string;
    phone?: string;
    website?: string;
    address?: string;
}

export interface BulkCreateCompanyResult {
    companyId: string;
    companyName: string;
    sharedAcrossBusinesses: boolean;
}

export async function bulkCreateCompanies(
    rows: BulkCreateCompanyRow[],
    businessScope: string,
    actorUserId: string,
): Promise<Map<string, BulkCreateCompanyResult | { error: string }>> {
    const businessUnit = await findBusinessUnitByScope(businessScope as any);
    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const results = new Map<string, BulkCreateCompanyResult | { error: string }>();

    if (rows.length === 0) return results;

    await db.transaction(async (tx) => {
        for (const row of rows) {
            try {
                const [existingCompany] = await tx
                    .select({
                        id: companies.id,
                        name: companies.displayName,
                    })
                    .from(companies)
                    .where(eq(companies.normalizedName, row.normalizedName))
                    .limit(1);

                if (existingCompany) {
                    const [existingProfile] = await tx
                        .select({ id: companyBusinessProfiles.id })
                        .from(companyBusinessProfiles)
                        .where(
                            and(
                                eq(companyBusinessProfiles.companyId, existingCompany.id),
                                eq(companyBusinessProfiles.businessUnitId, businessUnit.id)
                            )
                        )
                        .limit(1);

                    if (existingProfile) {
                        results.set(row.normalizedName, {
                            error: '同名の会社が現在の事業部に既に存在します。',
                        });
                        continue;
                    }

                    await tx.insert(companyBusinessProfiles).values({
                        companyId: existingCompany.id,
                        businessUnitId: businessUnit.id,
                        ownerUserId: null,
                        customerStatus: 'active',
                        profileAttributes: {
                            industry: row.industry?.trim() || undefined,
                            tags: [],
                        },
                    });

                    await tx.insert(auditLogs).values({
                        id: nextAuditId(),
                        tableName: 'company_business_profiles',
                        recordPk: existingCompany.id,
                        action: 'create',
                        businessUnitId: businessUnit.id,
                        actorUserId,
                        sourceType: 'csv_import',
                        afterData: {
                            companyId: existingCompany.id,
                            name: existingCompany.name,
                            businessScope,
                            sharedAcrossBusinesses: true,
                        },
                    });

                    results.set(row.normalizedName, {
                        companyId: existingCompany.id,
                        companyName: existingCompany.name,
                        sharedAcrossBusinesses: true,
                    });
                    continue;
                }

                const [createdCompany] = await tx
                    .insert(companies)
                    .values({
                        legalName: row.name.trim(),
                        displayName: row.name.trim(),
                        normalizedName: row.normalizedName,
                        website: row.website?.trim() || null,
                        mainPhone: row.phone?.trim() || null,
                        addressLine1: row.address?.trim() || null,
                        createdByUserId: actorUserId,
                        updatedByUserId: actorUserId,
                    })
                    .returning({
                        id: companies.id,
                        name: companies.displayName,
                    });

                await tx.insert(companyBusinessProfiles).values({
                    companyId: createdCompany.id,
                    businessUnitId: businessUnit.id,
                    ownerUserId: null,
                    customerStatus: 'active',
                    profileAttributes: {
                        industry: row.industry?.trim() || undefined,
                        tags: [],
                    },
                });

                await tx.insert(auditLogs).values({
                    id: nextAuditId(),
                    tableName: 'companies',
                    recordPk: createdCompany.id,
                    action: 'create',
                    businessUnitId: businessUnit.id,
                    actorUserId,
                    sourceType: 'csv_import',
                    afterData: {
                        name: createdCompany.name,
                        website: row.website ?? null,
                        phone: row.phone ?? null,
                        businessScope,
                        sharedAcrossBusinesses: false,
                    },
                });

                results.set(row.normalizedName, {
                    companyId: createdCompany.id,
                    companyName: createdCompany.name,
                    sharedAcrossBusinesses: false,
                });
            } catch {
                results.set(row.normalizedName, {
                    error: '登録中にエラーが発生しました。',
                });
            }
        }
    });

    return results;
}

export async function updateCompany(input: UpdateCompanyInput): Promise<UpdatedCompany> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const updatedAt = new Date();

    const result = await db.transaction(async (tx) => {
        const [existing] = await tx
            .select({
                id: companies.id,
                phone: companies.mainPhone,
                ownerUserId: companyBusinessProfiles.ownerUserId,
                leadSourceCode: companyBusinessProfiles.leadSourceCode,
                profileAttributes: companyBusinessProfiles.profileAttributes,
            })
            .from(companyBusinessProfiles)
            .innerJoin(companies, eq(companyBusinessProfiles.companyId, companies.id))
            .where(
                and(
                    eq(companyBusinessProfiles.companyId, input.companyId),
                    eq(companyBusinessProfiles.businessUnitId, businessUnit.id)
                )
            )
            .limit(1);

        if (!existing) {
            throw new AppError('NOT_FOUND', 'Company was not found in the active business scope.');
        }

        const currentAttributes = (existing.profileAttributes ?? {}) as CompanyProfileAttributes;
        const nextAttributes: CompanyProfileAttributes = {
            ...currentAttributes,
            ...(input.industry !== undefined ? { industry: input.industry.trim() || undefined } : {}),
            ...(input.tags !== undefined ? { tags: input.tags } : {}),
        };

        if (input.phone !== undefined) {
            await tx
                .update(companies)
                .set({
                    mainPhone: input.phone.trim() || null,
                    updatedAt,
                    updatedByUserId: input.actorUserId,
                })
                .where(eq(companies.id, input.companyId));
        }

        const nextLeadSourceCode = input.leadSource !== undefined
            ? (input.leadSource.trim() || null)
            : (existing.leadSourceCode ?? null);

        if (input.industry !== undefined || input.ownerUserId !== undefined || input.tags !== undefined || input.leadSource !== undefined) {
            await tx
                .update(companyBusinessProfiles)
                .set({
                    ownerUserId: input.ownerUserId ?? existing.ownerUserId ?? null,
                    leadSourceCode: nextLeadSourceCode,
                    profileAttributes: nextAttributes,
                    updatedAt,
                })
                .where(
                    and(
                        eq(companyBusinessProfiles.companyId, input.companyId),
                        eq(companyBusinessProfiles.businessUnitId, businessUnit.id)
                    )
                );
        }

        // 流入経路が変更された場合は変更履歴を記録する
        if (input.leadSource !== undefined && nextLeadSourceCode !== (existing.leadSourceCode ?? null)) {
            await tx.insert(leadSourceHistory).values({
                companyId: input.companyId,
                businessUnitId: businessUnit.id,
                previousLeadSourceCode: existing.leadSourceCode ?? null,
                newLeadSourceCode: nextLeadSourceCode,
                changedByUserId: input.actorUserId,
            });
        }

        await tx.insert(auditLogs).values({
            id: nextAuditId(),
            tableName: 'company_business_profiles',
            recordPk: input.companyId,
            action: 'update',
            businessUnitId: businessUnit.id,
            actorUserId: input.actorUserId,
            sourceType: 'web',
            beforeData: {
                phone: existing.phone ?? null,
                industry: currentAttributes.industry ?? null,
                ownerUserId: existing.ownerUserId ?? null,
                tags: currentAttributes.tags ?? [],
            },
            afterData: {
                phone: input.phone !== undefined ? input.phone.trim() || null : existing.phone ?? null,
                industry: nextAttributes.industry ?? null,
                ownerUserId: input.ownerUserId ?? existing.ownerUserId ?? null,
                tags: nextAttributes.tags ?? [],
            },
        });

        return {
            id: input.companyId,
            updatedAt,
        };
    });

    return {
        id: result.id,
        updatedAt: result.updatedAt.toISOString(),
    };
}
