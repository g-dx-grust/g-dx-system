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
        title: '活動の目標',
        description:
            '活動ダッシュボードと個人ダッシュボードでは、週あたりの目安にも自動換算されます。',
        fields: [
            {
                name: 'callTarget',
                label: 'コール目標',
                placeholder: '例: 100',
                helper: '見込み顧客への接触数の目安です。',
            },
            {
                name: 'visitTarget',
                label: '訪問目標',
                placeholder: '例: 20',
                helper: '対面訪問の件数を入力します。',
            },
            {
                name: 'appointmentTarget',
                label: 'アポイント目標',
                placeholder: '例: 15',
                helper: '案件化の入口となる目標件数です。',
            },
            {
                name: 'negotiationTarget',
                label: '商談化目標',
                placeholder: '例: 10',
                helper: '提案や見積もりに進める件数の目安です。',
            },
        ],
    },
    {
        title: '成果の目標',
        description: '契約件数と売上は、今月の着地確認に使います。',
        fields: [
            {
                name: 'contractTarget',
                label: '契約目標',
                placeholder: '例: 5',
                helper: '今月の契約到達件数です。',
            },
            {
                name: 'revenueTarget',
                label: '売上目標',
                placeholder: '例: 5000000',
                helper: '円単位で入力します。',
                isRevenue: true,
            },
        ],
    },
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
    const value = map[field];
    return value !== undefined && value > 0 ? String(value) : '';
}

export function KpiTargetForm({ currentTarget, currentMonth }: KpiTargetFormProps) {
    const searchParams = useSearchParams();
    const saved = searchParams.get('saved') === '1';
    const hasError = searchParams.get('error') !== null;

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">月次KPI目標入力</CardTitle>
                <CardDescription>
                    保存した目標値は、個人ダッシュボードで週あたり目安としても表示されます。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {saved ? (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        目標を保存しました。
                    </div>
                ) : null}
                {hasError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        入力内容にエラーがあります。再度確認してください。
                    </div>
                ) : null}

                <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">入力の見方</p>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                        月次目標を登録すると、個人ダッシュボードでは今週の実績と並べて見られるようになります。
                    </p>
                </div>

                <form action={saveKpiTargetAction} className="space-y-6">
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

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {group.fields.map((field) => (
                                    <div
                                        key={field.name}
                                        className="rounded-lg border border-gray-200 bg-white px-4 py-4"
                                    >
                                        <label
                                            className="block text-sm font-medium text-gray-700"
                                            htmlFor={field.name}
                                        >
                                            {field.label}
                                        </label>
                                        <p className="mt-1 text-xs leading-5 text-gray-500">
                                            {field.helper}
                                        </p>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="number"
                                            min="0"
                                            step={field.isRevenue ? '1000' : '1'}
                                            placeholder={field.placeholder}
                                            defaultValue={getDefaultValue(currentTarget, field.name)}
                                            className="mt-3"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    <div className="pt-2 md:pt-0">
                        <Button type="submit" className="w-full md:w-auto">
                            目標を保存
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
