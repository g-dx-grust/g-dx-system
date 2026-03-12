import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getPipeline as getPipelineFromRepository } from '../infrastructure/deal-repository';

export async function getPipeline() {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return getPipelineFromRepository(session.activeBusinessScope);
}
