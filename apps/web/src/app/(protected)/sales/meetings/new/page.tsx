import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@g-dx/database';
import { users, userBusinessMemberships } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { listAllianceOptions } from '@/modules/sales/alliance/infrastructure/alliance-repository';
import { createCompanyQuickAction } from '@/modules/customer-management/company/server-actions';
import { createAllianceQuickAction } from '@/modules/sales/alliance/server-actions';
import { MeetingCreateForm } from '@/modules/sales/meeting/ui/meeting-create-form';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { isAppError } from '@/shared/server/errors';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';

interface NewMeetingPageProps {
    searchParams?: { error?: string };
}

function getErrorMessage(errorCode?: string): string | undefined {
    if (errorCode === 'validation') return '日時・種別は必須です。相手タイプに応じて会社またはアライアンスを選択してください。';
    return undefined;
}

export default async function NewMeetingPage({ searchParams }: NewMeetingPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        assertPermission(session, 'sales.meeting.create');
    } catch {
        redirect('/unauthorized');
    }

    let companiesResult;
    let allianceOptions: { id: string; name: string }[] = [];

    try {
        [companiesResult, allianceOptions] = await Promise.all([
            listCompanies({ pageSize: 200 }),
            listAllianceOptions(session.activeBusinessScope),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

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

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">面談登録</h1>
                    <p className="text-sm text-gray-500">新しい面談（初回コンタクト・ヒアリング等）を記録します</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/sales/meetings">一覧へ戻る</Link>
                </Button>
            </div>
            <MeetingCreateForm
                companies={companyOptions}
                alliances={allianceSelectOptions}
                users={userOptions}
                currentUserId={session.user.id}
                onCreateCompany={createCompanyQuickAction}
                onCreateAlliance={createAllianceQuickAction}
                errorMessage={getErrorMessage(searchParams?.error)}
            />
        </div>
    );
}
