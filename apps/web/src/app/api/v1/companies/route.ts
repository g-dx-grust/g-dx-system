import type { CompanyListResponse, CompanyListQuery, CreateCompanyRequest, CreateCompanyResponse } from '@g-dx/contracts';
import { createCompany } from '@/modules/customer-management/company/application/create-company';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page') ?? '1');
        const pageSize = Number(searchParams.get('pageSize') ?? '20');
        const keyword = searchParams.get('keyword') ?? undefined;

        const result = await listCompanies({
            page: Number.isFinite(page) ? page : 1,
            pageSize: Number.isFinite(pageSize) ? pageSize : 20,
            keyword,
        } satisfies Pick<CompanyListQuery, 'page' | 'pageSize' | 'keyword'>);

        return successResponse<CompanyListResponse['data'], CompanyListResponse['meta']>(result.data, result.meta);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }

        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to companies.');
        }

        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }

        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as CreateCompanyRequest;
        if (!body.name?.trim()) {
            return errorResponse(422, 'VALIDATION_ERROR', 'Company name is required.', {
                fields: {
                    name: ['Company name is required.'],
                },
            });
        }

        const created = await createCompany(body);
        return successResponse<CreateCompanyResponse['data']>(created);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }

        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to create companies.');
        }

        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }

        if (isAppError(error, 'DUPLICATE_COMPANY')) {
            return errorResponse(409, 'DUPLICATE_COMPANY', 'A company with the same name already exists in the active business scope.');
        }

        throw error;
    }
}
