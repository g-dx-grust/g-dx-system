'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createContract } from '@/modules/sales/contract/application/create-contract';
import { updateContract } from '@/modules/sales/contract/application/update-contract';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { ContractStatus } from '@g-dx/contracts';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function createContractAction(formData: FormData) {
    const title = readString(formData, 'title');
    const companyId = readString(formData, 'companyId');

    if (!title || !companyId) {
        redirect('/sales/contracts/new?error=validation');
    }

    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const amountRaw = readString(formData, 'amount');
    const amount = amountRaw ? Number(amountRaw) : undefined;

    try {
        const result = await createContract({
            companyId,
            title,
            contractNumber: readString(formData, 'contractNumber'),
            contractStatus: (readString(formData, 'contractStatus') as ContractStatus | undefined) ?? 'CONTRACTED',
            amount: amount !== undefined && !isNaN(amount) ? amount : undefined,
            contractDate: readString(formData, 'contractDate'),
            invoiceDate: readString(formData, 'invoiceDate'),
            paymentDate: readString(formData, 'paymentDate'),
            serviceStartDate: readString(formData, 'serviceStartDate'),
            serviceEndDate: readString(formData, 'serviceEndDate'),
            memo: readString(formData, 'memo'),
            ownerUserId: session.user.id,
        });
        revalidatePath('/sales/contracts');
        revalidatePath(`/customers/companies/${companyId}`);
        redirect(`/sales/contracts/${result.id}?created=1`);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
}

export async function updateContractAction(formData: FormData) {
    const contractId = readString(formData, 'contractId');
    if (!contractId) redirect('/sales/contracts');

    const amountRaw = readString(formData, 'amount');
    const amount = amountRaw !== undefined ? (amountRaw === '' ? null : Number(amountRaw)) : undefined;

    try {
        await updateContract(contractId, {
            title: readString(formData, 'title'),
            contractNumber: readString(formData, 'contractNumber') ?? null,
            contractStatus: readString(formData, 'contractStatus') as ContractStatus | undefined,
            amount: amount !== undefined && (amount === null || !isNaN(amount)) ? amount : undefined,
            contractDate: readString(formData, 'contractDate') ?? null,
            invoiceDate: readString(formData, 'invoiceDate') ?? null,
            paymentDate: readString(formData, 'paymentDate') ?? null,
            serviceStartDate: readString(formData, 'serviceStartDate') ?? null,
            serviceEndDate: readString(formData, 'serviceEndDate') ?? null,
            memo: readString(formData, 'memo') ?? null,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/contracts');
        throw error;
    }

    revalidatePath('/sales/contracts');
    revalidatePath(`/sales/contracts/${contractId}`);
    redirect(`/sales/contracts/${contractId}?updated=1`);
}
