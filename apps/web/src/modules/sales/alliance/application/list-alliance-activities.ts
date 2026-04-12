import type { AllianceActivityItem } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listAllianceActivities as repo } from '../infrastructure/alliance-activity-repository';

export async function listAllianceActivities(allianceId: string): Promise<AllianceActivityItem[]> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.read');
    return repo(allianceId);
}
