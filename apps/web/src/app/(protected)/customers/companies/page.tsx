import { redirect } from 'next/navigation';
import { CompanyList } from '@/modules/customer-management/company/ui/company-list';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { isAppError } from '@/shared/server/errors';

interface CompaniesPageProps {
    searchParams?: {
        created?: string;
        keyword?: string;
    };
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
    let result;
    try {
        result = await listCompanies({
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
            created={searchParams?.created === '1'}
            keyword={searchParams?.keyword}
        />
    );
}
