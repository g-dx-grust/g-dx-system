import { notFound, redirect } from 'next/navigation';
import { getCompanyDetail } from '@/modules/customer-management/company/application/get-company-detail';
import { CompanyDetailView } from '@/modules/customer-management/company/ui/company-detail';
import { isAppError } from '@/shared/server/errors';

interface CompanyDetailPageProps {
    params: {
        companyId: string;
    };
    searchParams?: {
        updated?: string;
    };
}

export default async function CompanyDetailPage({ params, searchParams }: CompanyDetailPageProps) {
    let company;
    try {
        company = await getCompanyDetail(params.companyId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            redirect('/login');
        }

        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            redirect('/unauthorized');
        }

        if (isAppError(error, 'NOT_FOUND')) {
            notFound();
        }

        throw error;
    }

    return <CompanyDetailView company={company} updated={searchParams?.updated === '1'} />;
}
