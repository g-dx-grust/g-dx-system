'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAlliance } from '@/modules/sales/alliance/application/create-alliance';
import { updateAlliance } from '@/modules/sales/alliance/application/update-alliance';
import { linkDealToAlliance, unlinkDealFromAlliance } from '@/modules/sales/alliance/application/link-deal';
import { createAllianceActivity } from '@/modules/sales/alliance/application/create-alliance-activity';
import { updateAllianceActivity } from '@/modules/sales/alliance/application/update-alliance-activity';
import { updateMeeting } from '@/modules/sales/meeting/application/update-meeting';
import { AppError, isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { AllianceActivityType, AllianceReferralType, AllianceStatus, AllianceType } from '@g-dx/contracts';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function createAllianceAction(formData: FormData) {
    const name = readString(formData, 'name');
    if (!name) redirect('/sales/alliances/new?error=validation');

    try {
        const result = await createAlliance({
            name,
            allianceType: (readString(formData, 'allianceType') as AllianceType | undefined) ?? 'COMPANY',
            contactPersonName: readString(formData, 'contactPersonName'),
            contactPersonRole: readString(formData, 'contactPersonRole'),
            contactPersonEmail: readString(formData, 'contactPersonEmail'),
            contactPersonPhone: readString(formData, 'contactPersonPhone'),
            agreementSummary: readString(formData, 'agreementSummary'),
            relationshipStatus: (readString(formData, 'relationshipStatus') as AllianceStatus | undefined) ?? 'PROSPECT',
            notes: readString(formData, 'notes'),
        });

        const fromMeetingId = readString(formData, 'fromMeeting');
        if (fromMeetingId) {
            await updateMeeting(fromMeetingId, {
                convertedAllianceId: result.id,
                convertedAt: new Date(),
            }).catch(() => {});
            revalidatePath(`/sales/meetings/${fromMeetingId}`);
        }

        revalidatePath('/sales/alliances');
        redirect(`/sales/alliances/${result.id}?created=1`);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
}

export async function updateAllianceAction(formData: FormData) {
    const allianceId = readString(formData, 'allianceId');
    if (!allianceId) redirect('/sales/alliances');

    try {
        await updateAlliance(allianceId, {
            name: readString(formData, 'name'),
            allianceType: readString(formData, 'allianceType') as AllianceType | undefined,
            contactPersonName: readString(formData, 'contactPersonName') ?? null,
            contactPersonRole: readString(formData, 'contactPersonRole') ?? null,
            contactPersonEmail: readString(formData, 'contactPersonEmail') ?? null,
            contactPersonPhone: readString(formData, 'contactPersonPhone') ?? null,
            agreementSummary: readString(formData, 'agreementSummary') ?? null,
            relationshipStatus: readString(formData, 'relationshipStatus') as AllianceStatus | undefined,
            notes: readString(formData, 'notes') ?? null,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/alliances');
        throw error;
    }

    revalidatePath('/sales/alliances');
    revalidatePath(`/sales/alliances/${allianceId}`);
    redirect(`/sales/alliances/${allianceId}?updated=1`);
}

export async function linkAllianceToDealAction(formData: FormData) {
    const allianceId = readString(formData, 'allianceId');
    const dealId = readString(formData, 'dealId');
    const referralType = readString(formData, 'referralType') as AllianceReferralType | undefined;

    if (!allianceId || !dealId || !referralType) {
        redirect(`/sales/alliances`);
    }

    try {
        await linkDealToAlliance({ allianceId, dealId, referralType, note: readString(formData, 'note') });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath(`/sales/alliances/${allianceId}`);
    revalidatePath(`/sales/deals/${dealId}`);
    redirect(`/sales/alliances/${allianceId}?linked=1`);
}

export async function unlinkAllianceFromDealAction(formData: FormData) {
    const allianceId = readString(formData, 'allianceId');
    const dealId = readString(formData, 'dealId');

    if (!allianceId || !dealId) redirect('/sales/alliances');

    try {
        await unlinkDealFromAlliance(allianceId, dealId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath(`/sales/alliances/${allianceId}`);
    revalidatePath(`/sales/deals/${dealId}`);
    redirect(`/sales/alliances/${allianceId}?unlinked=1`);
}

export async function unlinkAllianceFromDealFromDealPageAction(formData: FormData) {
    const allianceId = readString(formData, 'allianceId');
    const dealId = readString(formData, 'dealId');

    if (!allianceId || !dealId) redirect('/sales/deals');

    try {
        await unlinkDealFromAlliance(allianceId, dealId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath(`/sales/alliances/${allianceId}`);
    revalidatePath(`/sales/deals/${dealId}`);
    redirect(`/sales/deals/${dealId}?allianceUnlinked=1`);
}

export async function createAllianceActivityAction(formData: FormData) {
    const allianceId = readString(formData, 'allianceId');
    const activityType = readString(formData, 'activityType') as AllianceActivityType | undefined;
    const activityDate = readString(formData, 'activityDate');
    if (!allianceId || !activityType || !activityDate) redirect('/sales/alliances');

    try {
        await createAllianceActivity({
            allianceId,
            activityType,
            activityDate,
            summary: readString(formData, 'summary'),
            larkMeetingUrl: readString(formData, 'larkMeetingUrl'),
            nextActionDate: readString(formData, 'nextActionDate'),
            nextActionContent: readString(formData, 'nextActionContent'),
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath(`/sales/alliances/${allianceId}`);
    redirect(`/sales/alliances/${allianceId}?activityAdded=1`);
}

export async function updateAllianceActivityAction(formData: FormData) {
    const activityId = readString(formData, 'activityId');
    const allianceId = readString(formData, 'allianceId');
    if (!activityId || !allianceId) redirect('/sales/alliances');

    try {
        await updateAllianceActivity(activityId, allianceId, {
            activityType: readString(formData, 'activityType') as AllianceActivityType | undefined,
            activityDate: readString(formData, 'activityDate'),
            summary: readString(formData, 'summary') ?? null,
            larkMeetingUrl: readString(formData, 'larkMeetingUrl') ?? null,
            nextActionDate: readString(formData, 'nextActionDate') ?? null,
            nextActionContent: readString(formData, 'nextActionContent') ?? null,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect(`/sales/alliances/${allianceId}`);
        throw error;
    }

    revalidatePath(`/sales/alliances/${allianceId}`);
    redirect(`/sales/alliances/${allianceId}?activityUpdated=1`);
}

export async function createAllianceQuickAction(name: string): Promise<{ id: string; label: string }> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    const result = await createAlliance({
        name,
        allianceType: 'COMPANY',
        relationshipStatus: 'PROSPECT',
    });

    revalidatePath('/sales/meetings/new');

    return { id: result.id, label: name };
}

export async function linkAllianceToDealFromDealPageAction(formData: FormData) {
    const allianceId = readString(formData, 'allianceId');
    const dealId = readString(formData, 'dealId');
    const referralType = readString(formData, 'referralType') as AllianceReferralType | undefined;

    if (!allianceId || !dealId || !referralType) redirect('/sales/deals');

    try {
        await linkDealToAlliance({ allianceId, dealId, referralType, note: readString(formData, 'note') });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath(`/sales/alliances/${allianceId}`);
    revalidatePath(`/sales/deals/${dealId}`);
    redirect(`/sales/deals/${dealId}?allianceLinked=1`);
}
