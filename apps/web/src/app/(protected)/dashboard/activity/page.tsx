import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getMonthlyActivityStats } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { getRollingKpi } from '@/modules/sales/deal/application/get-rolling-kpi';
import { ActivityDashboard } from '@/modules/sales/deal/ui/dashboard-activity';
import { MemberViewTabs } from '@/modules/sales/deal/ui/member-view-tabs';
import { SalesKpiDashboard } from '@/modules/sales/deal/ui/sales-kpi-dashboard';
import { NextActionList } from '@/modules/sales/deal/ui/next-action-list';
import { isAppError } from '@/shared/server/errors';
import { redirect } from 'next/navigation';

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
                <h1 className="text-2xl font-semibold text-gray-900">営業マン活動ダッシュボード</h1>
                <p className="mt-1 text-sm text-gray-500">担当者別のKPIと保有案件リソース状況</p>
            </div>

            {/* 3.1.1 メンバービュー */}
            <MemberViewTabs owners={summary.byOwner} monthlyStats={monthlyStats ?? []} />

            {/* 3.1.2 営業KPIダッシュボード */}
            <SalesKpiDashboard rollingKpiData={rollingKpiData} />

            {/* 3.1.3 行動予定一覧 */}
            <div className="grid gap-4 lg:grid-cols-2">
                <NextActionList title="本日の行動予定" items={summary.nextActionsToday} />
                <NextActionList title="明日の行動予定" items={summary.nextActionsTomorrow} />
            </div>

            {/* 既存のダッシュボード */}
            <ActivityDashboard summary={summary} monthlyStats={monthlyStats} />
        </div>
    );
}
