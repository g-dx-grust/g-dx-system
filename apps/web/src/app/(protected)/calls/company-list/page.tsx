import { redirect } from 'next/navigation';
import { CallCompanyList } from '@/modules/call/ui/call-company-list';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { isAppError } from '@/shared/server/errors';

interface Props {
    searchParams?: {
        keyword?: string;
        queued?: string;
        recorded?: string;
    };
}

export default async function CallCompanyListPage({ searchParams }: Props) {
    let result;
    try {
        result = await listCompanies({ pageSize: 500, keyword: searchParams?.keyword });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <CallCompanyList
            companies={result.data}
            total={result.meta.total}
            keyword={searchParams?.keyword}
            queued={searchParams?.queued}
            recorded={searchParams?.recorded}
        />
    );
}
