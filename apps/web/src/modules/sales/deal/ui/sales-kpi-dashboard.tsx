import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SalesKpiData } from '../application/get-sales-kpi';

interface SalesKpiDashboardProps {
    kpiData: Record<string, SalesKpiData>;
    activePeriod: string;
}

const KPI_ITEMS: { key: keyof SalesKpiData; label: string }[] = [
    { key: 'callCount', label: 'コール数' },
    { key: 'visitCount', label: '訪問数' },
    { key: 'onlineCount', label: 'オンライン商談数' },
    { key: 'appointmentCount', label: 'アポイント数' },
    { key: 'negotiationCount', label: '商談化数' },
    { key: 'contractCount', label: '契約数' },
];

const PERIOD_LABELS: Record<string, string> = {
    daily: '日次',
    monthly: '月次',
    quarterly: '四半期',
    yearly: '年間',
};

export function SalesKpiDashboard({ kpiData, activePeriod }: SalesKpiDashboardProps) {
    const periods = ['daily', 'monthly', 'quarterly', 'yearly'] as const;

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">営業KPIサマリー</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">KPI指標</th>
                                {periods.map((p) => (
                                    <th key={p} className={`px-4 py-3 text-right ${p === activePeriod ? 'bg-gray-100 text-gray-900' : ''}`}>
                                        {PERIOD_LABELS[p]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {KPI_ITEMS.map((item) => (
                                <tr key={item.key} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-700">{item.label}</td>
                                    {periods.map((p) => {
                                        const data = kpiData[p];
                                        const value = data ? (data[item.key] as number) : 0;
                                        return (
                                            <td key={p} className={`px-4 py-3 text-right tabular-nums ${p === activePeriod ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                {value.toLocaleString()}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
