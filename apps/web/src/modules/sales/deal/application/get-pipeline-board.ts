import type { PipelineBoardQuery } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getPipelineBoard as getPipelineBoardFromRepository } from '../infrastructure/deal-repository';

export async function getPipelineBoard(query: Pick<PipelineBoardQuery, 'ownerUserId'> = {}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return getPipelineBoardFromRepository(session.activeBusinessScope, query.ownerUserId);
}
