import type { UpdateCompanyRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateCompany as updateCompanyInRepository } from '@/modules/customer-management/company/infrastructure/company-repository';

function normalizeTags(tags: string[] | undefined): string[] | undefined {
    if (!tags) {
        return undefined;
    }

    return tags.map((tag) => tag.trim()).filter(Boolean);
}

export async function updateCompany(companyId: string, input: UpdateCompanyRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.company.update');

    return updateCompanyInRepository({
        companyId,
        industry: input.industry,
        phone: input.phone,
        ownerUserId: input.ownerUserId,
        tags: normalizeTags(input.tags),
        leadSource: input.leadSource,
        businessScope: session.activeBusinessScope,
        actorUserId: session.user.id,
    });
}
