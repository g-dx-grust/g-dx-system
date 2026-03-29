import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { DashboardContentSkeleton } from '@/modules/sales/deal/ui/dashboard-loading-skeleton';
import { DealDashboard } from '@/modules/sales/deal/ui/dashboard-deals';
import { isAppError } from '@/shared/server/errors';

export default function DealDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">営業ダッシュボード</h1>
                <p className="mt-1 text-sm text-gray-500">
                    営業中のパイプラインと直近対応が必要な案件を確認できます。
                </p>
            </div>

            <Suspense fallback={<DashboardContentSkeleton />}>
                <DealDashboardContent />
            </Suspense>
        </div>
    );
}

async function DealDashboardContent() {
    try {
        const summary = await getDashboardSummary();
        return <DealDashboard summary={summary} />;
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
}
