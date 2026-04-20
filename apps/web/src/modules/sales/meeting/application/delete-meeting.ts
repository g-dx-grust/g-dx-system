import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { deleteMeetingInRepository } from '../infrastructure/meeting-repository';

export async function deleteMeeting(meetingId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.meeting.delete');
    return deleteMeetingInRepository(meetingId, session.activeBusinessScope, session.user.id);
}
