import type {
    ApprovalRequestListItem,
    PersonalDashboardData,
    PersonalNextActionItem,
} from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonalApprovalOverview } from '@/modules/approvals/ui/personal-approval-overview';
import { PersonalActionList } from './personal-action-list';
import { PersonalCompanyActionHighlights } from './personal-company-action-highlights';
import { PersonalKpiProgress } from './personal-kpi-progress';
import {
    DashboardNarrativeCard,
    formatDashboardAmount,
} from './dashboard-primitives';
import {
    MemberPersonalViewSelector,
    type MemberPersonalViewOption,
} from './member-personal-view-selector';

interface ActivityPersonalViewProps {
    memberOptions: MemberPersonalViewOption[];
    selectedMemberId: string;
    selectedMemberName: string;
    dashboardData: PersonalDashboardData | null;
    actionItems: PersonalNextActionItem[];
    canReadApprovals: boolean;
    pendingApprovals: ApprovalRequestListItem[];
    requestedApprovals: ApprovalRequestListItem[];
    showSelector?: boolean;
    suppressTargetAlert?: boolean;
}

function buildNarrativeLines(
    memberName: string,
    dashboardData: PersonalDashboardData,
    actionItems: PersonalNextActionItem[],
    pendingApprovals: ApprovalRequestListItem[],
    requestedApprovals: ApprovalRequestListItem[],
): string[] {
    const contractItem = dashboardData.kpiItems.find((item) => item.key === 'contractCount');
    const thisWeekMetrics = dashboardData.rollingKpis.find(
        (item) => item.period === 'thisWeek',
    )?.metrics;
    const activityHighlights = [
        { label: '訪問', total: thisWeekMetrics?.visitCount.total ?? 0 },
        { label: 'オンライン商談', total: thisWeekMetrics?.onlineCount.total ?? 0 },
        { label: 'アポイント', total: thisWeekMetrics?.appointmentCount.total ?? 0 },
    ].sort((left, right) => right.total - left.total);
    const topActivity = activityHighlights[0];
    const overdueCount = actionItems.filter((item) => item.urgency === 'OVERDUE').length;
    const todayCount = actionItems.filter((item) => item.urgency === 'TODAY').length;

    return [
        dashboardData.hasTargets
            ? `${memberName} さんの今月売上は ${formatDashboardAmount(dashboardData.revenueActual)}、契約は ${contractItem?.actual ?? 0}件です。`
            : `${memberName} さんの今月売上は ${formatDashboardAmount(dashboardData.revenueActual)} で、目標は未設定です。`,
        topActivity && topActivity.total > 0
            ? `今週は ${topActivity.label} が ${topActivity.total}件で中心です。先週の行動会社と合わせて見返すと流れが追いやすくなります。`
            : '今週の活動記録はまだ少なく、次の予定入力から整える段階です。',
        overdueCount > 0
            ? `期限超過のアクションが ${overdueCount}件あります。今日中の予定は ${todayCount}件です。`
            : todayCount > 0
                ? `今日中のアクションは ${todayCount}件です。期限超過はなく、予定どおりに進めやすい状態です。`
                : '直近2週間のアクションに大きな滞留はありません。',
        pendingApprovals.length > 0
            ? `確認待ちの承認が ${pendingApprovals.length}件あります。対応順の見直しも合わせて進めると安心です。`
            : requestedApprovals.length > 0
                ? `申請中の承認は ${requestedApprovals.length}件です。回答待ちの案件を把握しやすい状態です。`
                : '承認待ちの案件はなく、個人の行動整理に集中できます。',
    ];
}

export function ActivityPersonalView({
    memberOptions,
    selectedMemberId,
    selectedMemberName,
    dashboardData,
    actionItems,
    canReadApprovals,
    pendingApprovals,
    requestedApprovals,
    showSelector = true,
    suppressTargetAlert = false,
}: ActivityPersonalViewProps) {
    return (
        <div className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-base text-gray-900">担当者の状況</CardTitle>
                        <CardDescription>
                            個人KPI / 承認 / 次アクション
                        </CardDescription>
                    </div>
                    {showSelector ? (
                        <MemberPersonalViewSelector
                            options={memberOptions}
                            value={selectedMemberId}
                        />
                    ) : null}
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-sm text-gray-500">
                        表示中: <span className="font-medium text-gray-900">{selectedMemberName}</span>
                    </p>
                </CardContent>
            </Card>

            {dashboardData ? (
                <>
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                        <PersonalKpiProgress data={dashboardData} suppressTargetAlert={suppressTargetAlert} />
                        <DashboardNarrativeCard
                            description="今週の要点"
                            lines={buildNarrativeLines(
                                selectedMemberName,
                                dashboardData,
                                actionItems,
                                pendingApprovals,
                                requestedApprovals,
                            )}
                        />
                    </div>

                    <PersonalCompanyActionHighlights
                        memberName={selectedMemberName}
                        groups={dashboardData.lastWeekCompanyActions}
                    />
                </>
            ) : (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-500">
                            KPI 権限がないため、このメンバーの個人KPIは表示できません。
                        </p>
                    </CardContent>
                </Card>
            )}

            {canReadApprovals ? (
                <PersonalApprovalOverview
                    pendingItems={pendingApprovals}
                    requestedItems={requestedApprovals}
                />
            ) : null}

            <PersonalActionList items={actionItems} />
        </div>
    );
}
