import { notFound, redirect } from 'next/navigation';
import { getCompanyDetail } from '@/modules/customer-management/company/application/get-company-detail';
import { listLeadSourceOptions } from '@/modules/master/infrastructure/form-master-repository';
import { CompanyDetailView } from '@/modules/customer-management/company/ui/company-detail';
import { isAppError } from '@/shared/server/errors';

interface CompanyDetailPageProps {
    params: {
        companyId: string;
    };
    searchParams?: {
        updated?: string;
        contactAdded?: string;
        contactError?: string;
    };
}

export default async function CompanyDetailPage({ params, searchParams }: CompanyDetailPageProps) {
    let company;
    const leadSourcesPromise = listLeadSourceOptions();
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

    const leadSources = await leadSourcesPromise;

    return (
        <CompanyDetailView
            company={company}
            leadSources={leadSources}
            updated={searchParams?.updated === '1'}
            contactAdded={searchParams?.contactAdded === '1'}
            contactError={searchParams?.contactError}
        />
    );
}
