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
}: ActivityPersonalViewProps) {
    return (
        <div className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="text-base text-gray-900">個人ビュー統合</CardTitle>
                        <CardDescription>
                            活動ダッシュボード上で、メンバーごとの個人KPIと行動状況を確認できます。
                        </CardDescription>
                    </div>
                    <MemberPersonalViewSelector options={memberOptions} value={selectedMemberId} />
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-sm text-gray-500">
                        表示中: <span className="font-medium text-gray-900">{selectedMemberName}</span>
                    </p>
                </CardContent>
            </Card>

            {dashboardData ? (
                <>
                    <PersonalKpiProgress data={dashboardData} />
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
