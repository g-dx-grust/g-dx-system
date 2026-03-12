import type { CreateContactRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createContact as createContactInRepository } from '@/modules/customer-management/contact/infrastructure/contact-repository';

export async function createContact(input: CreateContactRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.contact.create');

    return createContactInRepository({
        companyId: input.companyId,
        name: input.name,
        department: input.department,
        title: input.title,
        email: input.email,
        phone: input.phone,
        isPrimary: input.isPrimary,
        businessScope: session.activeBusinessScope,
        actorUserId: session.user.id,
    });
}
