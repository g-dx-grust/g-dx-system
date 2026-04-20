import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { CreateMeetingInput } from '../domain/meeting';
import { createMeetingInRepository } from '../infrastructure/meeting-repository';

export async function createMeeting(input: CreateMeetingInput) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.meeting.create');
    return createMeetingInRepository(session.activeBusinessScope, input, session.user.id);
}
