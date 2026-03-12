import { redirect } from 'next/navigation';
import { listContracts } from '@/modules/sales/contract/application/list-contracts';
import { ContractList } from '@/modules/sales/contract/ui/contract-list';
import { isAppError } from '@/shared/server/errors';
import type { ContractStatus } from '@g-dx/contracts';

interface ContractsPageProps {
    searchParams?: { keyword?: string; status?: string; created?: string };
}

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
    let result;
    try {
        result = await listContracts({
            keyword: searchParams?.keyword,
            contractStatus: searchParams?.status as ContractStatus | undefined,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <ContractList
            contracts={result.data}
            total={result.total}
            keyword={searchParams?.keyword}
            status={searchParams?.status}
            created={searchParams?.created === '1'}
        />
    );
}
