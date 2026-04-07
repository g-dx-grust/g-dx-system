import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { UpdateAllianceInput } from '../domain/alliance';
import { updateAlliance as updateAllianceInRepository } from '../infrastructure/alliance-repository';

export async function updateAlliance(allianceId: string, input: UpdateAllianceInput) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.alliance.update');
    return updateAllianceInRepository(allianceId, session.activeBusinessScope, input);
}
