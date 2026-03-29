'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ApprovalTypeValue } from '@g-dx/contracts';
import { isAppError } from '@/shared/server/errors';
import { createApproval } from './application/create-approval';
import { decideApproval } from './application/decide-approval';

const APPROVAL_TYPES = new Set<ApprovalTypeValue>([
    'PRE_MEETING',
    'ESTIMATE_PRESENTATION',
    'TECH_REVIEW',
]);

const APPROVAL_DECISIONS = new Set(['APPROVED', 'REJECTED', 'RETURNED']);

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function createApprovalAction(formData: FormData) {
    const dealId = readString(formData, 'dealId');
    const approvalType = readString(formData, 'approvalType') as ApprovalTypeValue | undefined;
    const meetingDate = readString(formData, 'meetingDate');
    const requestNote = readString(formData, 'requestNote');

    if (!dealId) {
        redirect('/sales/approvals');
    }

    if (!approvalType || !APPROVAL_TYPES.has(approvalType)) {
        redirect(`/sales/deals/${dealId}`);
    }

    try {
        await createApproval({
            dealId,
            approvalType,
            meetingDate,
            snapshotData: requestNote ? { requestNote } : undefined,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/approvals');
        throw error;
    }

    revalidatePath('/sales/approvals');
    revalidatePath(`/sales/deals/${dealId}`);
    redirect(`/sales/deals/${dealId}?approvalCreated=1`);
}

export async function decideApprovalAction(formData: FormData) {
    const approvalId = readString(formData, 'approvalId');
    const dealId = readString(formData, 'dealId');
    const decision = readString(formData, 'decision');
    const comment = readString(formData, 'comment');

    if (!approvalId || !decision || !APPROVAL_DECISIONS.has(decision)) {
        redirect('/sales/approvals');
    }

    try {
        await decideApproval(approvalId, {
            decision: decision as 'APPROVED' | 'REJECTED' | 'RETURNED',
            comment,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/approvals');
        if (isAppError(error, 'SELF_APPROVAL_DENIED')) redirect(`/sales/approvals/${approvalId}`);
        if (isAppError(error, 'VALIDATION_ERROR')) redirect(`/sales/approvals/${approvalId}`);
        throw error;
    }

    revalidatePath('/sales/approvals');
    revalidatePath(`/sales/approvals/${approvalId}`);
    if (dealId) {
        revalidatePath(`/sales/deals/${dealId}`);
    }
    redirect(`/sales/approvals/${approvalId}?decided=1`);
}
