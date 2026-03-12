import type { CreateDealRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createDeal as createDealInRepository } from '../infrastructure/deal-repository';

export async function createDeal(input: CreateDealRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.create');

    return createDealInRepository({
        businessScope: session.activeBusinessScope,
        companyId: input.companyId,
        primaryContactId: input.primaryContactId,
        name: input.name,
        stage: input.stage,
        amount: input.amount,
        expectedCloseDate: input.expectedCloseDate,
        ownerUserId: input.ownerUserId,
        source: input.source,
        memo: input.memo,
        actorUserId: session.user.id,
    });
}
