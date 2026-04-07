import { redirect } from 'next/navigation';
import { listAlliances } from '@/modules/sales/alliance/application/list-alliances';
import { AllianceList } from '@/modules/sales/alliance/ui/alliance-list';
import { isAppError } from '@/shared/server/errors';
import type { AllianceStatus } from '@g-dx/contracts';

interface AlliancesPageProps {
    searchParams?: { keyword?: string; status?: string; created?: string };
}

export default async function AlliancesPage({ searchParams }: AlliancesPageProps) {
    let result;
    try {
        result = await listAlliances({
            keyword: searchParams?.keyword,
            relationshipStatus: searchParams?.status as AllianceStatus | undefined,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <AllianceList
            alliances={result.data}
            total={result.total}
            keyword={searchParams?.keyword}
            status={searchParams?.status}
            created={searchParams?.created === '1'}
        />
    );
}
