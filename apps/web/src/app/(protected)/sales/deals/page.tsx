import { redirect } from 'next/navigation';
import { DealList } from '@/modules/sales/deal/ui/deal-list';
import { listDeals } from '@/modules/sales/deal/application/list-deals';
import { isAppError } from '@/shared/server/errors';
import type { DealStageKey } from '@g-dx/contracts';

interface DealsPageProps {
    searchParams?: {
        keyword?: string;
        stage?: string;
        created?: string;
    };
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
    let result;
    try {
        result = await listDeals({
            keyword: searchParams?.keyword,
            stage: searchParams?.stage as DealStageKey | undefined,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <DealList
            deals={result.data}
            total={result.meta.total}
            keyword={searchParams?.keyword}
            stage={searchParams?.stage}
            created={searchParams?.created === '1'}
        />
    );
}
