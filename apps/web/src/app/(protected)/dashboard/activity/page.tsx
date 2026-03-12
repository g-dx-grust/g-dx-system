import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getMonthlyActivityStats } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { ActivityDashboard } from '@/modules/sales/deal/ui/dashboard-activity';
import { isAppError } from '@/shared/server/errors';
import { redirect } from 'next/navigation';

export default async function ActivityDashboardPage() {
    let summary;
    let monthlyStats;
    try {
        [summary, monthlyStats] = await Promise.all([
            getDashboardSummary(),
            getMonthlyActivityStats(),
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
            <ActivityDashboard summary={summary} monthlyStats={monthlyStats} />
        </div>
    );
}
