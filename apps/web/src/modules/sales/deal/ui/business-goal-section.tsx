'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import type {
    BusinessGoalItem,
    BusinessGoalListResponse,
    BusinessScopeType,
} from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDashboardAmount } from './dashboard-primitives';

type BusinessGoalFieldKey =
    | 'revenueTarget'
    | 'grossProfitTarget'
    | 'contractCountTarget';

interface BusinessGoalField {
    key: BusinessGoalFieldKey;
    title: string;
    description: string;
    placeholder: string;
    step: string;
    isAmount?: boolean;
}

interface BusinessGoalSettingsSectionProps {
    businessScope: BusinessScopeType;
    currentMonth: string;
    canManage: boolean;
}

interface BusinessGoalOverviewCardProps {
    businessScope: BusinessScopeType;
    currentMonth: string;
}

interface BusinessGoalLoadState {
    goal: BusinessGoalItem | null;
    isLoading: boolean;
    loadError: string | null;
}

interface FeedbackState {
    kind: 'success' | 'error';
    message: string;
}

type BusinessGoalFormValues = Record<BusinessGoalFieldKey, string>;

const BUSINESS_GOAL_FIELDS: BusinessGoalField[] = [
    {
        key: 'revenueTarget',
        title: '売上目標',
        description: '売上目標',
        placeholder: '例 5000000',
        step: '1000',
        isAmount: true,
    },
    {
        key: 'grossProfitTarget',
        title: '粗利目標',
        description: '粗利目標',
        placeholder: '例 1800000',
        step: '1000',
        isAmount: true,
    },
    {
        key: 'contractCountTarget',
        title: '契約件数目標',
        description: '契約目標件数',
        placeholder: '例 8',
        step: '1',
    },
];

const EMPTY_FORM_VALUES: BusinessGoalFormValues = {
    revenueTarget: '',
    grossProfitTarget: '',
    contractCountTarget: '',
};

function formatMonthLabel(value: string): string {
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return value;
    return `${year}年${month}月`;
}

function toFormValues(goal: BusinessGoalItem | null): BusinessGoalFormValues {
    if (!goal) return EMPTY_FORM_VALUES;
    return {
        revenueTarget:
            goal.revenueTarget !== null ? String(goal.revenueTarget) : '',
        grossProfitTarget:
            goal.grossProfitTarget !== null ? String(goal.grossProfitTarget) : '',
        contractCountTarget:
            goal.contractCountTarget !== null ? String(goal.contractCountTarget) : '',
    };
}

function parseNullableNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatGoalValue(
    field: BusinessGoalField,
    value: number | null,
): string {
    if (value === null) return '未設定';
    if (field.isAmount) return formatDashboardAmount(value);
    return `${value.toLocaleString()}件`;
}

async function fetchMonthlyBusinessGoal(
    businessScope: BusinessScopeType,
    targetMonth: string,
): Promise<{ goal: BusinessGoalItem | null; loadError: string | null }> {
    try {
        const response = await fetch(
            `/api/v1/dashboard/goals?businessScope=${encodeURIComponent(
                businessScope,
            )}&periodType=MONTHLY`,
            { cache: 'no-store' },
        );

        if (!response.ok) {
            return {
                goal: null,
                loadError:
                    '会社目標を読み込めませんでした。個人KPIの入力はそのまま続けられます。',
            };
        }

        const json = (await response.json()) as BusinessGoalListResponse;
        const goal =
            json.data?.find((item) => item.periodKey === targetMonth) ?? null;

        return { goal, loadError: null };
    } catch {
        return {
            goal: null,
            loadError:
                '会社目標を読み込めませんでした。個人KPIの入力はそのまま続けられます。',
        };
    }
}

function BusinessGoalRows({
    goal,
}: {
    goal: BusinessGoalItem | null;
}) {
    return (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {BUSINESS_GOAL_FIELDS.map((field) => {
                const value = goal?.[field.key] ?? null;
                return (
                    <div
                        key={field.key}
                        className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-start"
                    >
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {field.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-gray-500">
                                {field.description}
                            </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 md:pt-0.5 md:text-right">
                            {formatGoalValue(field, value)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

export function BusinessGoalSettingsSection({
    businessScope,
    currentMonth,
    canManage,
}: BusinessGoalSettingsSectionProps) {
    const [targetMonth, setTargetMonth] = useState(currentMonth);
    const [formValues, setFormValues] =
        useState<BusinessGoalFormValues>(EMPTY_FORM_VALUES);
    const [loadState, setLoadState] = useState<BusinessGoalLoadState>({
        goal: null,
        isLoading: canManage,
        loadError: null,
    });
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [isSaving, startSaving] = useTransition();

    useEffect(() => {
        if (!canManage) return;

        let cancelled = false;
        setLoadState((current) => ({
            ...current,
            isLoading: true,
            loadError: null,
        }));
        setFeedback(null);

        void fetchMonthlyBusinessGoal(businessScope, targetMonth).then(
            ({ goal, loadError }) => {
                if (cancelled) return;
                setLoadState({
                    goal,
                    isLoading: false,
                    loadError,
                });
                setFormValues(toFormValues(goal));
            },
        );

        return () => {
            cancelled = true;
        };
    }, [businessScope, canManage, targetMonth]);

    if (!canManage) {
        return (
            <section className="space-y-4 border-b border-gray-200 pb-6">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">
                        会社目標
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                        会社全体の月次目標は管理者以上が確認・更新できます。個人KPIはこの下から引き続き入力できます。
                    </p>
                </div>
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-500">
                    会社目標の閲覧・編集は管理者以上に限定しています。
                </div>
            </section>
        );
    }

    async function reloadGoal(month: string) {
        const { goal, loadError } = await fetchMonthlyBusinessGoal(
            businessScope,
            month,
        );
        setLoadState({
            goal,
            isLoading: false,
            loadError,
        });
        setFormValues(toFormValues(goal));
    }

    function updateField(key: BusinessGoalFieldKey, value: string) {
        setFormValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function handleSave() {
        setFeedback(null);

        startSaving(async () => {
            try {
                const response = await fetch('/api/v1/dashboard/goals', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        businessScope,
                        periodType: 'MONTHLY',
                        periodKey: targetMonth,
                        revenueTarget: parseNullableNumber(
                            formValues.revenueTarget,
                        ),
                        grossProfitTarget: parseNullableNumber(
                            formValues.grossProfitTarget,
                        ),
                        contractCountTarget: parseNullableNumber(
                            formValues.contractCountTarget,
                        ),
                    }),
                });

                if (!response.ok) {
                    setFeedback({
                        kind: 'error',
                        message:
                            response.status === 403
                                ? '会社目標の更新は管理者以上のみ可能です。'
                                : '会社目標を保存できませんでした。時間を置いて再度お試しください。',
                    });
                    return;
                }

                await reloadGoal(targetMonth);
                setFeedback({
                    kind: 'success',
                    message: `${formatMonthLabel(
                        targetMonth,
                    )}の会社目標を保存しました。`,
                });
            } catch {
                setFeedback({
                    kind: 'error',
                    message:
                        '会社目標を保存できませんでした。時間を置いて再度お試しください。',
                });
            }
        });
    }

    return (
        <section className="space-y-5 border-b border-gray-200 pb-6">
            <div>
                <h3 className="text-base font-semibold text-gray-900">
                    会社目標
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                    月次の会社目標を先に整理しておくと、個人KPIとの関係を同じ画面で確認しやすくなります。
                </p>
            </div>

            <div className="space-y-1.5">
                <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="businessGoalTargetMonth"
                >
                    対象月
                </label>
                <Input
                    id="businessGoalTargetMonth"
                    type="month"
                    value={targetMonth}
                    onChange={(event) => setTargetMonth(event.target.value)}
                    className="max-w-xs"
                />
                <p className="text-xs text-gray-500">
                    会社目標
                </p>
            </div>

            {feedback ? (
                <div
                    className={`rounded-md px-4 py-3 text-sm ${
                        feedback.kind === 'success'
                            ? 'border border-green-200 bg-green-50 text-green-800'
                            : 'border border-red-200 bg-red-50 text-red-800'
                    }`}
                >
                    {feedback.message}
                </div>
            ) : null}

            {loadState.loadError ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {loadState.loadError}
                </div>
            ) : null}

            {!loadState.loadError ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                        {formatMonthLabel(targetMonth)}の会社目標
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                        {loadState.goal
                            ? '既存の設定値を読み込んでいます。必要な項目だけ更新してください。'
                            : 'まだ未設定です。必要な項目から順に登録してください。'}
                    </p>
                </div>
            ) : null}

            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {BUSINESS_GOAL_FIELDS.map((field) => (
                    <div
                        key={field.key}
                        className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-start"
                    >
                        <div>
                            <label
                                className="block text-sm font-semibold text-gray-900"
                                htmlFor={field.key}
                            >
                                {field.title}
                            </label>
                            <p className="mt-1 text-sm leading-6 text-gray-500">
                                {field.description}
                            </p>
                        </div>
                        <Input
                            id={field.key}
                            type="number"
                            min="0"
                            step={field.step}
                            placeholder={field.placeholder}
                            value={formValues[field.key]}
                            onChange={(event) =>
                                updateField(field.key, event.target.value)
                            }
                        />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs leading-5 text-gray-500">
                    DBやAPIが未準備の環境でも、会社目標が取得できない場合は個人KPIの入力を継続できます。
                </p>
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full md:w-auto"
                >
                    {isSaving ? '保存しています...' : '会社目標を保存'}
                </Button>
            </div>
        </section>
    );
}

export function BusinessGoalOverviewCard({
    businessScope,
    currentMonth,
}: BusinessGoalOverviewCardProps) {
    const [loadState, setLoadState] = useState<BusinessGoalLoadState>({
        goal: null,
        isLoading: true,
        loadError: null,
    });

    useEffect(() => {
        let cancelled = false;

        setLoadState({
            goal: null,
            isLoading: true,
            loadError: null,
        });

        void fetchMonthlyBusinessGoal(businessScope, currentMonth).then(
            ({ goal, loadError }) => {
                if (cancelled) return;
                setLoadState({
                    goal,
                    isLoading: false,
                    loadError,
                });
            },
        );

        return () => {
            cancelled = true;
        };
    }, [businessScope, currentMonth]);

    return (
        <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-base text-gray-900">
                    会社目標
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-gray-500">
                    {formatMonthLabel(currentMonth)}
                    の会社全体の目線を、営業ダッシュボード上でも静かに確認できるようにしています。
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loadState.isLoading ? (
                    <p className="text-sm text-gray-500">
                        会社目標を確認しています。
                    </p>
                ) : loadState.loadError ? (
                    <p className="text-sm leading-6 text-gray-500">
                        会社目標を表示できませんでした。設定画面で登録後にご確認ください。
                    </p>
                ) : loadState.goal ? (
                    <BusinessGoalRows goal={loadState.goal} />
                ) : (
                    <p className="text-sm leading-6 text-gray-500">
                        未設定です。{' '}
                        <Link
                            href="/dashboard/settings/kpi"
                            className="text-gray-700 underline-offset-2 hover:underline"
                        >
                            設定画面で登録してください。
                        </Link>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
