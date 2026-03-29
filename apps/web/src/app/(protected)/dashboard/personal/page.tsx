import { redirect } from 'next/navigation';
import type { ApprovalRequestListItem } from '@g-dx/contracts';
import { listApprovals } from '@/modules/approvals/application/list-approvals';
import { PersonalApprovalOverview } from '@/modules/approvals/ui/personal-approval-overview';
import { getPersonalDashboardData } from '@/modules/sales/deal/application/get-personal-dashboard-data';
import { getPersonalActionList } from '@/modules/sales/deal/application/get-personal-action-list';
import { PersonalCompanyActionHighlights } from '@/modules/sales/deal/ui/personal-company-action-highlights';
import { PersonalKpiProgress } from '@/modules/sales/deal/ui/personal-kpi-progress';
import { PersonalActionList } from '@/modules/sales/deal/ui/personal-action-list';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';

export default async function PersonalDashboardPage() {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    const canReadApprovals = permissions.has('approval.request.read');

    let dashboardData;
    let actionItems;
    let pendingApprovals: ApprovalRequestListItem[] = [];
    let requestedApprovals: ApprovalRequestListItem[] = [];
    try {
        const [dashboardResult, actionResult, pendingApprovalResult, requestedApprovalResult] = await Promise.all([
            getPersonalDashboardData(),
            getPersonalActionList(),
            canReadApprovals
                ? listApprovals({
                    approvalStatus: 'PENDING',
                    approverUserId: session.user.id,
                    pageSize: 5,
                })
                : Promise.resolve(null),
            canReadApprovals
                ? listApprovals({
                    applicantUserId: session.user.id,
                    pageSize: 5,
                })
                : Promise.resolve(null),
        ]);
        dashboardData = dashboardResult;
        actionItems = actionResult;
        pendingApprovals = pendingApprovalResult?.data ?? [];
        requestedApprovals = requestedApprovalResult?.data ?? [];
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">個人ダッシュボード</h1>
                <p className="mt-1 text-sm text-gray-500">今月の個人KPI達成状況と行動予定</p>
            </div>

            <PersonalKpiProgress data={dashboardData} />

            <PersonalCompanyActionHighlights
                memberName={session.user.name}
                groups={dashboardData.lastWeekCompanyActions}
            />

            {canReadApprovals ? (
                <PersonalApprovalOverview
                    pendingItems={pendingApprovals}
                    requestedItems={requestedApprovals}
                />
            ) : null}

            <PersonalActionList items={actionItems} />
        </div>
    );
}
