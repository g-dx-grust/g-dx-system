import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getMeetingByIdInRepository } from '../infrastructure/meeting-repository';

export async function getMeeting(meetingId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.meeting.read');
    return getMeetingByIdInRepository(meetingId, session.activeBusinessScope);
}
