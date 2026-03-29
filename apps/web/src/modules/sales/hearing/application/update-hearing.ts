import type { UpdateHearingRequest, HearingRecordResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { upsertHearingRecord } from '../infrastructure/hearing-repository';

export async function updateHearing(
    dealId: string,
    input: UpdateHearingRequest,
): Promise<HearingRecordResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.hearing.update');

    return upsertHearingRecord(dealId, session.activeBusinessScope, input, session.user.id);
}
