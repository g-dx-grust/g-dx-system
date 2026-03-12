import type { ContactListQuery } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listContacts as listContactsFromRepository } from '@/modules/customer-management/contact/infrastructure/contact-repository';

export async function listContacts(query: Pick<ContactListQuery, 'page' | 'pageSize' | 'keyword' | 'companyId'> = {}) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.contact.read');

    return listContactsFromRepository({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        companyId: query.companyId,
        businessScope: session.activeBusinessScope,
    });
}
