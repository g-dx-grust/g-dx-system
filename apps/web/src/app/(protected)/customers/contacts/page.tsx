import { redirect } from 'next/navigation';
import { listContacts } from '@/modules/customer-management/contact/application/list-contacts';
import { ContactList } from '@/modules/customer-management/contact/ui/contact-list';
import { isAppError } from '@/shared/server/errors';

interface ContactsPageProps {
    searchParams?: {
        created?: string;
        page?: string;
        keyword?: string;
        companyId?: string;
    };
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
    const pageParam = searchParams?.page ? Number.parseInt(searchParams.page, 10) : 1;
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    let result;
    try {
        result = await listContacts({
            page,
            keyword: searchParams?.keyword,
            companyId: searchParams?.companyId,
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
        <ContactList
            contacts={result.data}
            total={result.meta.total}
            page={result.meta.page}
            pageSize={result.meta.pageSize}
            created={searchParams?.created === '1'}
            keyword={searchParams?.keyword}
            companyId={searchParams?.companyId}
        />
    );
}
