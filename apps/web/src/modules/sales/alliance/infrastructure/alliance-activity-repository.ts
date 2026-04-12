import { db } from '@g-dx/database';
import { allianceActivities, users } from '@g-dx/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import type {
    AllianceActivityItem,
    AllianceActivityType,
    BusinessScopeType,
    UpdateAllianceActivityRequest,
} from '@g-dx/contracts';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { AppError } from '@/shared/server/errors';

export async function listAllianceActivities(allianceId: string): Promise<AllianceActivityItem[]> {
    const rows = await db
        .select({
            id: allianceActivities.id,
            allianceId: allianceActivities.allianceId,
            userId: allianceActivities.userId,
            userName: users.displayName,
            activityType: allianceActivities.activityType,
            activityDate: allianceActivities.activityDate,
            summary: allianceActivities.summary,
            larkMeetingUrl: allianceActivities.larkMeetingUrl,
            nextActionDate: allianceActivities.nextActionDate,
            nextActionContent: allianceActivities.nextActionContent,
            createdAt: allianceActivities.createdAt,
        })
        .from(allianceActivities)
        .innerJoin(users, eq(allianceActivities.userId, users.id))
        .where(eq(allianceActivities.allianceId, allianceId))
        .orderBy(desc(allianceActivities.activityDate), desc(allianceActivities.createdAt));

    return rows.map((r) => ({
        id: r.id,
        allianceId: r.allianceId,
        userId: r.userId,
        userName: r.userName ?? 'Unknown',
        activityType: r.activityType as AllianceActivityType,
        activityDate: r.activityDate ?? '',
        summary: r.summary ?? null,
        larkMeetingUrl: r.larkMeetingUrl ?? null,
        nextActionDate: r.nextActionDate ?? null,
        nextActionContent: r.nextActionContent ?? null,
        createdAt: r.createdAt.toISOString(),
    }));
}

export async function createAllianceActivity(input: {
    allianceId: string;
    businessScope: BusinessScopeType;
    userId: string;
    activityType: AllianceActivityType;
    activityDate: string;
    summary?: string;
    larkMeetingUrl?: string;
    nextActionDate?: string;
    nextActionContent?: string;
}): Promise<void> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    await db.insert(allianceActivities).values({
        id: crypto.randomUUID(),
        allianceId: input.allianceId,
        businessUnitId: businessUnit.id,
        userId: input.userId,
        activityType: input.activityType,
        activityDate: input.activityDate,
        summary: input.summary ?? null,
        larkMeetingUrl: input.larkMeetingUrl ?? null,
        nextActionDate: input.nextActionDate ?? null,
        nextActionContent: input.nextActionContent ?? null,
    });
}

export async function updateAllianceActivity(
    activityId: string,
    allianceId: string,
    updates: UpdateAllianceActivityRequest,
): Promise<void> {
    const [existing] = await db
        .select({ id: allianceActivities.id })
        .from(allianceActivities)
        .where(and(eq(allianceActivities.id, activityId), eq(allianceActivities.allianceId, allianceId)))
        .limit(1);

    if (!existing) throw new AppError('NOT_FOUND', 'Alliance activity not found.');

    await db
        .update(allianceActivities)
        .set({
            ...(updates.activityType !== undefined && { activityType: updates.activityType }),
            ...(updates.activityDate !== undefined && { activityDate: updates.activityDate }),
            ...(updates.summary !== undefined && { summary: updates.summary }),
            ...(updates.larkMeetingUrl !== undefined && { larkMeetingUrl: updates.larkMeetingUrl }),
            ...(updates.nextActionDate !== undefined && { nextActionDate: updates.nextActionDate }),
            ...(updates.nextActionContent !== undefined && { nextActionContent: updates.nextActionContent }),
            updatedAt: new Date(),
        })
        .where(and(eq(allianceActivities.id, activityId), eq(allianceActivities.allianceId, allianceId)));
}
