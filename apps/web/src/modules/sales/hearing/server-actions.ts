'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAppError } from '@/shared/server/errors';
import { updateHearing } from './application/update-hearing';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function readNullableString(formData: FormData, key: string): string | null {
    return readString(formData, key) ?? null;
}

function readCheckbox(formData: FormData, key: string): boolean {
    return formData.get(key) === '1';
}

function readNullableNumber(formData: FormData, key: string): number | null {
    const value = readString(formData, key);
    if (!value) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function readTriState(formData: FormData, key: string): boolean | null {
    const value = readString(formData, key);
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return null;
}

export async function saveHearingAction(formData: FormData) {
    const dealId = readString(formData, 'dealId');
    if (!dealId) {
        redirect('/sales/deals');
    }

    try {
        await updateHearing(dealId, {
            gapCurrentSituation: readNullableString(formData, 'gapCurrentSituation'),
            gapIdealState: readNullableString(formData, 'gapIdealState'),
            gapEffectGoal: readNullableString(formData, 'gapEffectGoal'),
            gapAgreementMemo: readNullableString(formData, 'gapAgreementMemo'),
            gapCompleted: readCheckbox(formData, 'gapCompleted'),
            targetUserSegments: readNullableString(formData, 'targetUserSegments'),
            targetIdEstimate: readNullableNumber(formData, 'targetIdEstimate'),
            targetPlanCandidate: readNullableString(formData, 'targetPlanCandidate'),
            targetCompleted: readCheckbox(formData, 'targetCompleted'),
            scopeIsStandard: readTriState(formData, 'scopeIsStandard'),
            scopeOptionRequirements: readNullableString(formData, 'scopeOptionRequirements'),
            scopeTechLiaisonFlag: readCheckbox(formData, 'scopeTechLiaisonFlag'),
            scopeCompleted: readCheckbox(formData, 'scopeCompleted'),
            subsidyInsuranceStatus: readNullableString(formData, 'subsidyInsuranceStatus'),
            subsidyCompanyCategory: readNullableString(formData, 'subsidyCompanyCategory'),
            subsidyApplicableProgram: readNullableString(formData, 'subsidyApplicableProgram'),
            subsidyLaborConsultantOk: readTriState(formData, 'subsidyLaborConsultantOk'),
            subsidyCompleted: readCheckbox(formData, 'subsidyCompleted'),
            decisionApproverInfo: readNullableString(formData, 'decisionApproverInfo'),
            decisionTimeline: readNullableString(formData, 'decisionTimeline'),
            decisionNextMeetingAttendee: readNullableString(formData, 'decisionNextMeetingAttendee'),
            decisionCriteria: readNullableString(formData, 'decisionCriteria'),
            decisionNextPlan: readNullableString(formData, 'decisionNextPlan'),
            decisionCompleted: readCheckbox(formData, 'decisionCompleted'),
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/deals');
        throw error;
    }

    revalidatePath(`/sales/deals/${dealId}`);
    redirect(`/sales/deals/${dealId}?hearingSaved=1`);
}
