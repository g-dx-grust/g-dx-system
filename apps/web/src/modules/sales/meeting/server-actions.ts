'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createMeeting } from '@/modules/sales/meeting/application/create-meeting';
import { updateMeeting } from '@/modules/sales/meeting/application/update-meeting';
import { deleteMeeting } from '@/modules/sales/meeting/application/delete-meeting';
import { getRollingKpiCacheKey } from '@/modules/sales/deal/application/get-rolling-kpi';
import { getMonthlyActivityStatsCacheKey } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { redisDelete } from '@/shared/server/redis-cache';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { MeetingActivityType, MeetingCounterpartyType } from '@g-dx/contracts';

async function purgeMeetingDashboardCache() {
    const session = await getAuthenticatedAppSession().catch(() => null);
    if (!session) return;
    const scope = session.activeBusinessScope;
    const now = new Date();
    void redisDelete(
        getRollingKpiCacheKey(scope),
        getMonthlyActivityStatsCacheKey(scope, now.getFullYear(), now.getMonth() + 1),
    );
}

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function parseMeetingDate(raw: string | undefined): Date | null {
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

export async function createMeetingAction(formData: FormData) {
    const counterpartyType = (readString(formData, 'counterpartyType') ?? 'NONE') as MeetingCounterpartyType;
    const activityType = readString(formData, 'activityType') as MeetingActivityType | undefined;
    const meetingDateRaw = readString(formData, 'meetingDate');
    const meetingDate = parseMeetingDate(meetingDateRaw);

    if (!activityType || !meetingDate) {
        redirect('/sales/meetings/new?error=validation');
    }

    const ownerUserId = readString(formData, 'ownerUserId');
    const companyId = counterpartyType === 'COMPANY' ? readString(formData, 'companyId') : undefined;
    const allianceId = counterpartyType === 'ALLIANCE' ? readString(formData, 'allianceId') : undefined;

    if (counterpartyType === 'COMPANY' && !companyId) {
        redirect('/sales/meetings/new?error=validation');
    }
    if (counterpartyType === 'ALLIANCE' && !allianceId) {
        redirect('/sales/meetings/new?error=validation');
    }

    let result;
    try {
        result = await createMeeting({
            ownerUserId: ownerUserId!,
            counterpartyType,
            companyId: companyId ?? null,
            allianceId: allianceId ?? null,
            contactName: readString(formData, 'contactName') ?? null,
            contactRole: readString(formData, 'contactRole') ?? null,
            meetingDate,
            activityType,
            purpose: readString(formData, 'purpose') ?? null,
            summary: readString(formData, 'summary') ?? null,
            nextActionDate: readString(formData, 'nextActionDate') ?? null,
            nextActionContent: readString(formData, 'nextActionContent') ?? null,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath('/sales/meetings');
    revalidatePath('/dashboard/activity');
    void purgeMeetingDashboardCache();
    redirect(`/sales/meetings/${result.id}?created=1`);
}

export async function updateMeetingAction(formData: FormData) {
    const meetingId = readString(formData, 'meetingId');
    if (!meetingId) redirect('/sales/meetings');

    const counterpartyType = readString(formData, 'counterpartyType') as MeetingCounterpartyType | undefined;
    const meetingDateRaw = readString(formData, 'meetingDate');
    const meetingDate = meetingDateRaw ? parseMeetingDate(meetingDateRaw) : undefined;

    const companyId = counterpartyType === 'COMPANY' ? (readString(formData, 'companyId') ?? null) : null;
    const allianceId = counterpartyType === 'ALLIANCE' ? (readString(formData, 'allianceId') ?? null) : null;

    try {
        await updateMeeting(meetingId, {
            ownerUserId: readString(formData, 'ownerUserId'),
            counterpartyType,
            companyId,
            allianceId,
            contactName: readString(formData, 'contactName') ?? null,
            contactRole: readString(formData, 'contactRole') ?? null,
            ...(meetingDate !== undefined && { meetingDate: meetingDate ?? undefined }),
            activityType: readString(formData, 'activityType') as MeetingActivityType | undefined,
            purpose: readString(formData, 'purpose') ?? null,
            summary: readString(formData, 'summary') ?? null,
            nextActionDate: readString(formData, 'nextActionDate') ?? null,
            nextActionContent: readString(formData, 'nextActionContent') ?? null,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/meetings');
        throw error;
    }

    revalidatePath('/sales/meetings');
    revalidatePath(`/sales/meetings/${meetingId}`);
    revalidatePath('/dashboard/activity');
    void purgeMeetingDashboardCache();
    redirect(`/sales/meetings/${meetingId}?updated=1`);
}

export async function deleteMeetingAction(formData: FormData) {
    const meetingId = readString(formData, 'meetingId');
    if (!meetingId) redirect('/sales/meetings');

    try {
        await deleteMeeting(meetingId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/meetings');
        throw error;
    }

    revalidatePath('/sales/meetings');
    revalidatePath('/dashboard/activity');
    void purgeMeetingDashboardCache();
    redirect('/sales/meetings?deleted=1');
}
