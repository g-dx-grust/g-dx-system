import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { DealDashboard } from '@/modules/sales/deal/ui/dashboard-deals';
import { isAppError } from '@/shared/server/errors';
import { redirect } from 'next/navigation';

export default async function DealDashboardPage() {
    let summary;
    try {
        summary = await getDashboardSummary();
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">案件ダッシュボード</h1>
                <p className="mt-1 text-sm text-gray-500">進行中のパイプラインと今後の対応が必要な案件</p>
            </div>
            <DealDashboard summary={summary} />
        </div>
    );
}
