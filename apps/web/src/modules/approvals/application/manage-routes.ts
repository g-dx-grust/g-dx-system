import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import {
    createApprovalRoute,
    updateApprovalRoute,
    deleteApprovalRoute,
    listUsersInScope,
    type CreateApprovalRouteInput,
    type UpdateApprovalRouteInput,
    type ScopeUserItem,
} from '../infrastructure/approval-repository';

export async function createRoute(input: CreateApprovalRouteInput): Promise<{ id: string }> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'approval.route.manage');
    return createApprovalRoute(session.activeBusinessScope, input);
}

export async function updateRoute(routeId: string, input: UpdateApprovalRouteInput): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'approval.route.manage');
    return updateApprovalRoute(routeId, session.activeBusinessScope, input);
}

export async function deleteRoute(routeId: string): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'approval.route.manage');
    return deleteApprovalRoute(routeId, session.activeBusinessScope);
}

export async function getUsersInScope(): Promise<ScopeUserItem[]> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'approval.route.manage');
    return listUsersInScope(session.activeBusinessScope);
}
