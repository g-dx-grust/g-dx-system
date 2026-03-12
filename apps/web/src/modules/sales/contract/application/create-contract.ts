import type { CreateContractRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createContract as createContractInRepository } from '../infrastructure/contract-repository';

export async function createContract(input: CreateContractRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.contract.create');
    return createContractInRepository({
        businessScope: session.activeBusinessScope,
        dealId: input.dealId,
        companyId: input.companyId,
        title: input.title,
        contractNumber: input.contractNumber,
        contractStatus: input.contractStatus ?? 'CONTRACTED',
        amount: input.amount,
        contractDate: input.contractDate,
        invoiceDate: input.invoiceDate,
        paymentDate: input.paymentDate,
        serviceStartDate: input.serviceStartDate,
        serviceEndDate: input.serviceEndDate,
        memo: input.memo,
        ownerUserId: input.ownerUserId,
        actorUserId: session.user.id,
    });
}
