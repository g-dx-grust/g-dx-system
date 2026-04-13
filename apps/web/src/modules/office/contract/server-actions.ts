'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@g-dx/database';
import { contracts } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { assertPermission } from '@/shared/server/authorization';
import { AppError, isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function updateOfficeContractPaymentAction(formData: FormData) {
    const contractId = readString(formData, 'contractId');
    if (!contractId) return;

    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        assertPermission(session, 'office.contract.manage');
    } catch {
        redirect('/unauthorized');
    }

    const paymentDate = readString(formData, 'paymentDate') ?? null;
    const contractStatus = readString(formData, 'contractStatus');
    const invoiceDate = readString(formData, 'invoiceDate') ?? null;

    // contractId が存在するか確認（論理削除されていないもの）
    const [existing] = await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(and(eq(contracts.id, contractId), isNull(contracts.deletedAt)))
        .limit(1);

    if (!existing) {
        throw new AppError('NOT_FOUND', 'Contract not found.');
    }

    await db
        .update(contracts)
        .set({
            paymentDate: paymentDate ?? null,
            invoiceDate: invoiceDate ?? null,
            ...(contractStatus ? { contractStatus } : {}),
            updatedAt: new Date(),
        })
        .where(eq(contracts.id, contractId));

    revalidatePath('/office/contracts');
    revalidatePath(`/sales/contracts/${contractId}`);
}
