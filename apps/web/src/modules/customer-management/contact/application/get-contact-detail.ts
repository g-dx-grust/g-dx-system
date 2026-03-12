import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getContactDetail as getContactDetailFromRepository } from '@/modules/customer-management/contact/infrastructure/contact-repository';

export async function getContactDetail(contactId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.contact.read');

    return getContactDetailFromRepository(contactId, session.activeBusinessScope);
}
