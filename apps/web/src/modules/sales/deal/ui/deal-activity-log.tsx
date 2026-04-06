import type { DealActivityItem, DealActivityType } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { createDealActivityAction } from '@/modules/sales/deal/server-actions';

export const ACTIVITY_LABELS: Record<DealActivityType, string> = {
    VISIT: '訪問', ONLINE: 'オンライン', CALL: '電話', EMAIL: 'メール', OTHER: 'その他',
};
export const ACTIVITY_COLORS: Record<DealActivityType, string> = {
    VISIT: 'bg-gray-200 text-gray-700', ONLINE: 'bg-gray-300 text-gray-700',
    CALL: 'bg-gray-900 text-white', EMAIL: 'bg-gray-200 text-gray-600', OTHER: 'bg-gray-100 text-gray-600',
};
const ACTIVITY_TYPES: DealActivityType[] = ['VISIT', 'ONLINE', 'CALL', 'EMAIL', 'OTHER'];

interface DealActivityLogProps {
    dealId: string;
    activities: DealActivityItem[];
    activityAdded?: boolean;
    hideForm?: boolean;
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
                    <form action={createDealActivityAction} className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 md:grid-cols-4">
                        <input type="hidden" name="dealId" value={dealId} />
                        <label className="grid gap-1 text-xs text-gray-600">
                            種別
                            <select name="activityType" required className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>)}
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs text-gray-600">
                            日付
                            <Input name="activityDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="h-9 text-sm" />
                        </label>
                        <label className="grid gap-1 text-xs text-gray-600">
                            面会数
                            <Input name="meetingCount" type="number" min="1" defaultValue="1" className="h-9 text-sm" />
                        </label>
                        <label className="grid gap-1 text-xs text-gray-600 md:col-span-4">
                            内容
                            <textarea
                                name="summary"
                                rows={2}
                                placeholder="活動の概要を記入..."
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                            />
                        </label>
                        <div className="flex items-end md:col-span-4">
                            <SubmitButton size="sm" pendingText="記録中..." className="bg-blue-600 px-5 text-white hover:bg-blue-700">記録</SubmitButton>
                        </div>
                    </form>
                )}

                {/* 一覧 */}
                {activities.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">活動記録がありません</p>
                ) : (
                    <div className="space-y-2">
                        {activities.map((a) => (
                            <div key={a.id} className="flex items-start gap-3 rounded-md border border-gray-100 px-3 py-2.5">
                                <span className={`mt-0.5 shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_COLORS[a.activityType]}`}>
                                    {ACTIVITY_LABELS[a.activityType]}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{a.activityDate}</span>
                                        <span>{a.userName}</span>
                                        {a.meetingCount > 1 && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">面会 {a.meetingCount}件</span>}
                                    </div>
                                    {a.summary && <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">{a.summary}</p>}
                                </div>
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
                <form action={createDealActivityAction} className="space-y-3">
                    <input type="hidden" name="dealId" value={dealId} />
                    <label className="grid gap-1 text-xs font-medium text-gray-600">
                        種別
                        <select name="activityType" required className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>)}
                        </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-gray-600">
                        日付
                        <Input name="activityDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="h-8 text-sm" />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-gray-600">
                        面会数
                        <Input name="meetingCount" type="number" min="1" defaultValue="1" className="h-8 text-sm" />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-gray-600">
                        内容
                        <textarea
                            name="summary"
                            rows={3}
                            placeholder="活動の概要..."
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                        />
                    </label>
                    <SubmitButton size="sm" pendingText="記録中..." className="w-full bg-blue-600 text-white hover:bg-blue-700">
                        記録する
                    </SubmitButton>
                </form>

                {/* 直近の活動（最新5件） */}
                {recentActivities.length > 0 && (
                    <div className="space-y-1.5 border-t border-gray-100 pt-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">直近の活動</p>
                        {recentActivities.slice(0, 5).map((a) => (
                            <div key={a.id} className="flex items-start gap-2">
                                <span className={`mt-0.5 shrink-0 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ACTIVITY_COLORS[a.activityType]}`}>
                                    {ACTIVITY_LABELS[a.activityType]}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400">{a.activityDate}</p>
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
