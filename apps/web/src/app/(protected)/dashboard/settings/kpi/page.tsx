import { redirect } from 'next/navigation';
import { getKpiTargetForMonth } from '@/modules/sales/deal/application/get-kpi-target-for-month';
import { getTeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { TeamTargetOverview } from '@/modules/sales/deal/ui/dashboard-primitives';
import { KpiTargetForm } from '@/modules/sales/deal/ui/kpi-target-form';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';

export default async function KpiSettingsPage() {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    let currentTarget;
    let teamTargetSummary;
    try {
        [currentTarget, teamTargetSummary] = await Promise.all([
            getKpiTargetForMonth(),
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

    const canManageBusinessGoals = session.user.roles.some(
        (role) => role === 'SUPER_ADMIN' || role === 'ADMIN',
    );
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
    ).padStart(2, '0')}`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    KPI設定
                </h1>
                <p className="mt-1 text-sm text-gray-500">KPI設定</p>
            </div>

            <TeamTargetOverview
                summary={teamTargetSummary}
                title="チームKPI"
                description="月次KPI / 入力状況"
            />

            <KpiTargetForm
                currentTarget={currentTarget}
                currentMonth={currentMonth}
                businessScope={session.activeBusinessScope}
                canManageBusinessGoals={canManageBusinessGoals}
            />
        </div>
    );
}
