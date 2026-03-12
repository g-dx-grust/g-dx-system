import type { UpdateContractRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateContract as updateContractInRepository } from '../infrastructure/contract-repository';

export async function updateContract(contractId: string, input: UpdateContractRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.contract.update_basic');
    return updateContractInRepository({
        contractId,
        ...input,
        actorUserId: session.user.id,
    });
}
