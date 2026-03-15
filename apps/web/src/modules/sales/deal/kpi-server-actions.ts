'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveKpiTarget } from '@/modules/sales/deal/application/save-kpi-target';
import { isAppError } from '@/shared/server/errors';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function readInt(formData: FormData, key: string): number {
    const raw = readString(formData, key);
    const n = parseInt(raw ?? '0', 10);
    return isNaN(n) ? 0 : n;
}

function readFloat(formData: FormData, key: string): number {
    const raw = readString(formData, key);
    const n = parseFloat(raw ?? '0');
    return isNaN(n) ? 0 : n;
}

export async function saveKpiTargetAction(formData: FormData) {
    const targetMonth = readString(formData, 'targetMonth');
    if (!targetMonth) redirect('/dashboard/settings/kpi?error=invalid_month');

    const input = {
        targetMonth,
        callTarget: readInt(formData, 'callTarget'),
        visitTarget: readInt(formData, 'visitTarget'),
        appointmentTarget: readInt(formData, 'appointmentTarget'),
        negotiationTarget: readInt(formData, 'negotiationTarget'),
        contractTarget: readInt(formData, 'contractTarget'),
        revenueTarget: readFloat(formData, 'revenueTarget'),
    };

    try {
        await saveKpiTarget(input);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'VALIDATION_ERROR')) redirect('/dashboard/settings/kpi?error=validation');
        throw error;
    }

    revalidatePath('/dashboard/personal');
    revalidatePath('/dashboard/settings/kpi');
    redirect('/dashboard/settings/kpi?saved=1');
}
