import type { CreateCompanyRequest } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { createCompany as createCompanyInRepository } from '@/modules/customer-management/company/infrastructure/company-repository';

function normalizeTags(tags: string[] | undefined): string[] {
    if (!tags) {
        return [];
    }

    return tags
        .map((tag) => tag.trim())
        .filter(Boolean);
}

export async function createCompany(input: CreateCompanyRequest) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.company.create');

    return createCompanyInRepository({
        name: input.name,
        industry: input.industry,
        phone: input.phone,
        website: input.website,
        postalCode: input.postalCode,
        address: input.address,
        ownerUserId: input.ownerUserId,
        tags: normalizeTags(input.tags),
        leadSource: input.leadSource,
        businessScope: session.activeBusinessScope,
        actorUserId: session.user.id,
    });
}
