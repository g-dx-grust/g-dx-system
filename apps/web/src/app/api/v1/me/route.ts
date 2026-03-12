import type { MeResponse } from '@g-dx/contracts';
import { errorResponse, successResponse } from '@/shared/server/http';
import { getAuthenticatedAppSession, getSessionPermissionModules } from '@/shared/server/session';

export async function GET() {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
    }

    return successResponse<MeResponse['data']>({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        roles: session.user.roles,
        businessScopes: session.user.businessScopes,
        permissions: getSessionPermissionModules(session.user.roles),
    });
}
