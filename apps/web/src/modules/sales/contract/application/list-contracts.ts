import type { ContractListFilters } from '../infrastructure/contract-repository';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listContracts as listContractsInRepository } from '../infrastructure/contract-repository';

export async function listContracts(filters: ContractListFilters = {}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.contract.read');
    return listContractsInRepository(session.activeBusinessScope, filters);
}
