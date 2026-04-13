import type { PersonalDashboardData, PersonalNextActionItem } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonalKpiProgress } from './personal-kpi-progress';
import { PersonalCompanyActionHighlights } from './personal-company-action-highlights';
import { PersonalActionList } from './personal-action-list';

export interface MemberActivityData {
    userId: string;
    userName: string;
    dashboardData: PersonalDashboardData | null;
    actionItems: PersonalNextActionItem[];
}

interface MemberSectionProps {
    member: MemberActivityData;
    suppressTargetAlert: boolean;
}

function MemberSection({ member, suppressTargetAlert }: MemberSectionProps) {
    return (
        <section className="space-y-4">
            {/* メンバーヘッダー */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <h3 className="shrink-0 text-sm font-semibold text-gray-700">{member.userName}</h3>
                <div className="h-px flex-1 bg-gray-200" />
            </div>

            {member.dashboardData ? (
                <>
                    <PersonalKpiProgress
                        data={member.dashboardData}
                        suppressTargetAlert={suppressTargetAlert}
                    />

                    <PersonalCompanyActionHighlights
                        memberName={member.userName}
                        groups={member.dashboardData.lastWeekCompanyActions}
                    />
                </>
            ) : (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-500">
                            KPI権限がないため、このメンバーの個人KPIは表示できません。
                        </p>
                    </CardContent>
                </Card>
            )}

            <PersonalActionList items={member.actionItems} />
        </section>
    );
}

interface AllMembersActivitySectionProps {
    members: MemberActivityData[];
    suppressTargetAlert?: boolean;
}

export function AllMembersActivitySection({
    members,
    suppressTargetAlert = false,
}: AllMembersActivitySectionProps) {
    if (members.length === 0) return null;

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900">メンバー別の活動状況</CardTitle>
                <CardDescription>個人KPI進捗 / 先週の活動会社 / アクションリスト</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {members.map((member) => (
                    <MemberSection
                        key={member.userId}
                        member={member}
                        suppressTargetAlert={suppressTargetAlert}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
