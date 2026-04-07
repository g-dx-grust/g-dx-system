import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getAllianceById } from '../infrastructure/alliance-repository';

export async function getAllianceDetail(allianceId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.alliance.read');
    const alliance = await getAllianceById(allianceId, session.activeBusinessScope);
    if (!alliance) throw new AppError('NOT_FOUND');
    return alliance;
}
