import { redirect } from 'next/navigation';
import { listContacts } from '@/modules/customer-management/contact/application/list-contacts';
import { ContactList } from '@/modules/customer-management/contact/ui/contact-list';
import { isAppError } from '@/shared/server/errors';

interface ContactsPageProps {
    searchParams?: {
        created?: string;
        keyword?: string;
        companyId?: string;
    };
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
    let result;
    try {
        result = await listContacts({
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
            created={searchParams?.created === '1'}
            keyword={searchParams?.keyword}
            companyId={searchParams?.companyId}
        />
    );
}
