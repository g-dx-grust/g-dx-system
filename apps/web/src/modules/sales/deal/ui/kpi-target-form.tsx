'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { saveKpiTargetAction } from '@/modules/sales/deal/kpi-server-actions';
import type { UserKpiTarget } from '@g-dx/contracts';

interface KpiTargetFormProps {
    currentTarget: UserKpiTarget | null;
    currentMonth: string;
}

const KPI_FIELDS: Array<{ name: string; label: string; placeholder: string; isRevenue?: boolean }> = [
    { name: 'callTarget', label: 'コール目標（件）', placeholder: '例: 100' },
    { name: 'visitTarget', label: '訪問目標（件）', placeholder: '例: 20' },
    { name: 'appointmentTarget', label: 'アポイント目標（件）', placeholder: '例: 15' },
    { name: 'negotiationTarget', label: '商談化目標（件）', placeholder: '例: 10' },
    { name: 'contractTarget', label: '契約目標（件）', placeholder: '例: 5' },
    { name: 'revenueTarget', label: '売上目標（円）', placeholder: '例: 5000000', isRevenue: true },
];

function getDefaultValue(target: UserKpiTarget | null, field: string): string {
    if (!target) return '';
    const map: Record<string, number> = {
        callTarget: target.callTarget,
        visitTarget: target.visitTarget,
        appointmentTarget: target.appointmentTarget,
        negotiationTarget: target.negotiationTarget,
        contractTarget: target.contractTarget,
        revenueTarget: target.revenueTarget,
    };
    const val = map[field];
    return val !== undefined && val > 0 ? String(val) : '';
}

export function KpiTargetForm({ currentTarget, currentMonth }: KpiTargetFormProps) {
    const searchParams = useSearchParams();
    const saved = searchParams.get('saved') === '1';
    const hasError = searchParams.get('error') !== null;

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">月次KPI目標入力</CardTitle>
                <CardDescription>設定した目標値は個人ダッシュボードのプログレスバーに反映されます。</CardDescription>
            </CardHeader>
            <CardContent>
                {saved && (
                    <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        目標を保存しました。
                    </div>
                )}
                {hasError && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        入力内容にエラーがあります。再度確認してください。
                    </div>
                )}
                <form action={saveKpiTargetAction} className="space-y-6">
                    {/* 月選択 */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="targetMonth">
                            対象月
                        </label>
                        <Input
                            id="targetMonth"
                            type="month"
                            name="targetMonth"
                            defaultValue={currentTarget?.targetMonth ?? currentMonth}
                            required
                            className="max-w-xs"
                        />
                    </div>

                    {/* KPI 数値フィールド */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {KPI_FIELDS.map((field) => (
                            <div key={field.name} className="space-y-1.5">
                                <label
                                    className="block text-sm font-medium text-gray-700"
                                    htmlFor={field.name}
                                >
                                    {field.label}
                                </label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    min="0"
                                    step={field.isRevenue ? '1000' : '1'}
                                    placeholder={field.placeholder}
                                    defaultValue={getDefaultValue(currentTarget, field.name)}
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <Button type="submit">目標を保存</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
