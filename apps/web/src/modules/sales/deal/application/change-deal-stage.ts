import type { DealStageTransitionRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { changeDealStage as changeDealStageInRepository } from '../infrastructure/deal-repository';

export async function changeDealStage(dealId: string, input: DealStageTransitionRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.update_basic');

    return changeDealStageInRepository({
        dealId,
        toStage: input.toStage,
        note: input.note,
        businessScope: session.activeBusinessScope,
        actorUserId: session.user.id,
    });
}
