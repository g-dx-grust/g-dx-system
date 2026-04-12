import type { UpdateAllianceActivityRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateAllianceActivity as repo } from '../infrastructure/alliance-activity-repository';

export async function updateAllianceActivity(
    activityId: string,
    allianceId: string,
    updates: UpdateAllianceActivityRequest,
) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.update_basic');
    return repo(activityId, allianceId, updates);
}
