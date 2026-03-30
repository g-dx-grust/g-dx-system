import { getKpiTargetForMonth } from '@/modules/sales/deal/application/get-kpi-target-for-month';
import { getTeamKpiTargetSummary } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { TeamTargetOverview } from '@/modules/sales/deal/ui/dashboard-primitives';
import { KpiTargetForm } from '@/modules/sales/deal/ui/kpi-target-form';
import { isAppError } from '@/shared/server/errors';
import { redirect } from 'next/navigation';

export default async function KpiSettingsPage() {
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

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">KPI目標設定</h1>
                <p className="mt-1 text-sm text-gray-500">
                    月次目標を入力し、チーム全体の目標合計とあわせて確認できます。
                </p>
            </div>

            <TeamTargetOverview
                summary={teamTargetSummary}
                title="月次目標の合計"
                description="登録済みの月次目標を、入力状況とあわせて確認できます。"
            />

            <KpiTargetForm currentTarget={currentTarget} currentMonth={currentMonth} />
        </div>
    );
}
