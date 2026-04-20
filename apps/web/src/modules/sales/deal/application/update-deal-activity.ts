import type {
    DealActivityType,
    MeetingTargetType,
    NegotiationOutcome,
    VisitCategory,
} from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateDealActivity as repo } from '../infrastructure/activity-repository';

export async function updateDealActivity(input: {
    activityId: string;
    dealId: string;
    activityType?: DealActivityType;
    activityDate?: string;
    summary?: string | null;
    meetingCount?: number;
    visitCategory?: VisitCategory | null;
    targetType?: MeetingTargetType | null;
    isNegotiation?: boolean;
    negotiationOutcome?: NegotiationOutcome | null;
    competitorInfo?: string | null;
    larkMeetingUrl?: string | null;
    isKmContact?: boolean;
}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.update_basic');
    return repo({ ...input, actorUserId: session.user.id });
}
