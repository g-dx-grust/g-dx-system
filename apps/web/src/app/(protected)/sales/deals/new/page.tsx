import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BusinessScope } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import { users, userBusinessMemberships } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import {
    listAcquisitionMethodOptions,
    listJetCreditStatusOptions,
    listJetDealStatusOptions,
    listJetStatus2Options,
} from '@/modules/master/infrastructure/form-master-repository';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { getPipeline } from '@/modules/sales/deal/application/get-pipeline';
import { listAllianceOptions } from '@/modules/sales/alliance/infrastructure/alliance-repository';
import { getMeeting } from '@/modules/sales/meeting/application/get-meeting';
import { DealCreateForm } from '@/modules/sales/deal/ui/deal-create-form';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { isAppError } from '@/shared/server/errors';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';

interface NewDealPageProps {
    searchParams?: {
        error?: string;
        fromMeeting?: string;
    };
}

function getErrorMessage(errorCode?: string): string | undefined {
    switch (errorCode) {
        case 'validation':
            return '会社・ステージは必須です。';
        case 'pipeline':
            return '利用できるパイプラインが見つかりません。設定を確認してください。';
        default:
            return undefined;
    }
}


export default async function NewDealPage({ searchParams }: NewDealPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        assertPermission(session, 'sales.deal.create');
    } catch {
        redirect('/unauthorized');
    }

    const isWaterSavingScope = session.activeBusinessScope === BusinessScope.WATER_SAVING;

    let pipeline;
    let companies;
    let acquisitionMethods;
    let jetDealStatuses;
    let jetCreditStatuses;
    let jetStatus2Options;
    let allianceOptionsRaw: { id: string; name: string }[] = [];

    try {
        [
            pipeline,
            companies,
            acquisitionMethods,
            jetDealStatuses,
            jetCreditStatuses,
            jetStatus2Options,
            allianceOptionsRaw,
        ] = await Promise.all([
            getPipeline(),
            listCompanies({ pageSize: 100 }),
            listAcquisitionMethodOptions(session.activeBusinessScope),
            isWaterSavingScope ? listJetDealStatusOptions() : Promise.resolve([]),
            isWaterSavingScope ? listJetCreditStatusOptions() : Promise.resolve([]),
            isWaterSavingScope ? listJetStatus2Options() : Promise.resolve([]),
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
    const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name ?? '名前未設定' }));

    // fromMeeting: 面談からの変換時にプリフィル
    let dealDefaults: { companyId?: string; memo?: string; nextActionDate?: string; nextActionContent?: string } | undefined;
    const fromMeetingId = searchParams?.fromMeeting;
    if (fromMeetingId) {
        const meeting = await getMeeting(fromMeetingId).catch(() => null);
        if (meeting) {
            dealDefaults = {
                companyId: meeting.companyId ?? undefined,
                memo: meeting.summary ?? undefined,
                nextActionDate: meeting.nextActionDate ?? undefined,
                nextActionContent: meeting.nextActionContent ?? undefined,
            };
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">案件登録</h1>
                    <p className="text-sm text-gray-500">案件登録</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/sales/deals">一覧へ戻る</Link>
                </Button>
            </div>
            <DealCreateForm
                companies={companies.data.map((company) => ({ id: company.id, name: company.name }))}
                stages={pipeline.stages}
                acquisitionMethods={acquisitionMethods}
                showJetFields={isWaterSavingScope}
                jetDealStatuses={jetDealStatuses}
                jetCreditStatuses={jetCreditStatuses}
                jetStatus2Options={jetStatus2Options}
                allianceOptions={allianceOptionsRaw.map((a) => ({ value: a.id, label: a.name }))}
                users={userOptions}
                currentUserId={session.user.id}
                errorMessage={getErrorMessage(searchParams?.error)}
                defaults={dealDefaults}
                fromMeetingId={fromMeetingId}
            />
        </div>
    );
}
