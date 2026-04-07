import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getContractById } from '../infrastructure/contract-repository';

export async function getContractDetail(contractId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.contract.read');
    const contract = await getContractById(contractId, session.activeBusinessScope);
    if (!contract) throw new AppError('NOT_FOUND');
    return contract;
}
