import { redirect } from 'next/navigation';
import { getContractDetail } from '@/modules/sales/contract/application/get-contract-detail';
import { listContractActivities } from '@/modules/sales/contract/infrastructure/contract-repository';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
import { ContractDetailView } from '@/modules/sales/contract/ui/contract-detail';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { db } from '@g-dx/database';
import { users, userBusinessMemberships } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import type { UUID } from '@g-dx/contracts';

interface ContractDetailPageProps {
    params: { contractId: string };
    searchParams?: { created?: string; updated?: string; activityAdded?: string };
}

export default async function ContractDetailPage({ params, searchParams }: ContractDetailPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    let contract;
    try {
        contract = await getContractDetail(params.contractId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/contracts');
        throw error;
    }

    const businessUnit = await findBusinessUnitByScope(session.activeBusinessScope);

    const [allUsers, activities] = await Promise.all([
        businessUnit
            ? db
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
            : Promise.resolve([]),
        listContractActivities(params.contractId as UUID, session.activeBusinessScope),
    ]);

    const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name ?? '（名前なし）' }));

    return (
        <ContractDetailView
            contract={contract}
            users={userOptions}
            created={searchParams?.created === '1'}
            updated={searchParams?.updated === '1'}
            activities={activities}
            activityAdded={searchParams?.activityAdded === '1'}
        />
    );
}
