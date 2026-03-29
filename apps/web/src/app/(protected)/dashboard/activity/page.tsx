import { redirect } from 'next/navigation';
import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getMonthlyActivityStats } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { getRollingKpi } from '@/modules/sales/deal/application/get-rolling-kpi';
import { NextActionList } from '@/modules/sales/deal/ui/next-action-list';
import { ActivityDashboard } from '@/modules/sales/deal/ui/dashboard-activity';
import { MemberViewTabs } from '@/modules/sales/deal/ui/member-view-tabs';
import { SalesKpiDashboard } from '@/modules/sales/deal/ui/sales-kpi-dashboard';
import { isAppError } from '@/shared/server/errors';

export default async function ActivityDashboardPage() {
    let summary;
    let monthlyStats;
    let rollingKpiData;
    try {
        [summary, monthlyStats, rollingKpiData] = await Promise.all([
            getDashboardSummary(),
            getMonthlyActivityStats(),
            getRollingKpi(),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">活動ダッシュボード</h1>
                <p className="mt-1 text-sm text-gray-500">担当者ごとの活動量とローリングKPIを確認できます。</p>
            </div>

            <MemberViewTabs owners={summary.byOwner} monthlyStats={monthlyStats ?? []} />

            <SalesKpiDashboard rollingKpiData={rollingKpiData} />

            <div className="grid gap-4 lg:grid-cols-3">
                <NextActionList title="本日のネクストアクション" items={summary.nextActionsToday} />
                <NextActionList title="明日のネクストアクション" items={summary.nextActionsTomorrow} />
                <NextActionList title="今週のネクストアクション" items={summary.nextActionsThisWeek} />
            </div>

            <ActivityDashboard summary={summary} monthlyStats={monthlyStats} />
        </div>
    );
}
