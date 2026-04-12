import { redirect } from 'next/navigation';
import { Role } from '@g-dx/contracts';
import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getMonthlyActivityStats } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { getPersonalActionList } from '@/modules/sales/deal/application/get-personal-action-list';
import { getPersonalDashboardData } from '@/modules/sales/deal/application/get-personal-dashboard-data';
import { getRollingKpi } from '@/modules/sales/deal/application/get-rolling-kpi';
import { getTeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { getTeamAiWeeklySummary } from '@/modules/sales/deal/application/get-ai-weekly-summary';
import { NextActionList } from '@/modules/sales/deal/ui/next-action-list';
import { ActivityDashboard } from '@/modules/sales/deal/ui/dashboard-activity';
import { SalesKpiDashboard } from '@/modules/sales/deal/ui/sales-kpi-dashboard';
import { AiSummaryCard, TeamTargetOverview } from '@/modules/sales/deal/ui/dashboard-primitives';
import { AllMembersActivitySection } from '@/modules/sales/deal/ui/all-members-activity-section';
import type { MemberActivityData } from '@/modules/sales/deal/ui/all-members-activity-section';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';

export default async function ActivityDashboardPage() {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    const canReadPersonalKpi = permissions.has('dashboard.kpi.read');

    let summary;
    let monthlyStats;
    let rollingKpiData;
    let teamTargetSummary;
    let teamAiSummary = null;
    try {
        [summary, monthlyStats, rollingKpiData, teamTargetSummary, teamAiSummary] = await Promise.all([
            getDashboardSummary(),
            getMonthlyActivityStats(),
            getRollingKpi(),
            getTeamKpiTargetSummary(),
            getTeamAiWeeklySummary().catch(() => null),
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

    // 全メンバーのリストを取得（deals を持つ担当者）
    const memberList =
        summary.byOwner.length > 0
            ? summary.byOwner.map((owner) => ({
                  userId: owner.ownerUserId,
                  userName: owner.ownerName,
              }))
            : [{ userId: session.user.id, userName: session.user.name }];

    // 全メンバーの個人データを並列取得
    let allMembersData: MemberActivityData[] = [];
    try {
        const memberDataResults = await Promise.all(
            memberList.map(async (member) => {
                const [dashboardData, actionItems] = await Promise.all([
                    canReadPersonalKpi
                        ? getPersonalDashboardData({ userId: member.userId }).catch(() => null)
                        : Promise.resolve(null),
                    getPersonalActionList({ userId: member.userId }).catch(() => []),
                ]);
                return {
                    userId: member.userId,
                    userName: member.userName,
                    dashboardData,
                    actionItems,
                } satisfies MemberActivityData;
            }),
        );
        allMembersData = memberDataResults;
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
                <p className="mt-1 text-sm text-gray-500">チーム全体の活動状況</p>
            </div>

            <TeamTargetOverview
                summary={teamTargetSummary}
                rollingKpiData={rollingKpiData}
                title="チームKPI"
                description="月次KPI / 実績"
            />

            <AiSummaryCard summary={teamAiSummary} label="チーム" />

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

            <AllMembersActivitySection members={allMembersData} />

            <ActivityDashboard summary={summary} monthlyStats={monthlyStats} />
        </div>
    );
}
