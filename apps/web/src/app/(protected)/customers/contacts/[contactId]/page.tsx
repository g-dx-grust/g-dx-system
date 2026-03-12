import { notFound, redirect } from 'next/navigation';
import { getContactDetail } from '@/modules/customer-management/contact/application/get-contact-detail';
import { ContactDetailView } from '@/modules/customer-management/contact/ui/contact-detail';
import { isAppError } from '@/shared/server/errors';

interface ContactDetailPageProps {
    params: {
        contactId: string;
    };
    searchParams?: {
        created?: string;
        updated?: string;
    };
}

export default async function ContactDetailPage({ params, searchParams }: ContactDetailPageProps) {
    let contact;
    try {
        contact = await getContactDetail(params.contactId);
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

    return (
        <ContactDetailView
            contact={contact}
            created={searchParams?.created === '1'}
            updated={searchParams?.updated === '1'}
        />
    );
}
