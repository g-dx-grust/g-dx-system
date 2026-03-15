import { getPersonalDashboardData } from '@/modules/sales/deal/application/get-personal-dashboard-data';
import { getPersonalActionList } from '@/modules/sales/deal/application/get-personal-action-list';
import { PersonalKpiProgress } from '@/modules/sales/deal/ui/personal-kpi-progress';
import { PersonalActionList } from '@/modules/sales/deal/ui/personal-action-list';
import { isAppError } from '@/shared/server/errors';
import { redirect } from 'next/navigation';

export default async function PersonalDashboardPage() {
    let dashboardData;
    let actionItems;
    try {
        [dashboardData, actionItems] = await Promise.all([
            getPersonalDashboardData(),
            getPersonalActionList(),
        ]);
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

            <PersonalActionList items={actionItems} />
        </div>
    );
}
