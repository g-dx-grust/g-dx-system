import { db } from '@g-dx/database';
import {
    auditLogs,
    companies,
    companyBusinessProfiles,
    companyContactLinks,
    contactBusinessProfiles,
    contacts,
} from '@g-dx/database/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { BusinessScopeType, ContactListItem } from '@g-dx/contracts';
import type {
    ContactDetail,
    ContactListFilters,
    ContactListResult,
    CreateContactInput,
    CreatedContact,
    UpdateContactInput,
    UpdatedContact,
} from '@/modules/customer-management/contact/domain/contact';
import {
    findBusinessUnitByScope,
    nextAuditId,
} from '@/modules/customer-management/shared/infrastructure/customer-shared';
import { AppError } from '@/shared/server/errors';

function parseContactName(name: string): { firstName: string; lastName: string; fullName: string } {
    const normalized = name.trim().replace(/\s+/g, ' ');
    const parts = normalized.split(' ');

    if (parts.length === 1) {
        return {
            firstName: '',
            lastName: parts[0],
            fullName: normalized,
        };
    }

    return {
        firstName: parts.slice(1).join(' '),
        lastName: parts[0],
        fullName: normalized,
    };
}

function createPrimaryCompanyMap(rows: Array<{
    contactId: string;
    companyId: string;
    companyName: string;
}>) {
    const map = new Map<string, { companyId: string; companyName: string }>();

    for (const row of rows) {
        if (!map.has(row.contactId)) {
            map.set(row.contactId, {
                companyId: row.companyId,
                companyName: row.companyName,
            });
        }
    }

    return map;
}

export async function listContacts(filters: ContactListFilters): Promise<ContactListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const offset = (page - 1) * pageSize;
    const businessUnit = await findBusinessUnitByScope(filters.businessScope);

    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const whereClause = and(
        eq(contactBusinessProfiles.businessUnitId, businessUnit.id),
        filters.companyId ? eq(companyContactLinks.companyId, filters.companyId) : undefined,
        filters.keyword
            ? sql`(
                ${contacts.fullName} ilike ${`%${filters.keyword}%`}
                or ${contacts.email} ilike ${`%${filters.keyword}%`}
              )`
            : undefined
    );

    const rows = await db
        .selectDistinct({
            id: contacts.id,
            name: contacts.fullName,
            department: contacts.department,
            title: contacts.jobTitle,
            email: contacts.email,
            phone: contacts.mobilePhone,
        })
        .from(contactBusinessProfiles)
        .innerJoin(contacts, eq(contactBusinessProfiles.contactId, contacts.id))
        .leftJoin(companyContactLinks, eq(companyContactLinks.contactId, contacts.id))
        .where(whereClause)
        .orderBy(contacts.fullName)
        .limit(pageSize)
        .offset(offset);

    const [{ total }] = await db
        .select({
            total: sql<number>`count(distinct ${contacts.id})`,
        })
        .from(contactBusinessProfiles)
        .innerJoin(contacts, eq(contactBusinessProfiles.contactId, contacts.id))
        .leftJoin(companyContactLinks, eq(companyContactLinks.contactId, contacts.id))
        .where(whereClause);

    const contactIds = rows.map((row) => row.id);
    const companyRows =
        contactIds.length === 0
            ? []
            : await db
                  .select({
                      contactId: companyContactLinks.contactId,
                      companyId: companies.id,
                      companyName: companies.displayName,
                  })
                  .from(companyContactLinks)
                  .innerJoin(companies, eq(companyContactLinks.companyId, companies.id))
                  .where(inArray(companyContactLinks.contactId, contactIds))
                  .orderBy(desc(companyContactLinks.isPrimary), companies.displayName);

    const companyMap = createPrimaryCompanyMap(companyRows);

    const data: ContactListItem[] = rows.map((row) => {
        const company = companyMap.get(row.id);

        return {
            id: row.id,
            companyId: company?.companyId ?? '',
            companyName: company?.companyName ?? 'Unlinked Company',
            name: row.name,
            department: row.department ?? null,
            title: row.title ?? null,
            email: row.email ?? null,
            phone: row.phone ?? null,
        };
    });

    return {
        data,
        meta: {
            page,
            pageSize,
            total: Number(total),
        },
    };
}

export async function getContactDetail(contactId: string, businessScope: BusinessScopeType): Promise<ContactDetail> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const [row] = await db
        .select({
            id: contacts.id,
            name: contacts.fullName,
            department: contacts.department,
            title: contacts.jobTitle,
            email: contacts.email,
            phone: contacts.mobilePhone,
        })
        .from(contactBusinessProfiles)
        .innerJoin(contacts, eq(contactBusinessProfiles.contactId, contacts.id))
        .where(
            and(
                eq(contactBusinessProfiles.contactId, contactId),
                eq(contactBusinessProfiles.businessUnitId, businessUnit.id)
            )
        )
        .limit(1);

    if (!row) {
        throw new AppError('NOT_FOUND', 'Contact was not found in the active business scope.');
    }

    const linkedCompanies = await db
        .select({
            id: companies.id,
            name: companies.displayName,
            isPrimary: companyContactLinks.isPrimary,
        })
        .from(companyContactLinks)
        .innerJoin(companies, eq(companyContactLinks.companyId, companies.id))
        .innerJoin(
            companyBusinessProfiles,
            and(
                eq(companyBusinessProfiles.companyId, companies.id),
                eq(companyBusinessProfiles.businessUnitId, businessUnit.id)
            )
        )
        .where(eq(companyContactLinks.contactId, contactId))
        .orderBy(desc(companyContactLinks.isPrimary), companies.displayName);

    return {
        id: row.id,
        name: row.name,
        department: row.department ?? null,
        title: row.title ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        linkedCompanies,
    };
}

export async function createContact(input: CreateContactInput): Promise<CreatedContact> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const { firstName, lastName, fullName } = parseContactName(input.name);

    const created = await db.transaction(async (tx) => {
        const [visibleCompany] = await tx
            .select({
                id: companies.id,
                name: companies.displayName,
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

        if (!visibleCompany) {
            throw new AppError('NOT_FOUND', 'Company was not found in the active business scope.');
        }

        const [contact] = await tx
            .insert(contacts)
            .values({
                firstName,
                lastName,
                fullName,
                email: input.email?.trim() || null,
                mobilePhone: input.phone?.trim() || null,
                department: input.department?.trim() || null,
                jobTitle: input.title?.trim() || null,
                contactStatus: 'active',
                createdByUserId: input.actorUserId,
                updatedByUserId: input.actorUserId,
            })
            .returning({
                id: contacts.id,
                name: contacts.fullName,
            });

        await tx.insert(contactBusinessProfiles).values({
            contactId: contact.id,
            businessUnitId: businessUnit.id,
            engagementStatus: 'active',
            ownerUserId: null,
        });

        if (input.isPrimary) {
            await tx
                .update(companyContactLinks)
                .set({
                    isPrimary: false,
                })
                .where(eq(companyContactLinks.companyId, input.companyId));
        }

        await tx.insert(companyContactLinks).values({
            companyId: input.companyId,
            contactId: contact.id,
            relationshipType: 'company_contact',
            isPrimary: input.isPrimary ?? false,
            departmentLabel: input.department?.trim() || null,
        });

        await tx.insert(auditLogs).values({
            id: nextAuditId(),
            tableName: 'contacts',
            recordPk: contact.id,
            action: 'create',
            businessUnitId: businessUnit.id,
            actorUserId: input.actorUserId,
            sourceType: 'web',
            afterData: {
                companyId: input.companyId,
                name: contact.name,
                email: input.email ?? null,
                phone: input.phone ?? null,
            },
        });

        return {
            id: contact.id,
            companyId: input.companyId,
            name: contact.name,
        };
    });

    return created;
}

export async function updateContact(input: UpdateContactInput): Promise<UpdatedContact> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) {
        throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    }

    const updatedAt = new Date();

    const result = await db.transaction(async (tx) => {
        const [existing] = await tx
            .select({
                id: contacts.id,
                department: contacts.department,
                title: contacts.jobTitle,
                email: contacts.email,
                phone: contacts.mobilePhone,
            })
            .from(contactBusinessProfiles)
            .innerJoin(contacts, eq(contactBusinessProfiles.contactId, contacts.id))
            .where(
                and(
                    eq(contactBusinessProfiles.contactId, input.contactId),
                    eq(contactBusinessProfiles.businessUnitId, businessUnit.id)
                )
            )
            .limit(1);

        if (!existing) {
            throw new AppError('NOT_FOUND', 'Contact was not found in the active business scope.');
        }

        await tx
            .update(contacts)
            .set({
                department: input.department !== undefined ? input.department.trim() || null : existing.department,
                jobTitle: input.title !== undefined ? input.title.trim() || null : existing.title,
                email: input.email !== undefined ? input.email.trim() || null : existing.email,
                mobilePhone: input.phone !== undefined ? input.phone.trim() || null : existing.phone,
                updatedAt,
                updatedByUserId: input.actorUserId,
            })
            .where(eq(contacts.id, input.contactId));

        if (input.department !== undefined) {
            await tx
                .update(companyContactLinks)
                .set({
                    departmentLabel: input.department.trim() || null,
                })
                .where(eq(companyContactLinks.contactId, input.contactId));
        }

        await tx.insert(auditLogs).values({
            id: nextAuditId(),
            tableName: 'contacts',
            recordPk: input.contactId,
            action: 'update',
            businessUnitId: businessUnit.id,
            actorUserId: input.actorUserId,
            sourceType: 'web',
            beforeData: {
                department: existing.department ?? null,
                title: existing.title ?? null,
                email: existing.email ?? null,
                phone: existing.phone ?? null,
            },
            afterData: {
                department: input.department !== undefined ? input.department.trim() || null : existing.department ?? null,
                title: input.title !== undefined ? input.title.trim() || null : existing.title ?? null,
                email: input.email !== undefined ? input.email.trim() || null : existing.email ?? null,
                phone: input.phone !== undefined ? input.phone.trim() || null : existing.phone ?? null,
            },
        });

        return {
            id: input.contactId,
            updatedAt,
        };
    });

    return {
        id: result.id,
        updatedAt: result.updatedAt.toISOString(),
    };
}
