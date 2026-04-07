import type { ContractActivityType } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createContractActivity as repo } from '../infrastructure/contract-repository';

export async function createContractActivity(input: {
    contractId: string;
    activityType: ContractActivityType;
    activityDate: string;
    summary?: string;
}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.contract.update_basic');
    return repo({ ...input, businessScope: session.activeBusinessScope, userId: session.user.id });
}
