import type { DealStageTransitionRequest, DealStageTransitionResponse } from '@g-dx/contracts';
import { changeDealStage } from '@/modules/sales/deal/application/change-deal-stage';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: { dealId: string };
}

export async function POST(request: Request, { params }: RouteContext) {
    try {
        const body = (await request.json()) as DealStageTransitionRequest;

        if (!body.toStage?.trim()) {
            return errorResponse(422, 'VALIDATION_ERROR', 'toStage is required.', {
                fields: { toStage: ['This field is required.'] },
            });
        }

        const result = await changeDealStage(params.dealId, body);
        return successResponse<DealStageTransitionResponse['data']>(result);
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
        if (isAppError(error, 'INVALID_STAGE_TRANSITION')) {
            return errorResponse(422, 'INVALID_STAGE_TRANSITION', error.message);
        }
        throw error;
    }
}
