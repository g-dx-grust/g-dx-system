import type { DealListQuery } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listDeals as listDealsFromRepository } from '../infrastructure/deal-repository';

export async function listDeals(
    query: Pick<DealListQuery, 'page' | 'pageSize' | 'keyword' | 'stage' | 'ownerUserId' | 'companyId'> = {}
) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'sales.deal.read');

    return listDealsFromRepository({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        stage: query.stage,
        ownerUserId: query.ownerUserId,
        companyId: query.companyId,
        businessScope: session.activeBusinessScope,
    });
}
