import type { PersonalDashboardData, PersonalNextActionItem } from '@g-dx/contracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDashboardAmount } from './dashboard-primitives';

export interface MemberActivityData {
    userId: string;
    userName: string;
    dashboardData: PersonalDashboardData | null;
    actionItems: PersonalNextActionItem[];
}

const KPI_DISPLAY_KEYS = ['newVisitCount', 'appointmentCount', 'contractCount'] as const;

function MemberActivityCard({ member }: { member: MemberActivityData }) {
    const overdueCount = member.actionItems.filter((item) => item.urgency === 'OVERDUE').length;
    const todayCount = member.actionItems.filter((item) => item.urgency === 'TODAY').length;
    const upcomingCount = member.actionItems.filter((item) => item.urgency === 'THIS_WEEK').length;
    const totalActions = member.actionItems.length;

    const displayKpis = member.dashboardData
        ? member.dashboardData.kpiItems.filter((item) => KPI_DISPLAY_KEYS.includes(item.key as any))
        : [];

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {/* ヘッダー */}
            <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{member.userName}</p>
                {member.dashboardData ? (
                    <span
                        className={`text-xs font-medium tabular-nums ${
                            member.dashboardData.revenueAchievementPct >= 100
                                ? 'text-green-600'
                                : member.dashboardData.revenueAchievementPct >= 70
                                  ? 'text-gray-700'
                                  : 'text-orange-500'
                        }`}
                    >
                        {member.dashboardData.revenueAchievementPct}%
                    </span>
                ) : null}
            </div>

            {/* 売上進捗 */}
            {member.dashboardData ? (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium text-gray-800">
                            {formatDashboardAmount(member.dashboardData.revenueActual)}
                        </span>
                        <span>目標 {formatDashboardAmount(member.dashboardData.revenueTarget)}</span>
                    </div>
                    <Progress
                        value={Math.min(member.dashboardData.revenueAchievementPct, 100)}
                        max={100}
                    />
                </div>
            ) : (
                <p className="text-xs text-gray-400">KPI未設定</p>
            )}

            {/* KPI 3指標 */}
            {displayKpis.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5">
                    {displayKpis.map((item) => (
                        <div
                            key={item.key}
                            className="rounded-lg bg-gray-50 px-2 py-2 text-center"
                        >
                            <p className="truncate text-[10px] text-gray-500">{item.label}</p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-900 tabular-nums">
                                {item.actual}
                                <span className="text-[10px] font-normal text-gray-400">
                                    /{item.target}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* アクション件数バッジ */}
            <div className="flex flex-wrap gap-1.5">
                {overdueCount > 0 ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        期限超過 {overdueCount}件
                    </span>
                ) : null}
                {todayCount > 0 ? (
                    <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-500">
                        今日 {todayCount}件
                    </span>
                ) : null}
                {totalActions > 0 ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                        今後 {upcomingCount}件
                    </span>
                ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400">
                        アクションなし
                    </span>
                )}
            </div>
        </div>
    );
}

interface AllMembersActivitySectionProps {
    members: MemberActivityData[];
}

export function AllMembersActivitySection({ members }: AllMembersActivitySectionProps) {
    if (members.length === 0) return null;

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900">メンバー別の活動状況</CardTitle>
                <CardDescription>個人KPI進捗 / アクション状況</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {members.map((member) => (
                        <MemberActivityCard key={member.userId} member={member} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
