import { redirect } from 'next/navigation';
import { getApprovalRoutes } from '@/modules/approvals/application/list-approval-routes';
import { getUsersInScope } from '@/modules/approvals/application/manage-routes';
import { ApprovalRouteManager } from '@/modules/approvals/ui/approval-route-manager';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';

interface ApprovalRoutesPageProps {
    searchParams?: {
        created?: string;
        updated?: string;
        deleted?: string;
    };
}

export default async function ApprovalRoutesPage({ searchParams }: ApprovalRoutesPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    const canManage = permissions.has('approval.route.manage');

    let routes;
    let users: { id: string; displayName: string }[] = [];

    try {
        [routes, users] = await Promise.all([
            getApprovalRoutes(),
            canManage ? getUsersInScope() : Promise.resolve([]),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <ApprovalRouteManager
            routes={routes}
            users={users}
            canManage={canManage}
            created={searchParams?.created === '1'}
            updated={searchParams?.updated === '1'}
            deleted={searchParams?.deleted === '1'}
        />
    );
}
