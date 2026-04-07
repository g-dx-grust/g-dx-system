import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { deleteDeal as deleteDealInRepository } from '../infrastructure/deal-repository';

export async function deleteDeal(dealId: string): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.update_critical');
    await deleteDealInRepository(dealId);
}
