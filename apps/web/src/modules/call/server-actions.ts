'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addToCallQueue, removeFromCallQueue } from '@/modules/call/application/add-to-call-queue';
import { recordCall } from '@/modules/call/application/record-call';
import { isAppError } from '@/shared/server/errors';
import type { CallResult } from '@g-dx/contracts';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function addToCallQueueAction(formData: FormData) {
    const companyId = readString(formData, 'companyId');
    const phoneNumber = readString(formData, 'phoneNumber');
    if (!companyId || !phoneNumber) redirect('/calls/queue?error=validation');
    try {
        await addToCallQueue({ companyId, contactId: readString(formData, 'contactId'), phoneNumber, scheduledAt: readString(formData, 'scheduledAt'), notes: readString(formData, 'notes') });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    revalidatePath('/calls/queue');
    redirect('/calls/queue?added=1');
}

export async function removeFromCallQueueAction(formData: FormData) {
    const targetId = readString(formData, 'targetId');
    if (!targetId) redirect('/calls/queue');
    try {
        await removeFromCallQueue(targetId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    revalidatePath('/calls/queue');
    redirect('/calls/queue');
}

export async function recordCallAction(formData: FormData) {
    const companyId = readString(formData, 'companyId');
    const result = readString(formData, 'result') as CallResult | undefined;
    const calledAt = readString(formData, 'calledAt');
    if (!companyId || !result || !calledAt) redirect('/calls/history?error=validation');
    const durationRaw = readString(formData, 'durationSec');
    const durationSec = durationRaw ? Number(durationRaw) : undefined;
    const targetId = readString(formData, 'callTargetId');
    try {
        await recordCall({ callTargetId: targetId, companyId, contactId: readString(formData, 'contactId'), calledAt, result, durationSec: durationSec && !isNaN(durationSec) ? durationSec : undefined, notes: readString(formData, 'notes') });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    revalidatePath('/calls/history');
    revalidatePath('/calls/queue');
    if (targetId) redirect('/calls/queue?called=1');
    redirect('/calls/history?recorded=1');
}

export async function addToCallQueueFromCompanyListAction(formData: FormData) {
    const companyId = readString(formData, 'companyId');
    const phoneNumber = readString(formData, 'phoneNumber');
    const companyName = readString(formData, 'companyName') ?? '';
    if (!companyId || !phoneNumber) redirect('/calls/company-list?callError=validation');
    try {
        await addToCallQueue({ companyId, phoneNumber, notes: readString(formData, 'notes') });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    revalidatePath('/calls/queue');
    revalidatePath('/calls/company-list');
    redirect(`/calls/company-list?queued=${encodeURIComponent(companyName)}`);
}

export async function recordCallFromCompanyListAction(formData: FormData) {
    const companyId = readString(formData, 'companyId');
    const result = readString(formData, 'result') as CallResult | undefined;
    const calledAt = readString(formData, 'calledAt');
    const companyName = readString(formData, 'companyName') ?? '';
    if (!companyId || !result || !calledAt) redirect('/calls/company-list?callError=validation');
    const durationRaw = readString(formData, 'durationSec');
    const durationSec = durationRaw ? Number(durationRaw) : undefined;
    try {
        await recordCall({ companyId, contactId: readString(formData, 'contactId'), calledAt, result, durationSec: durationSec && !isNaN(durationSec) ? durationSec : undefined, notes: readString(formData, 'notes') });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    revalidatePath('/calls/history');
    revalidatePath('/calls/company-list');
    redirect(`/calls/company-list?recorded=${encodeURIComponent(companyName)}`);
}
