import type { UpdateContactRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateContact as updateContactInRepository } from '@/modules/customer-management/contact/infrastructure/contact-repository';

export async function updateContact(contactId: string, input: UpdateContactRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.contact.update');

    return updateContactInRepository({
        contactId,
        department: input.department,
        title: input.title,
        email: input.email,
        phone: input.phone,
        businessScope: session.activeBusinessScope,
        actorUserId: session.user.id,
    });
}
