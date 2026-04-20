import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { MeetingActivityType, MeetingCounterpartyType, MeetingItem } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MeetingListProps {
    meetings: MeetingItem[];
    total: number;
    dateFrom?: string;
    dateTo?: string;
    ownerUserId?: string;
    activityType?: string;
    counterpartyType?: string;
    created?: boolean;
    deleted?: boolean;
}

const ACTIVITY_TYPE_LABELS: Record<MeetingActivityType, string> = {
    VISIT: '訪問',
    ONLINE: 'オンライン',
    CALL: '電話',
    OTHER: 'その他',
};

const ACTIVITY_TYPE_COLORS: Record<MeetingActivityType, string> = {
    VISIT: 'bg-green-100 text-green-700',
    ONLINE: 'bg-blue-100 text-blue-700',
    CALL: 'bg-yellow-100 text-yellow-700',
    OTHER: 'bg-gray-100 text-gray-600',
};

const COUNTERPARTY_TYPE_LABELS: Record<MeetingCounterpartyType, string> = {
    COMPANY: '案件会社',
    ALLIANCE: 'アライアンス',
    NONE: 'なし',
};

function getCounterpartyName(meeting: MeetingItem): string {
    if (meeting.counterpartyType === 'COMPANY') return meeting.companyName ?? '-';
    if (meeting.counterpartyType === 'ALLIANCE') return meeting.allianceName ?? '-';
    return meeting.contactName ?? '-';
}

export function MeetingList({
    meetings,
    total,
    dateFrom,
    dateTo,
    ownerUserId,
    activityType,
    counterpartyType,
    created = false,
    deleted = false,
}: MeetingListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">面談一覧</h1>
                    <p className="text-sm text-gray-500">{total}件</p>
                </div>
                <Button asChild size="icon" className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700" title="新規面談登録">
                    <Link href="/sales/meetings/new"><Plus className="h-5 w-5" /></Link>
                </Button>
            </div>

            {created && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    面談を登録しました。
                </div>
            )}
            {deleted && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    面談を削除しました。
                </div>
            )}

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form action="/sales/meetings" className="flex flex-wrap gap-3">
                        <input
                            type="date"
                            name="dateFrom"
                            defaultValue={dateFrom ?? ''}
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <input
                            type="date"
                            name="dateTo"
                            defaultValue={dateTo ?? ''}
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <select
                            name="activityType"
                            defaultValue={activityType ?? ''}
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">すべての種別</option>
                            {(Object.entries(ACTIVITY_TYPE_LABELS) as [MeetingActivityType, string][]).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            name="counterpartyType"
                            defaultValue={counterpartyType ?? ''}
                            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">すべての相手タイプ</option>
                            {(Object.entries(COUNTERPARTY_TYPE_LABELS) as [MeetingCounterpartyType, string][]).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="h-10 rounded-md bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            絞り込み
                        </button>
                        <Link href="/sales/meetings" className="flex h-10 items-center rounded-md border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50">
                            リセット
                        </Link>
                    </form>
                </CardContent>
            </Card>

            {meetings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
                    面談が見つかりません
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* モバイル: カード表示 */}
                    <div className="divide-y divide-gray-100 md:hidden">
                        {meetings.map((meeting) => (
                            <div key={meeting.id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/sales/meetings/${meeting.id}`}
                                            className="block truncate font-medium text-gray-900 hover:underline"
                                        >
                                            {new Date(meeting.meetingDate).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'short', timeStyle: 'short' })}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-gray-500">{getCounterpartyName(meeting)}</p>
                                    </div>
                                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTIVITY_TYPE_COLORS[meeting.activityType]}`}>
                                        {ACTIVITY_TYPE_LABELS[meeting.activityType]}
                                    </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                    <span>{COUNTERPARTY_TYPE_LABELS[meeting.counterpartyType]}</span>
                                    <span>{meeting.ownerName ?? '-'}</span>
                                    {meeting.nextActionDate && <span>次: {meeting.nextActionDate}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* デスクトップ: テーブル表示 */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">日時</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">相手</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">種別</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">目的</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">担当者</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">次アクション</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">変換</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {meetings.map((meeting) => (
                                    <tr key={meeting.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/sales/meetings/${meeting.id}`}
                                                className="font-medium text-gray-900 hover:underline"
                                            >
                                                {new Date(meeting.meetingDate).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'short', timeStyle: 'short' })}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-900">{getCounterpartyName(meeting)}</p>
                                            <p className="text-xs text-gray-500">{COUNTERPARTY_TYPE_LABELS[meeting.counterpartyType]}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTIVITY_TYPE_COLORS[meeting.activityType]}`}>
                                                {ACTIVITY_TYPE_LABELS[meeting.activityType]}
                                            </span>
                                        </td>
                                        <td className="max-w-xs px-4 py-3 text-gray-600">
                                            <p className="truncate">{meeting.purpose ?? '-'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{meeting.ownerName ?? '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {meeting.nextActionDate ? (
                                                <div>
                                                    <p className="text-xs">{meeting.nextActionDate}</p>
                                                    {meeting.nextActionContent && (
                                                        <p className="truncate text-xs text-gray-500">{meeting.nextActionContent}</p>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {meeting.convertedDealId || meeting.convertedAllianceId ? (
                                                <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                    変換済
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
