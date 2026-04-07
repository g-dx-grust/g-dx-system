import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { CreateAllianceInput } from '../domain/alliance';
import { createAlliance as createAllianceInRepository } from '../infrastructure/alliance-repository';

export async function createAlliance(input: CreateAllianceInput) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.alliance.create');
    return createAllianceInRepository(session.activeBusinessScope, input, session.user.id);
}
