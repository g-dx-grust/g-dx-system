import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@g-dx/database';
import { users, userBusinessMemberships } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMeeting } from '@/modules/sales/meeting/application/get-meeting';
import { MeetingEditForm } from '@/modules/sales/meeting/ui/meeting-edit-form';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { listAllianceOptions } from '@/modules/sales/alliance/infrastructure/alliance-repository';
import { createCompanyQuickAction } from '@/modules/customer-management/company/server-actions';
import { createAllianceQuickAction } from '@/modules/sales/alliance/server-actions';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { MeetingActivityType, MeetingCounterpartyType } from '@g-dx/contracts';

interface MeetingDetailPageProps {
    params: { meetingId: string };
    searchParams?: { created?: string; updated?: string };
}

const ACTIVITY_TYPE_LABELS: Record<MeetingActivityType, string> = {
    VISIT: '訪問',
    ONLINE: 'オンライン',
    CALL: '電話',
    OTHER: 'その他',
};

const COUNTERPARTY_TYPE_LABELS: Record<MeetingCounterpartyType, string> = {
    COMPANY: '案件会社',
    ALLIANCE: 'アライアンス',
    NONE: 'なし',
};

export default async function MeetingDetailPage({ params, searchParams }: MeetingDetailPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    let meeting;
    let companiesResult;
    let allianceOptions: { id: string; name: string }[] = [];

    try {
        [meeting, companiesResult, allianceOptions] = await Promise.all([
            getMeeting(params.meetingId),
            listCompanies({ pageSize: 200 }),
            listAllianceOptions(session.activeBusinessScope),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/meetings');
        throw error;
    }

    if (!meeting) redirect('/sales/meetings');

    const businessUnit = await findBusinessUnitByScope(session.activeBusinessScope);
    const allUsers = businessUnit
        ? await db
              .select({ id: users.id, name: users.displayName })
              .from(users)
              .innerJoin(userBusinessMemberships, eq(userBusinessMemberships.userId, users.id))
              .where(
                  and(
                      eq(userBusinessMemberships.businessUnitId, businessUnit.id),
                      eq(userBusinessMemberships.membershipStatus, 'active'),
                      eq(users.status, 'active'),
                      isNull(users.deletedAt),
                  )
              )
        : [];

    const companyOptions = companiesResult.data.map((c) => ({ value: c.id, label: c.name }));
    const allianceSelectOptions = allianceOptions.map((a) => ({ value: a.id, label: a.name }));
    const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name ?? '名前未設定' }));

    const counterpartyDisplay =
        meeting.counterpartyType === 'COMPANY'
            ? meeting.companyName ?? '-'
            : meeting.counterpartyType === 'ALLIANCE'
            ? meeting.allianceName ?? '-'
            : '-';

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">面談詳細</h1>
                    <p className="text-sm text-gray-500">
                        {new Date(meeting.meetingDate).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/sales/meetings">一覧へ戻る</Link>
                </Button>
            </div>

            {searchParams?.created === '1' && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    面談を登録しました。
                </div>
            )}

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">面談情報</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-4 md:grid-cols-2">
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">日時</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {new Date(meeting.meetingDate).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'long', timeStyle: 'short' })}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">種別</dt>
                            <dd className="mt-1 text-sm text-gray-900">{ACTIVITY_TYPE_LABELS[meeting.activityType]}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">相手タイプ</dt>
                            <dd className="mt-1 text-sm text-gray-900">{COUNTERPARTY_TYPE_LABELS[meeting.counterpartyType]}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">相手</dt>
                            <dd className="mt-1 text-sm text-gray-900">{counterpartyDisplay}</dd>
                        </div>
                        {meeting.contactName && (
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">相手氏名</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {meeting.contactName}
                                    {meeting.contactRole && <span className="ml-1 text-gray-500">({meeting.contactRole})</span>}
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">担当者</dt>
                            <dd className="mt-1 text-sm text-gray-900">{meeting.ownerName ?? '-'}</dd>
                        </div>
                        {meeting.purpose && (
                            <div className="md:col-span-2">
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">目的</dt>
                                <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{meeting.purpose}</dd>
                            </div>
                        )}
                        {meeting.summary && (
                            <div className="md:col-span-2">
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">要約</dt>
                                <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{meeting.summary}</dd>
                            </div>
                        )}
                        {meeting.nextActionDate && (
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">次アクション日</dt>
                                <dd className="mt-1 text-sm text-gray-900">{meeting.nextActionDate}</dd>
                            </div>
                        )}
                        {meeting.nextActionContent && (
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">次アクション内容</dt>
                                <dd className="mt-1 text-sm text-gray-900">{meeting.nextActionContent}</dd>
                            </div>
                        )}
                    </dl>
                </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">変換</CardTitle>
                </CardHeader>
                <CardContent>
                    {meeting.convertedDealId || meeting.convertedAllianceId ? (
                        <div className="space-y-2">
                            {meeting.convertedDealId && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">商談</span>
                                    <Link
                                        href={`/sales/deals/${meeting.convertedDealId}`}
                                        className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
                                    >
                                        → 変換済み商談を表示
                                    </Link>
                                </div>
                            )}
                            {meeting.convertedAllianceId && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">アライアンス</span>
                                    <Link
                                        href={`/sales/alliances/${meeting.convertedAllianceId}`}
                                        className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
                                    >
                                        → 変換済みアライアンスを表示
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <Button asChild variant="outline">
                                <Link href={`/sales/deals/new?fromMeeting=${meeting.id}`}>
                                    商談に変換
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={`/sales/alliances/new?fromMeeting=${meeting.id}`}>
                                    アライアンスに変換
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <MeetingEditForm
                meeting={meeting}
                companies={companyOptions}
                alliances={allianceSelectOptions}
                users={userOptions}
                onCreateCompany={createCompanyQuickAction}
                onCreateAlliance={createAllianceQuickAction}
                updated={searchParams?.updated === '1'}
            />
        </div>
    );
}
