import { redirect } from 'next/navigation';
import { getApprovalRoutes } from '@/modules/approvals/application/list-approval-routes';
import { ApprovalRouteListView } from '@/modules/approvals/ui/approval-route-list';
import { isAppError } from '@/shared/server/errors';

export default async function ApprovalRoutesPage() {
    let routes;
    try {
        routes = await getApprovalRoutes();
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return <ApprovalRouteListView routes={routes} />;
}
