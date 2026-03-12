import type { LogoutResponse, SessionResponse } from '@g-dx/contracts';
import {
    clearSession,
    getAuthenticatedAppSession,
    getGrantedPermissionKeys,
    getSessionPermissionModules,
} from '@/shared/server/session';
import { successResponse } from '@/shared/server/http';

export async function GET() {
    const session = await getAuthenticatedAppSession();

    const payload: SessionResponse['data'] = session
        ? {
              isAuthenticated: true,
              user: session.user,
              activeBusinessScope: session.activeBusinessScope,
              permissions: {
                  modules: getSessionPermissionModules(session.user.roles),
                  grantedKeys: getGrantedPermissionKeys(session.user.roles),
              },
          }
        : {
              isAuthenticated: false,
              user: null,
          };

    return successResponse<SessionResponse['data']>(payload);
}

export async function DELETE() {
    await clearSession();
    return successResponse<LogoutResponse['data']>({
        loggedOut: true,
    });
}
