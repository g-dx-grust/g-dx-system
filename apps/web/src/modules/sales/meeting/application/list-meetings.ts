import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { MeetingListFilters } from '../domain/meeting';
import { listMeetingsInRepository } from '../infrastructure/meeting-repository';

export async function listMeetings(filters: MeetingListFilters = {}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.meeting.read');
    return listMeetingsInRepository(session.activeBusinessScope, filters);
}
