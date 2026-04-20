import { db } from '@g-dx/database';
import { alliances, businessUnits, companies, meetings, users } from '@g-dx/database/schema';
import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type {
    BusinessScopeType,
    MeetingActivityType,
    MeetingCounterpartyType,
    MeetingItem,
} from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import type { CreateMeetingInput, MeetingListFilters, UpdateMeetingInput } from '../domain/meeting';

async function getBusinessUnitOrThrow(businessScope: BusinessScopeType) {
    const bu = await findBusinessUnitByScope(businessScope);
    if (!bu) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    return bu;
}

function rowToMeetingItem(row: {
    id: string;
    businessScopeCode: string;
    ownerUserId: string;
    ownerName: string | null;
    counterpartyType: string;
    companyId: string | null;
    companyName: string | null;
    allianceId: string | null;
    allianceName: string | null;
    contactName: string | null;
    contactRole: string | null;
    meetingDate: Date;
    activityType: string;
    purpose: string | null;
    summary: string | null;
    nextActionDate: string | null;
    nextActionContent: string | null;
    convertedDealId: string | null;
    convertedAllianceId: string | null;
    convertedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}): MeetingItem {
    return {
        id: row.id,
        businessScope: row.businessScopeCode as BusinessScopeType,
        ownerUserId: row.ownerUserId,
        ownerName: row.ownerName,
        counterpartyType: row.counterpartyType as MeetingCounterpartyType,
        companyId: row.companyId,
        companyName: row.companyName,
        allianceId: row.allianceId,
        allianceName: row.allianceName,
        contactName: row.contactName,
        contactRole: row.contactRole,
        meetingDate: row.meetingDate.toISOString(),
        activityType: row.activityType as MeetingActivityType,
        purpose: row.purpose,
        summary: row.summary,
        nextActionDate: row.nextActionDate,
        nextActionContent: row.nextActionContent,
        convertedDealId: row.convertedDealId,
        convertedAllianceId: row.convertedAllianceId,
        convertedAt: row.convertedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export async function listMeetingsInRepository(
    businessScope: BusinessScopeType,
    filters: MeetingListFilters = {},
): Promise<{ data: MeetingItem[]; total: number }> {
    const bu = await getBusinessUnitOrThrow(businessScope);

    const rows = await db
        .select({
            id: meetings.id,
            businessScopeCode: businessUnits.code,
            ownerUserId: meetings.ownerUserId,
            ownerName: users.displayName,
            counterpartyType: meetings.counterpartyType,
            companyId: meetings.companyId,
            companyName: companies.displayName,
            allianceId: meetings.allianceId,
            allianceName: alliances.name,
            contactName: meetings.contactName,
            contactRole: meetings.contactRole,
            meetingDate: meetings.meetingDate,
            activityType: meetings.activityType,
            purpose: meetings.purpose,
            summary: meetings.summary,
            nextActionDate: meetings.nextActionDate,
            nextActionContent: meetings.nextActionContent,
            convertedDealId: meetings.convertedDealId,
            convertedAllianceId: meetings.convertedAllianceId,
            convertedAt: meetings.convertedAt,
            createdAt: meetings.createdAt,
            updatedAt: meetings.updatedAt,
        })
        .from(meetings)
        .innerJoin(businessUnits, eq(meetings.businessUnitId, businessUnits.id))
        .innerJoin(users, eq(meetings.ownerUserId, users.id))
        .leftJoin(companies, eq(meetings.companyId, companies.id))
        .leftJoin(alliances, eq(meetings.allianceId, alliances.id))
        .where(
            and(
                eq(meetings.businessUnitId, bu.id),
                isNull(meetings.deletedAt),
                filters.ownerUserId ? eq(meetings.ownerUserId, filters.ownerUserId) : undefined,
                filters.activityType ? eq(meetings.activityType, filters.activityType) : undefined,
                filters.counterpartyType ? eq(meetings.counterpartyType, filters.counterpartyType) : undefined,
                filters.dateFrom ? gte(meetings.meetingDate, new Date(filters.dateFrom)) : undefined,
                filters.dateTo ? lte(meetings.meetingDate, new Date(filters.dateTo + 'T23:59:59Z')) : undefined,
            ),
        )
        .orderBy(desc(meetings.meetingDate));

    const data = rows.map(rowToMeetingItem);
    return { data, total: data.length };
}

export async function getMeetingByIdInRepository(
    meetingId: string,
    businessScope: BusinessScopeType,
): Promise<MeetingItem | null> {
    const bu = await getBusinessUnitOrThrow(businessScope);

    const rows = await db
        .select({
            id: meetings.id,
            businessScopeCode: businessUnits.code,
            ownerUserId: meetings.ownerUserId,
            ownerName: users.displayName,
            counterpartyType: meetings.counterpartyType,
            companyId: meetings.companyId,
            companyName: companies.displayName,
            allianceId: meetings.allianceId,
            allianceName: alliances.name,
            contactName: meetings.contactName,
            contactRole: meetings.contactRole,
            meetingDate: meetings.meetingDate,
            activityType: meetings.activityType,
            purpose: meetings.purpose,
            summary: meetings.summary,
            nextActionDate: meetings.nextActionDate,
            nextActionContent: meetings.nextActionContent,
            convertedDealId: meetings.convertedDealId,
            convertedAllianceId: meetings.convertedAllianceId,
            convertedAt: meetings.convertedAt,
            createdAt: meetings.createdAt,
            updatedAt: meetings.updatedAt,
        })
        .from(meetings)
        .innerJoin(businessUnits, eq(meetings.businessUnitId, businessUnits.id))
        .innerJoin(users, eq(meetings.ownerUserId, users.id))
        .leftJoin(companies, eq(meetings.companyId, companies.id))
        .leftJoin(alliances, eq(meetings.allianceId, alliances.id))
        .where(
            and(
                eq(meetings.id, meetingId),
                eq(meetings.businessUnitId, bu.id),
                isNull(meetings.deletedAt),
            ),
        )
        .limit(1);

    if (rows.length === 0) return null;
    return rowToMeetingItem(rows[0]);
}

export async function createMeetingInRepository(
    businessScope: BusinessScopeType,
    input: CreateMeetingInput,
    actorUserId: string,
): Promise<{ id: string }> {
    const bu = await getBusinessUnitOrThrow(businessScope);
    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(meetings).values({
        id,
        businessUnitId: bu.id,
        ownerUserId: input.ownerUserId,
        counterpartyType: input.counterpartyType,
        companyId: input.companyId ?? null,
        allianceId: input.allianceId ?? null,
        contactName: input.contactName ?? null,
        contactRole: input.contactRole ?? null,
        meetingDate: input.meetingDate,
        activityType: input.activityType,
        purpose: input.purpose ?? null,
        summary: input.summary ?? null,
        nextActionDate: input.nextActionDate ?? null,
        nextActionContent: input.nextActionContent ?? null,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
    });

    return { id };
}

export async function updateMeetingInRepository(
    meetingId: string,
    businessScope: BusinessScopeType,
    input: UpdateMeetingInput,
    actorUserId: string,
): Promise<void> {
    const bu = await getBusinessUnitOrThrow(businessScope);

    const [existing] = await db
        .select({ id: meetings.id })
        .from(meetings)
        .where(and(eq(meetings.id, meetingId), eq(meetings.businessUnitId, bu.id), isNull(meetings.deletedAt)))
        .limit(1);

    if (!existing) throw new AppError('NOT_FOUND', 'Meeting not found.');

    await db
        .update(meetings)
        .set({
            ...(input.ownerUserId !== undefined && { ownerUserId: input.ownerUserId }),
            ...(input.counterpartyType !== undefined && { counterpartyType: input.counterpartyType }),
            ...(input.companyId !== undefined && { companyId: input.companyId }),
            ...(input.allianceId !== undefined && { allianceId: input.allianceId }),
            ...(input.contactName !== undefined && { contactName: input.contactName }),
            ...(input.contactRole !== undefined && { contactRole: input.contactRole }),
            ...(input.meetingDate !== undefined && { meetingDate: input.meetingDate }),
            ...(input.activityType !== undefined && { activityType: input.activityType }),
            ...(input.purpose !== undefined && { purpose: input.purpose }),
            ...(input.summary !== undefined && { summary: input.summary }),
            ...(input.nextActionDate !== undefined && { nextActionDate: input.nextActionDate }),
            ...(input.nextActionContent !== undefined && { nextActionContent: input.nextActionContent }),
            ...(input.convertedDealId !== undefined && { convertedDealId: input.convertedDealId }),
            ...(input.convertedAllianceId !== undefined && { convertedAllianceId: input.convertedAllianceId }),
            ...(input.convertedAt !== undefined && { convertedAt: input.convertedAt }),
            updatedAt: new Date(),
            updatedByUserId: actorUserId,
        })
        .where(and(eq(meetings.id, meetingId), eq(meetings.businessUnitId, bu.id)));
}

export async function deleteMeetingInRepository(
    meetingId: string,
    businessScope: BusinessScopeType,
    actorUserId: string,
): Promise<void> {
    const bu = await getBusinessUnitOrThrow(businessScope);

    const [existing] = await db
        .select({ id: meetings.id })
        .from(meetings)
        .where(and(eq(meetings.id, meetingId), eq(meetings.businessUnitId, bu.id), isNull(meetings.deletedAt)))
        .limit(1);

    if (!existing) throw new AppError('NOT_FOUND', 'Meeting not found.');

    await db
        .update(meetings)
        .set({ deletedAt: new Date(), updatedByUserId: actorUserId })
        .where(and(eq(meetings.id, meetingId), eq(meetings.businessUnitId, bu.id)));
}
