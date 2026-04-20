import { redirect } from 'next/navigation';
import { BusinessScope } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import { users, userBusinessMemberships } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import {
    listAcquisitionMethodOptions,
    listJetCreditStatusOptions,
    listJetDealStatusOptions,
    listJetStatus2Options,
} from '@/modules/master/infrastructure/form-master-repository';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { getPipeline } from '@/modules/sales/deal/application/get-pipeline';
import { listAllianceOptions } from '@/modules/sales/alliance/infrastructure/alliance-repository';
import { createCompanyQuickAction } from '@/modules/customer-management/company/server-actions';
import { createAllianceQuickAction } from '@/modules/sales/alliance/server-actions';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { isAppError } from '@/shared/server/errors';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { RegisterTabs } from './register-tabs';

interface RegisterPageProps {
    searchParams?: { tab?: string };
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        assertPermission(session, 'sales.deal.read');
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
            listCompanies({ pageSize: 200 }),
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
                  ),
              )
        : [];
    const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name ?? '名前未設定' }));

    const companyOptions = companies.data.map((c) => ({ id: c.id, name: c.name }));
    const allianceOptions = allianceOptionsRaw.map((a) => ({ value: a.id, label: a.name }));
    const companySelectOptions = companies.data.map((c) => ({ value: c.id, label: c.name }));

    const rawTab = searchParams?.tab;
    const initialTab = rawTab === 'alliance' || rawTab === 'meeting' ? rawTab : 'deal';

    return (
        <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">活動登録統合</h1>
            <p className="text-sm text-gray-500">商談・アライアンス・面談を一画面から登録できます</p>
            <RegisterTabs
                initialTab={initialTab}
                dealProps={{
                    companies: companyOptions,
                    stages: pipeline.stages,
                    acquisitionMethods,
                    showJetFields: isWaterSavingScope,
                    jetDealStatuses,
                    jetCreditStatuses,
                    jetStatus2Options,
                    allianceOptions,
                    users: userOptions,
                    currentUserId: session.user.id,
                }}
                meetingProps={{
                    companies: companySelectOptions,
                    alliances: allianceOptions,
                    users: userOptions,
                    currentUserId: session.user.id,
                    onCreateCompany: createCompanyQuickAction,
                    onCreateAlliance: createAllianceQuickAction,
                }}
            />
        </div>
    );
}
