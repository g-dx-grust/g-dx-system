import { redirect } from 'next/navigation';
import { CompanyList } from '@/modules/customer-management/company/ui/company-list';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { isAppError } from '@/shared/server/errors';

interface CompaniesPageProps {
    searchParams?: {
        created?: string;
        page?: string;
        keyword?: string;
    };
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
    const pageParam = searchParams?.page ? Number.parseInt(searchParams.page, 10) : 1;
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    let result;
    try {
        result = await listCompanies({
            page,
            keyword: searchParams?.keyword,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            redirect('/login');
        }

        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            redirect('/unauthorized');
        }

        throw error;
    }

    return (
        <CompanyList
            companies={result.data}
            total={result.meta.total}
            page={result.meta.page}
            pageSize={result.meta.pageSize}
            created={searchParams?.created === '1'}
            keyword={searchParams?.keyword}
        />
    );
}
