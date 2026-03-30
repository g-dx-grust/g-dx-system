import type { ApprovalRouteItem, ApprovalTypeValue } from '@g-dx/contracts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APPROVAL_TYPE_LABELS } from './approval-ui';

interface ApprovalRouteListViewProps {
    routes: ApprovalRouteItem[];
}

export function ApprovalRouteListView({ routes }: ApprovalRouteListViewProps) {
    const grouped = routes.reduce<Record<ApprovalTypeValue, ApprovalRouteItem[]>>(
        (acc, route) => {
            acc[route.approvalType].push(route);
            return acc;
        },
        {
            PRE_MEETING: [],
            ESTIMATE_PRESENTATION: [],
            TECH_REVIEW: [],
        },
    );

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">承認ルート</h1>
                <p className="text-sm text-gray-500">承認ルート</p>
            </div>

            {routes.length === 0 ? (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="py-12 text-center text-sm text-gray-500">
                        有効な承認ルートはまだ登録されていません。
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 xl:grid-cols-3">
                    {(Object.keys(grouped) as ApprovalTypeValue[]).map((approvalType) => (
                        <Card key={approvalType} className="border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base text-gray-900">{APPROVAL_TYPE_LABELS[approvalType]}</CardTitle>
                                <CardDescription>{grouped[approvalType].length} ステップ</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {grouped[approvalType].length === 0 ? (
                                    <p className="text-sm text-gray-500">ルートは設定されていません。</p>
                                ) : (
                                    <ol className="space-y-3">
                                        {grouped[approvalType].map((route) => (
                                            <li key={route.id} className="rounded-lg border border-gray-200 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            Step {route.routeOrder}: {route.routeName}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{route.approverName}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant={route.isActive ? 'success' : 'outline'}>
                                                            {route.isActive ? '有効' : '停止中'}
                                                        </Badge>
                                                        {route.allowSelfApproval ? (
                                                            <Badge variant="warning">自己承認可</Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
