import type { PermissionKey } from '@g-dx/contracts';
import { getGrantedPermissionKeys, type AuthenticatedAppSession } from '@/shared/server/session';
import { AppError } from '@/shared/server/errors';

export function hasPermission(session: AuthenticatedAppSession, permissionKey: PermissionKey): boolean {
    return getGrantedPermissionKeys(session.user.roles).includes(permissionKey);
}

export function assertPermission(session: AuthenticatedAppSession, permissionKey: PermissionKey): void {
    if (!hasPermission(session, permissionKey)) {
        throw new AppError('FORBIDDEN');
    }
}
