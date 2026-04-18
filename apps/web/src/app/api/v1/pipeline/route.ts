import type { PipelineResponse } from '@g-dx/contracts';
import { getPipeline } from '@/modules/sales/deal/application/get-pipeline';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET() {
    try {
        const pipeline = await getPipeline();
        return successResponse<PipelineResponse['data']>(pipeline);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }
        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to the pipeline.');
        }
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }
        throw error;
    }
}
