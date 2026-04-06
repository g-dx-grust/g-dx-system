import { redirect } from 'next/navigation';
import type { ApprovalRequestListItem } from '@g-dx/contracts';
import { Role } from '@g-dx/contracts';
import { listApprovals } from '@/modules/approvals/application/list-approvals';
import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getMonthlyActivityStats } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { getPersonalActionList } from '@/modules/sales/deal/application/get-personal-action-list';
import { getPersonalDashboardData } from '@/modules/sales/deal/application/get-personal-dashboard-data';
import { getRollingKpi } from '@/modules/sales/deal/application/get-rolling-kpi';
import { getTeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { ActivityPersonalView } from '@/modules/sales/deal/ui/activity-personal-view';
import { NextActionList } from '@/modules/sales/deal/ui/next-action-list';
import { ActivityDashboard } from '@/modules/sales/deal/ui/dashboard-activity';
import { SalesKpiDashboard } from '@/modules/sales/deal/ui/sales-kpi-dashboard';
import { TeamTargetOverview } from '@/modules/sales/deal/ui/dashboard-primitives';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';

interface ActivityDashboardPageProps {
    searchParams?: {
        member?: string;
    };
}

export default async function ActivityDashboardPage({
    searchParams,
}: ActivityDashboardPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    const canReadApprovals = permissions.has('approval.request.read');
    const canReadPersonalKpi = permissions.has('dashboard.kpi.read');
    const isAdminOrAbove = session.user.roles.some(
        (r) => r === Role.SUPER_ADMIN || r === Role.ADMIN,
    );

    let summary;
    let monthlyStats;
    let rollingKpiData;
    let teamTargetSummary;
    try {
        [summary, monthlyStats, rollingKpiData, teamTargetSummary] = await Promise.all([
            getDashboardSummary(),
            getMonthlyActivityStats(),
            getRollingKpi(),
            getTeamKpiTargetSummary(),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (
            isAppError(error, 'FORBIDDEN') ||
            isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')
        ) {
            redirect('/unauthorized');
        }
        throw error;
    }

    const memberOptions =
        summary.byOwner.length > 0
            ? summary.byOwner.map((owner) => ({
                  userId: owner.ownerUserId,
                  userName: owner.ownerName,
                  isCurrentUser: owner.ownerUserId === session.user.id,
              }))
            : [
                  {
                      userId: session.user.id,
                      userName: session.user.name,
                      isCurrentUser: true,
                  },
              ];
    const defaultMemberId = memberOptions.some(
        (option) => option.userId === session.user.id,
    )
        ? session.user.id
        : (memberOptions[0]?.userId ?? session.user.id);
    const selectedMemberId =
        searchParams?.member &&
        memberOptions.some((option) => option.userId === searchParams.member)
            ? searchParams.member
            : defaultMemberId;
    const selectedMemberName =
        memberOptions.find((option) => option.userId === selectedMemberId)?.userName ??
        session.user.name;

    let personalDashboardData = null;
    let personalActionItems = [];
    let pendingApprovals: ApprovalRequestListItem[] = [];
    let requestedApprovals: ApprovalRequestListItem[] = [];

    try {
        const [
            dashboardDataResult,
            actionItemsResult,
            pendingApprovalResult,
            requestedApprovalResult,
        ] = await Promise.all([
            canReadPersonalKpi
                ? getPersonalDashboardData({ userId: selectedMemberId })
                : Promise.resolve(null),
            getPersonalActionList({ userId: selectedMemberId }),
            canReadApprovals
                ? listApprovals({
                      approvalStatus: 'PENDING',
                      approverUserId: selectedMemberId,
                      pageSize: 5,
                  })
                : Promise.resolve(null),
            canReadApprovals
                ? listApprovals({
                      applicantUserId: selectedMemberId,
                      pageSize: 5,
                  })
                : Promise.resolve(null),
        ]);

        personalDashboardData = dashboardDataResult;
        personalActionItems = actionItemsResult;
        pendingApprovals = pendingApprovalResult?.data ?? [];
        requestedApprovals = requestedApprovalResult?.data ?? [];
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (
            isAppError(error, 'FORBIDDEN') ||
            isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')
        ) {
            redirect('/unauthorized');
        }
        throw error;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    活動ダッシュボード
                </h1>
                <p className="mt-1 text-sm text-gray-500">活動ダッシュボード</p>
            </div>

            <TeamTargetOverview
                summary={teamTargetSummary}
                rollingKpiData={rollingKpiData}
                title="チームKPI"
                description="月次KPI / 実績"
            />

            <SalesKpiDashboard rollingKpiData={rollingKpiData} />

            <div className="grid gap-4 lg:grid-cols-3">
                <NextActionList
                    title="今日のネクストアクション"
                    items={summary.nextActionsToday}
                />
                <NextActionList
                    title="明日のネクストアクション"
                    items={summary.nextActionsTomorrow}
                />
                <NextActionList
                    title="今週のネクストアクション"
                    items={summary.nextActionsThisWeek}
                />
            </div>

            <ActivityPersonalView
                memberOptions={memberOptions}
                selectedMemberId={selectedMemberId}
                selectedMemberName={selectedMemberName}
                dashboardData={personalDashboardData}
                actionItems={personalActionItems}
                canReadApprovals={canReadApprovals}
                pendingApprovals={pendingApprovals}
                requestedApprovals={requestedApprovals}
                suppressTargetAlert={isAdminOrAbove}
            />

            <ActivityDashboard summary={summary} monthlyStats={monthlyStats} />
        </div>
    );
}
