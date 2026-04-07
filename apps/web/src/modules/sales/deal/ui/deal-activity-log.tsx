import type {
    DealActivityItem,
    MeetingTargetType,
    NegotiationOutcome,
    VisitCategory,
} from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityForm } from './deal-activity-form';
import {
    ACTIVITY_COLORS,
    ACTIVITY_LABELS,
    NEGOTIATION_OUTCOME_BADGE_COLORS,
    NEGOTIATION_OUTCOME_LABELS,
    TARGET_TYPE_LABELS,
    VISIT_CATEGORY_BADGE_COLORS,
    VISIT_CATEGORY_LABELS,
} from './deal-activity-shared';

interface DealActivityLogProps {
    dealId: string;
    activities: DealActivityItem[];
    activityAdded?: boolean;
    hideForm?: boolean;
}

function MeetingCategoryMeta({
    visitCategory,
    targetType,
    compact = false,
}: {
    visitCategory: VisitCategory | null;
    targetType: MeetingTargetType | null;
    compact?: boolean;
}) {
    if (!visitCategory && !targetType) return null;

    return (
        <>
            {visitCategory ? (
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 font-medium ${compact ? 'text-[10px]' : 'text-xs'} ${VISIT_CATEGORY_BADGE_COLORS[visitCategory]}`}
                >
                    {VISIT_CATEGORY_LABELS[visitCategory]}
                </span>
            ) : null}
            {targetType ? (
                <span className={compact ? 'text-[10px] text-gray-500' : 'text-[11px] text-gray-500'}>
                    {TARGET_TYPE_LABELS[targetType]}
                </span>
            ) : null}
        </>
    );
}

function NegotiationMeta({
    isNegotiation,
    negotiationOutcome,
    compact = false,
}: {
    isNegotiation: boolean;
    negotiationOutcome: NegotiationOutcome | null;
    compact?: boolean;
}) {
    if (!isNegotiation) return null;

    return (
        <>
            <span
                className={`inline-flex rounded-full px-2 py-0.5 font-medium ${compact ? 'text-[10px]' : 'text-xs'} bg-violet-100 text-violet-700`}
            >
                商談
            </span>
            {negotiationOutcome ? (
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 font-medium ${compact ? 'text-[10px]' : 'text-xs'} ${NEGOTIATION_OUTCOME_BADGE_COLORS[negotiationOutcome]}`}
                >
                    {NEGOTIATION_OUTCOME_LABELS[negotiationOutcome]}
                </span>
            ) : null}
        </>
    );
}

export function DealActivityLog({ dealId, activities, activityAdded = false, hideForm = false }: DealActivityLogProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-base text-gray-900">活動ログ</CardTitle>
                <CardDescription>訪問・オンライン・電話などの活動記録</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activityAdded && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">活動を記録しました。</div>
                )}

                {/* インライン追加フォーム（サイドバー使用時は非表示） */}
                {!hideForm && (
                    <ActivityForm dealId={dealId} />
                )}

                {/* 一覧 */}
                {activities.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">活動記録がありません</p>
                ) : (
                    <div className="space-y-2">
                        {activities.map((a) => (
                            <div key={a.id} className="rounded-md border border-gray-100 px-3 py-2.5">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_COLORS[a.activityType]}`}>
                                        {ACTIVITY_LABELS[a.activityType]}
                                    </span>
                                    <MeetingCategoryMeta
                                        visitCategory={a.visitCategory}
                                        targetType={a.targetType}
                                    />
                                    <NegotiationMeta
                                        isNegotiation={a.isNegotiation}
                                        negotiationOutcome={a.negotiationOutcome}
                                    />
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        <span>{a.activityDate}</span>
                                        <span>{a.userName}</span>
                                        {a.meetingCount > 1 && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">面会 {a.meetingCount}件</span>}
                                    </div>
                                </div>
                                {a.summary && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{a.summary}</p>}
                                {a.competitorInfo ? (
                                    <p className="mt-1 text-xs text-gray-500">競合情報: {a.competitorInfo}</p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── サイドバー用コンパクトフォーム ──────────────────────────────────────────

interface DealActivitySidebarFormProps {
    dealId: string;
    recentActivities: DealActivityItem[];
    activityAdded?: boolean;
}

export function DealActivitySidebarForm({ dealId, recentActivities, activityAdded = false }: DealActivitySidebarFormProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">活動を記録</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activityAdded && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        記録しました。
                    </div>
                )}
                <ActivityForm dealId={dealId} compact />

                {/* 直近の活動（最新5件） */}
                {recentActivities.length > 0 && (
                    <div className="space-y-1.5 border-t border-gray-100 pt-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">直近の活動</p>
                        {recentActivities.slice(0, 5).map((a) => (
                            <div key={a.id} className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ACTIVITY_COLORS[a.activityType]}`}>
                                        {ACTIVITY_LABELS[a.activityType]}
                                    </span>
                                    <MeetingCategoryMeta
                                        visitCategory={a.visitCategory}
                                        targetType={a.targetType}
                                        compact
                                    />
                                    <NegotiationMeta
                                        isNegotiation={a.isNegotiation}
                                        negotiationOutcome={a.negotiationOutcome}
                                        compact
                                    />
                                    <p className="text-[10px] text-gray-400">{a.activityDate}</p>
                                </div>
                                <div className="min-w-0">
                                    {a.summary && (
                                        <p className="line-clamp-1 text-xs text-gray-600">{a.summary}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
