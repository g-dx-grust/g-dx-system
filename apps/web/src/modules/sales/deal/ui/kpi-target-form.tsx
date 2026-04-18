'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { saveKpiTargetAction } from '@/modules/sales/deal/kpi-server-actions';
import { BusinessGoalSettingsSection } from '@/modules/sales/deal/ui/business-goal-section';
import type { BusinessScopeType, UserKpiTarget } from '@g-dx/contracts';

interface KpiTargetFormProps {
    currentTarget: UserKpiTarget | null;
    currentMonth: string;
    businessScope: BusinessScopeType;
    canManageBusinessGoals: boolean;
}

interface KpiField {
    name: string;
    label: string;
    placeholder: string;
    helper: string;
    isRevenue?: boolean;
}

interface KpiFieldGroup {
    title: string;
    description: string;
    fields: KpiField[];
}

const KPI_FIELD_GROUPS: KpiFieldGroup[] = [
    {
        title: '重点確認項目',
        description:
            '月次KPI入力',
        fields: [
            {
                name: 'newVisitTarget',
                label: '面会数',
                placeholder: '例 20',
                helper: '面会目標',
            },
            {
                name: 'newNegotiationTarget',
                label: '商談数',
                placeholder: '例 10',
                helper: '商談目標',
            },
            {
                name: 'contractTarget',
                label: '契約数',
                placeholder: '例 5',
                helper: '月内の契約完了件数の目線を合わせます。',
            },
            {
                name: 'revenueTarget',
                label: '売上',
                placeholder: '例 5000000',
                helper: '売上目標',
                isRevenue: true,
            },
        ],
    },
    {
        title: '補助入力項目',
        description: 'アポイント数の目安を設定できます。',
        fields: [
            {
                name: 'appointmentTarget',
                label: 'アポイント数',
                placeholder: '例 15',
                helper: '初回接点の入り口として見ておきたい件数です。',
            },
        ],
    },
];

function getDefaultValue(target: UserKpiTarget | null, field: string): string {
    if (!target) return '';
    const map: Record<string, number> = {
        callTarget: target.callTarget,
        visitTarget: target.visitTarget,
        newVisitTarget: target.newVisitTarget,
        appointmentTarget: target.appointmentTarget,
        negotiationTarget: target.negotiationTarget,
        newNegotiationTarget: target.newNegotiationTarget,
        contractTarget: target.contractTarget,
        revenueTarget: target.revenueTarget,
    };
    const value = map[field];
    return value !== undefined && value > 0 ? String(value) : '';
}

export function KpiTargetForm({
    currentTarget,
    currentMonth,
    businessScope,
    canManageBusinessGoals,
}: KpiTargetFormProps) {
    const searchParams = useSearchParams();
    const saved = searchParams.get('saved') === '1';
    const hasError = searchParams.get('error') !== null;

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">
                    月次KPIの設定
                </CardTitle>
                <CardDescription>
                    会社目標 / 個人KPI
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <BusinessGoalSettingsSection
                    businessScope={businessScope}
                    currentMonth={currentMonth}
                    canManage={canManageBusinessGoals}
                />

                {saved ? (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        個人KPIを保存しました。
                    </div>
                ) : null}
                {hasError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        個人KPIの保存に失敗しました。時間を置いて再度お試しください。
                    </div>
                ) : null}

                <div>
                    <h3 className="text-base font-semibold text-gray-900">
                        個人KPI
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                        個人KPI入力
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                        入力の考え方
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                        会社目標との整合を見ながら、面会・商談・契約・売上を先に決めると全体の流れをそろえやすくなります。
                    </p>
                </div>

                <form action={saveKpiTargetAction} className="space-y-6">
                    <div className="space-y-1.5">
                        <label
                            className="block text-sm font-medium text-gray-700"
                            htmlFor="targetMonth"
                        >
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

                    {KPI_FIELD_GROUPS.map((group) => (
                        <section key={group.title} className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {group.title}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {group.description}
                                </p>
                            </div>

                            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                                {group.fields.map((field) => (
                                    <div
                                        key={field.name}
                                        className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-start"
                                    >
                                        <div>
                                            <label
                                                className="block text-sm font-semibold text-gray-900"
                                                htmlFor={field.name}
                                            >
                                                {field.label}
                                            </label>
                                            <p className="mt-1 text-sm leading-6 text-gray-500">
                                                {field.helper}
                                            </p>
                                        </div>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="number"
                                            min="0"
                                            step={field.isRevenue ? '1000' : '1'}
                                            placeholder={field.placeholder}
                                            defaultValue={getDefaultValue(
                                                currentTarget,
                                                field.name,
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    <div className="pt-2 md:pt-0">
                        <Button type="submit" className="w-full md:w-auto">
                            個人KPIを保存
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
