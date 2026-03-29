import type { HearingRecordResponse, HearingCompletionResponse, UpdateHearingRequest } from '@g-dx/contracts';
import { getHearing, getHearingCompletion } from '@/modules/sales/hearing/application/get-hearing';
import { updateHearing } from '@/modules/sales/hearing/application/update-hearing';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: { dealId: string };
}

export async function GET(request: Request, { params }: RouteContext) {
    try {
        const { searchParams } = new URL(request.url);
        const completionOnly = searchParams.get('completionOnly') === 'true';

        if (completionOnly) {
            const completion = await getHearingCompletion(params.dealId);
            return successResponse<HearingCompletionResponse['data']>(completion);
        }

        const record = await getHearing(params.dealId);
        if (!record) {
            return errorResponse(404, 'NOT_FOUND', 'Hearing record not found for this deal.');
        }
        return successResponse<HearingRecordResponse['data']>(record);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to hearing records.');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        if (isAppError(error, 'NOT_FOUND')) return errorResponse(404, 'NOT_FOUND', 'Deal was not found.');
        throw error;
    }
}

export async function PUT(request: Request, { params }: RouteContext) {
    try {
        const body = (await request.json()) as UpdateHearingRequest;
        const record = await updateHearing(params.dealId, body);
        return successResponse<HearingRecordResponse['data']>(record);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        if (isAppError(error, 'FORBIDDEN')) return errorResponse(403, 'FORBIDDEN', 'You do not have access to update hearing records.');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        if (isAppError(error, 'NOT_FOUND')) return errorResponse(404, 'NOT_FOUND', 'Deal was not found.');
        throw error;
    }
}
