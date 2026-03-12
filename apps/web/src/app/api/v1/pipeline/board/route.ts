import type { PipelineBoardResponse } from '@g-dx/contracts';
import { getPipelineBoard } from '@/modules/sales/deal/application/get-pipeline-board';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ownerUserId = searchParams.get('ownerUserId') ?? undefined;

        const board = await getPipelineBoard({ ownerUserId });
        return successResponse<PipelineBoardResponse['data']>(board);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }
        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to the pipeline board.');
        }
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }
        throw error;
    }
}
