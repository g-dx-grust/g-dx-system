import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getDealDetail as getDealDetailFromRepository, getDealStageHistory as getDealStageHistoryFromRepository } from '../infrastructure/deal-repository';
import type { DealStageHistoryItem } from '../infrastructure/deal-repository';

export async function getDealDetail(dealId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return getDealDetailFromRepository(dealId, session.activeBusinessScope);
}

export async function getDealStageHistory(dealId: string): Promise<DealStageHistoryItem[]> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return getDealStageHistoryFromRepository(dealId, session.activeBusinessScope);
}

