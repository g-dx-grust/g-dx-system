'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addToCallQueue, removeFromCallQueue } from '@/modules/call/application/add-to-call-queue';
import { recordCall } from '@/modules/call/application/record-call';
import { listCallHistoryByCompany } from '@/modules/call/application/list-call-history-by-company';
import { isAppError } from '@/shared/server/errors';
import type { CallListItem, CallResult } from '@g-dx/contracts';

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

export async function recordCallAction(_prev: unknown, formData: FormData): Promise<{ success: boolean; error?: string }> {
    const companyId = readString(formData, 'companyId');
    const result = readString(formData, 'result') as CallResult | undefined;
    if (!companyId || !result) return { success: false, error: 'validation' };
    const targetId = readString(formData, 'callTargetId');
    try {
        await recordCall({
            callTargetId: targetId,
            companyId,
            contactId: readString(formData, 'contactId'),
            result,
            notes: readString(formData, 'notes'),
            nextCallDatetime: readString(formData, 'nextCallDatetime'),
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    revalidatePath('/calls/history');
    revalidatePath('/calls/queue');
    return { success: true };
}

export async function recordCallFromCompanyListAction(_prev: unknown, formData: FormData): Promise<{ success: boolean; companyName?: string; error?: string }> {
    const companyId = readString(formData, 'companyId');
    const result = readString(formData, 'result') as CallResult | undefined;
    const companyName = readString(formData, 'companyName') ?? '';
    if (!companyId || !result) return { success: false, error: 'validation' };
    try {
        await recordCall({
            companyId,
            contactId: readString(formData, 'contactId'),
            result,
            notes: readString(formData, 'notes'),
            nextCallDatetime: readString(formData, 'nextCallDatetime'),
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    revalidatePath('/calls/history');
    revalidatePath('/calls/company-list');
    return { success: true, companyName };
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

export async function fetchCompanyCallHistory(companyId: string): Promise<CallListItem[]> {
    try {
        return await listCallHistoryByCompany(companyId);
    } catch {
        return [];
    }
}
