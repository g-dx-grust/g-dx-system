import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BusinessScopeType, SalesRollingKpiGrid, KpiSegmentedCounts } from '@g-dx/contracts';

interface SalesKpiDashboardProps {
    rollingKpiData: SalesRollingKpiGrid;
    businessScope?: BusinessScopeType;
}

const GDX_KPI_ROWS: { key: string; label: string }[] = [
    { key: 'visitCount', label: '面会数' },
    { key: 'appointmentCount', label: 'アポイント数' },
    { key: 'negotiationCount', label: '商談数' },
    { key: 'contractCount', label: '契約数' },
];

const JET_KPI_ROWS: { key: string; label: string }[] = [
    { key: 'callCount', label: 'コール数' },
    { key: 'kmContactCount', label: 'KM接触数' },
    { key: 'onlineCount', label: 'WEB商談数' },
];

function SegmentedCell({ counts }: { counts: KpiSegmentedCounts }) {
    const { total, bySegment } = counts;
    return (
        <div className="text-right tabular-nums">
            <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
            {total > 0 ? (
                <div className="text-[11px] leading-tight text-gray-400">
                    <span className="text-blue-500">新{bySegment.new}</span>
                    {' / '}
                    <span className="text-orange-500">既{bySegment.existing}</span>
                </div>
            ) : null}
        </div>
    );
}

export function SalesKpiDashboard({ rollingKpiData, businessScope }: SalesKpiDashboardProps) {
    const kpiRows = businessScope === 'WATER_SAVING' ? JET_KPI_ROWS : GDX_KPI_ROWS;
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">期間別の活動実績</CardTitle>
                <CardDescription>
                    期間別KPI
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                                <th className="sticky left-0 bg-gray-50 px-3 py-3 md:px-4">
                                    KPI指標
                                </th>
                                {rollingKpiData.map((col) => (
                                    <th
                                        key={col.period}
                                        className="px-3 py-3 text-right whitespace-nowrap md:px-4"
                                    >
                                        <div>{col.periodLabel.split(' ')[0]}</div>
                                        <div className="text-[10px] font-normal text-gray-400">
                                            {col.startDate.slice(5)} 〜 {col.endDate.slice(5)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {kpiRows.map((row) => (
                                <tr key={row.key} className="hover:bg-gray-50">
                                    <td className="sticky left-0 bg-white px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap md:px-4 md:py-3">
                                        {row.label}
                                    </td>
                                    {rollingKpiData.map((col) => (
                                        <td
                                            key={col.period}
                                            className="px-3 py-2.5 md:px-4 md:py-3"
                                        >
                                            <SegmentedCell counts={(col.metrics as any)[row.key]} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-2 text-right text-[11px] text-gray-400">
                    <span className="text-blue-500">新</span> = 新規案件（顧客初回）
                    {' '}
                    <span className="text-orange-500">既</span> = 既存案件（リピート）
                </p>
            </CardContent>
        </Card>
    );
}
