import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { UpdateMeetingInput } from '../domain/meeting';
import { updateMeetingInRepository } from '../infrastructure/meeting-repository';

export async function updateMeeting(meetingId: string, input: UpdateMeetingInput) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.meeting.update');
    return updateMeetingInRepository(meetingId, session.activeBusinessScope, input, session.user.id);
}
