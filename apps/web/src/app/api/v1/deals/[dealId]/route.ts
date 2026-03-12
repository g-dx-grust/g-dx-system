import type { DealDetailResponse, UpdateDealRequest, UpdateDealResponse } from '@g-dx/contracts';
import { getDealDetail } from '@/modules/sales/deal/application/get-deal-detail';
import { updateDeal } from '@/modules/sales/deal/application/update-deal';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: { dealId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
    try {
        const deal = await getDealDetail(params.dealId);
        return successResponse<DealDetailResponse['data']>(deal);
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
        if (isAppError(error, 'NOT_FOUND')) {
            return errorResponse(404, 'NOT_FOUND', 'Deal was not found.');
        }
        throw error;
    }
}

export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const body = (await request.json()) as UpdateDealRequest;
        const updated = await updateDeal(params.dealId, body);
        return successResponse<UpdateDealResponse['data']>(updated);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }
        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to update deals.');
        }
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }
        if (isAppError(error, 'NOT_FOUND')) {
            return errorResponse(404, 'NOT_FOUND', 'Deal was not found.');
        }
        throw error;
    }
}
