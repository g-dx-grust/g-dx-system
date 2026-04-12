import type { AllianceActivityType } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createAllianceActivity as repo } from '../infrastructure/alliance-activity-repository';

export async function createAllianceActivity(input: {
    allianceId: string;
    activityType: AllianceActivityType;
    activityDate: string;
    summary?: string;
    larkMeetingUrl?: string;
    nextActionDate?: string;
    nextActionContent?: string;
}): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.update_basic');
    return repo({ ...input, businessScope: session.activeBusinessScope, userId: session.user.id });
}
