import type { UpdateDealRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateDeal as updateDealInRepository } from '../infrastructure/deal-repository';

export async function updateDeal(dealId: string, input: UpdateDealRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.update_basic');

    return updateDealInRepository({
        dealId,
        primaryContactId: input.primaryContactId,
        name: input.name,
        amount: input.amount,
        expectedCloseDate: input.expectedCloseDate,
        ownerUserId: input.ownerUserId,
        source: input.source,
        memo: input.memo,
        acquisitionMethod: input.acquisitionMethod,
        nextActionDate: input.nextActionDate,
        nextActionContent: input.nextActionContent,
        businessScope: session.activeBusinessScope,
        actorUserId: session.user.id,
    });
}
