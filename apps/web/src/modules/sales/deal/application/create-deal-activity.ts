import type { DealActivityType } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createDealActivity as repo } from '../infrastructure/activity-repository';
export async function createDealActivity(input: { dealId: string; activityType: DealActivityType; activityDate: string; summary?: string; meetingCount?: number }) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.update_basic');
    return repo({ ...input, businessScope: session.activeBusinessScope, userId: session.user.id });
}
