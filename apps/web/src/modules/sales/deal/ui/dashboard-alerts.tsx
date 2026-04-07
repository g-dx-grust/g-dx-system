import Link from 'next/link';
import type { DashboardAlert, DashboardAlertType } from '@g-dx/contracts';
import { AlertTriangle, BellRing, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ALERT_META: Record<DashboardAlertType, { title: string; tone: string }> = {
    NO_NEXT_ACTION: {
        title: '次回アクション未設定',
        tone: 'border-red-200 bg-red-50/80',
    },
    OVERDUE_ACTION: {
        title: '次回アクション期限超過',
        tone: 'border-red-200 bg-red-50/80',
    },
    NO_OWNER: {
        title: '担当者未設定',
        tone: 'border-amber-200 bg-amber-50/80',
    },
    STALE_DEAL: {
        title: '14日以上活動なし',
        tone: 'border-amber-200 bg-amber-50/80',
    },
    SLA_EXCEEDED: {
        title: 'SLA超過',
        tone: 'border-amber-200 bg-amber-50/80',
    },
};

const ALERT_TYPE_ORDER: DashboardAlertType[] = [
    'NO_NEXT_ACTION',
    'OVERDUE_ACTION',
    'NO_OWNER',
    'STALE_DEAL',
    'SLA_EXCEEDED',
];

function groupAlerts(alerts: DashboardAlert[]): Map<DashboardAlertType, DashboardAlert[]> {
    const groups = new Map<DashboardAlertType, DashboardAlert[]>();
    for (const type of ALERT_TYPE_ORDER) {
        groups.set(type, []);
    }
    for (const alert of alerts) {
        groups.get(alert.type)?.push(alert);
    }
    return groups;
}

export function DashboardAlerts({ alerts }: { alerts: DashboardAlert[] }) {
    if (alerts.length === 0) {
        return (
            <Card className="border-emerald-200 bg-emerald-50/80 shadow-sm">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-base text-emerald-900">
                            対応が必要な案件はありません
                        </CardTitle>
                        <CardDescription className="text-emerald-800">
                            次回アクション漏れや停滞案件は現在検知されていません。
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    const groupedAlerts = groupAlerts(alerts);
    const highCount = alerts.filter((alert) => alert.severity === 'HIGH').length;

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-base text-gray-900">
                        漏れ検知アラート
                    </CardTitle>
                    <CardDescription>
                        次回アクション漏れや停滞案件を自動で抽出しています。
                    </CardDescription>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    <BellRing className="h-4 w-4" />
                    {alerts.length}件
                    {highCount > 0 ? ` / HIGH ${highCount}件` : ''}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {ALERT_TYPE_ORDER.map((type) => {
                    const items = groupedAlerts.get(type) ?? [];
                    if (items.length === 0) return null;

                    const meta = ALERT_META[type];

                    return (
                        <section
                            key={type}
                            className={`rounded-xl border px-4 py-4 ${meta.tone}`}
                        >
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-gray-700" />
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {meta.title}
                                    </h3>
                                </div>
                                <span className="text-xs font-medium text-gray-600">
                                    {items.length}件
                                </span>
                            </div>

                            <div className="space-y-2">
                                {items.map((alert) => (
                                    <div
                                        key={`${alert.type}-${alert.dealId}-${alert.detail}`}
                                        className="rounded-lg border border-white/80 bg-white/80 px-3 py-3"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 space-y-1">
                                                <Link
                                                    href={`/sales/deals/${alert.dealId}`}
                                                    className="block truncate text-sm font-semibold text-gray-900 hover:underline"
                                                >
                                                    {alert.companyName}
                                                </Link>
                                                <p className="truncate text-xs text-gray-500">
                                                    {alert.dealName}
                                                    {alert.ownerName
                                                        ? ` / 担当: ${alert.ownerName}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    alert.severity === 'HIGH'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {alert.detail}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </CardContent>
        </Card>
    );
}
