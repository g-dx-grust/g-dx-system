import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { getCompanyDetail as getCompanyDetailFromRepository } from '@/modules/customer-management/company/infrastructure/company-repository';

export async function getCompanyDetail(companyId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.company.read');

    return getCompanyDetailFromRepository(
        companyId,
        session.activeBusinessScope,
        session.user.businessScopes
    );
}
