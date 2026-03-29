import type { HearingRecordResponse, HearingCompletionResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getHearingRecord, computeHearingCompletion } from '../infrastructure/hearing-repository';

export async function getHearing(dealId: string): Promise<HearingRecordResponse['data'] | null> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.hearing.read');

    return getHearingRecord(dealId, session.activeBusinessScope);
}

export async function getHearingCompletion(dealId: string): Promise<HearingCompletionResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.hearing.read');

    const record = await getHearingRecord(dealId, session.activeBusinessScope);
    if (!record) {
        return {
            gapCompleted: false,
            targetCompleted: false,
            scopeCompleted: false,
            subsidyCompleted: false,
            decisionCompleted: false,
            allCompleted: false,
            completedCount: 0,
            totalCount: 5,
        };
    }
    return computeHearingCompletion(record);
}
