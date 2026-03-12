import type { CompanyListQuery } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listCompanies as listCompaniesFromRepository } from '@/modules/customer-management/company/infrastructure/company-repository';

export async function listCompanies(query: Pick<CompanyListQuery, 'page' | 'pageSize' | 'keyword'> = {}) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.company.read');

    return listCompaniesFromRepository({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        businessScope: session.activeBusinessScope,
    });
}
