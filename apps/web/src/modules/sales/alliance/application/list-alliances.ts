import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { AllianceListFilters } from '../domain/alliance';
import { listAlliances as listAlliancesInRepository } from '../infrastructure/alliance-repository';

export async function listAlliances(filters: AllianceListFilters = {}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.alliance.read');
    return listAlliancesInRepository(session.activeBusinessScope, filters);
}
