import type { SessionScopeUpdateRequest, SessionScopeUpdateResponse } from '@g-dx/contracts';
import { getAuthenticatedAppSession, setActiveBusinessScopeCookie } from '@/shared/server/session';
import { errorResponse, successResponse } from '@/shared/server/http';
import { isBusinessScopeType } from '@/shared/constants/business-scopes';

export async function POST(request: Request) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
    }

    const body = (await request.json()) as Partial<SessionScopeUpdateRequest>;
    if (!body.activeBusinessScope || !isBusinessScopeType(body.activeBusinessScope)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Invalid business scope.', {
            fields: {
                activeBusinessScope: ['A valid business scope is required.'],
            },
        });
    }

    if (!session.businessMemberships.some((membership) => membership.code === body.activeBusinessScope)) {
        return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'You cannot activate that business scope.');
    }

    await setActiveBusinessScopeCookie(body.activeBusinessScope);

    return successResponse<SessionScopeUpdateResponse['data']>({
        activeBusinessScope: body.activeBusinessScope,
    });
}
