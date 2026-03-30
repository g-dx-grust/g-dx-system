import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getDashboardSummary } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getRollingKpi } from '@/modules/sales/deal/application/get-rolling-kpi';
import { getTeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { DealDashboard } from '@/modules/sales/deal/ui/dashboard-deals';
import { DashboardContentSkeleton } from '@/modules/sales/deal/ui/dashboard-loading-skeleton';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';

export default function DealDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    営業ダッシュボード
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    営業活動の流れと次の打ち手に加えて、会社目標との位置関係も同じ画面で見渡せるようにしています。
                </p>
            </div>

            <Suspense fallback={<DashboardContentSkeleton />}>
                <DealDashboardContent />
            </Suspense>
        </div>
    );
}

async function DealDashboardContent() {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        const [summary, rollingKpiData, teamTargetSummary] = await Promise.all([
            getDashboardSummary(),
            getRollingKpi(),
            getTeamKpiTargetSummary(),
        ]);

        const canViewBusinessGoals = session.user.roles.some(
            (role) => role === 'SUPER_ADMIN' || role === 'ADMIN',
        );

        return (
            <DealDashboard
                summary={summary}
                rollingKpiData={rollingKpiData}
                teamTargetSummary={teamTargetSummary}
                businessScope={session.activeBusinessScope}
                canViewBusinessGoals={canViewBusinessGoals}
            />
        );
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
