import { redirect } from 'next/navigation';
import { getContractDetail } from '@/modules/sales/contract/application/get-contract-detail';
import { ContractDetailView } from '@/modules/sales/contract/ui/contract-detail';
import { isAppError } from '@/shared/server/errors';

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

    return (
        <ContractDetailView
            contract={contract}
            created={searchParams?.created === '1'}
            updated={searchParams?.updated === '1'}
        />
    );
}
