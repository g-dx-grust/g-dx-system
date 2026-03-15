import { getKpiTargetForMonth } from '@/modules/sales/deal/application/get-kpi-target-for-month';
import { KpiTargetForm } from '@/modules/sales/deal/ui/kpi-target-form';
import { isAppError } from '@/shared/server/errors';
import { redirect } from 'next/navigation';

export default async function KpiSettingsPage() {
    let currentTarget;
    try {
        currentTarget = await getKpiTargetForMonth();
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">KPI目標設定</h1>
                <p className="mt-1 text-sm text-gray-500">月次KPI目標を入力してください。設定した値は個人ダッシュボードに反映されます。</p>
            </div>

            <KpiTargetForm currentTarget={currentTarget} currentMonth={currentMonth} />
        </div>
    );
}
