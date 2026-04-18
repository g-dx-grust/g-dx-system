import type { CreateDealRequest, CreateDealResponse, DealListQuery, DealListResponse, DealStageKey } from '@g-dx/contracts';
import { createDeal } from '@/modules/sales/deal/application/create-deal';
import { listDeals } from '@/modules/sales/deal/application/list-deals';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page') ?? '1');
        const pageSize = Number(searchParams.get('pageSize') ?? '20');
        const keyword = searchParams.get('keyword') ?? undefined;
        const stage = (searchParams.get('stage') ?? undefined) as DealStageKey | undefined;
        const ownerUserId = searchParams.get('ownerUserId') ?? undefined;
        const companyId = searchParams.get('companyId') ?? undefined;

        const result = await listDeals({
            page: Number.isFinite(page) ? page : 1,
            pageSize: Number.isFinite(pageSize) ? pageSize : 20,
            keyword,
            stage,
            ownerUserId,
            companyId,
        } satisfies Pick<DealListQuery, 'page' | 'pageSize' | 'keyword' | 'stage' | 'ownerUserId' | 'companyId'>);

        return successResponse<DealListResponse['data'], DealListResponse['meta']>(result.data, result.meta);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }
        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to deals.');
        }
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as CreateDealRequest;

        if (!body.companyId?.trim()) {
            return errorResponse(422, 'VALIDATION_ERROR', 'companyId is required.', {
                fields: { companyId: ['This field is required.'] },
            });
        }
        if (!body.name?.trim()) {
            return errorResponse(422, 'VALIDATION_ERROR', 'Deal name is required.', {
                fields: { name: ['This field is required.'] },
            });
        }
        if (!body.stage?.trim()) {
            return errorResponse(422, 'VALIDATION_ERROR', 'stage is required.', {
                fields: { stage: ['This field is required.'] },
            });
        }
        if (!body.ownerUserId?.trim()) {
            return errorResponse(422, 'VALIDATION_ERROR', 'ownerUserId is required.', {
                fields: { ownerUserId: ['This field is required.'] },
            });
        }

        const created = await createDeal(body);
        return successResponse<CreateDealResponse['data']>(created);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }
        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to create deals.');
        }
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }
        if (isAppError(error, 'VALIDATION_ERROR')) {
            return errorResponse(422, 'VALIDATION_ERROR', error.message);
        }
        throw error;
    }
}
