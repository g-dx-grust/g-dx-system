import { redirect } from 'next/navigation';
import { getContractDetail } from '@/modules/sales/contract/application/get-contract-detail';
import { ContractDetailView } from '@/modules/sales/contract/ui/contract-detail';
import { isAppError } from '@/shared/server/errors';
import { db } from '@g-dx/database';
import { users } from '@g-dx/database/schema';
import { isNull } from 'drizzle-orm';

interface ContractDetailPageProps {
    params: { contractId: string };
    searchParams?: { created?: string; updated?: string };
}

export default async function ContractDetailPage({ params, searchParams }: ContractDetailPageProps) {
    let contract;
    try {
        contract = await getContractDetail(params.contractId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/contracts');
        throw error;
    }

    const allUsers = await db
        .select({ id: users.id, name: users.displayName })
        .from(users)
        .where(isNull(users.deletedAt));

    const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name ?? '（名前なし）' }));

    return (
        <ContractDetailView
            contract={contract}
            users={userOptions}
            created={searchParams?.created === '1'}
            updated={searchParams?.updated === '1'}
        />
    );
}
