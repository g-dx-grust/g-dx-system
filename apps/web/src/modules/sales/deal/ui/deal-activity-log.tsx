import type { DealActivityItem, DealActivityType } from '@g-dx/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createDealActivityAction } from '@/modules/sales/deal/server-actions';

const ACTIVITY_LABELS: Record<DealActivityType, string> = {
    VISIT: '訪問', ONLINE: 'オンライン', CALL: '電話', EMAIL: 'メール', OTHER: 'その他',
};
const ACTIVITY_COLORS: Record<DealActivityType, string> = {
    VISIT: 'bg-gray-200 text-gray-700', ONLINE: 'bg-gray-300 text-gray-700',
    CALL: 'bg-gray-900 text-white', EMAIL: 'bg-gray-200 text-gray-600', OTHER: 'bg-gray-100 text-gray-600',
};
const ACTIVITY_TYPES: DealActivityType[] = ['VISIT', 'ONLINE', 'CALL', 'EMAIL', 'OTHER'];

interface DealActivityLogProps { dealId: string; activities: DealActivityItem[]; activityAdded?: boolean }

export function DealActivityLog({ dealId, activities, activityAdded = false }: DealActivityLogProps) {
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

                {/* Add form */}
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
                    <label className="grid gap-1 text-xs text-gray-600 md:col-span-2">
                        内容
                        <Input name="summary" placeholder="活動の概要を記入..." className="h-9 text-sm" />
                    </label>
                    <div className="flex items-end md:col-span-4">
                        <Button type="submit" size="sm" className="bg-blue-600 px-5 text-white hover:bg-blue-700">記録</Button>
                    </div>
                </form>

                {/* Activity list */}
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
                                    </div>
                                    {a.summary && <p className="mt-0.5 text-sm text-gray-700">{a.summary}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
