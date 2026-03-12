import type { CompanyDetailResponse, UpdateCompanyRequest, UpdateCompanyResponse } from '@g-dx/contracts';
import { getCompanyDetail } from '@/modules/customer-management/company/application/get-company-detail';
import { updateCompany } from '@/modules/customer-management/company/application/update-company';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: {
        companyId: string;
    };
}

export async function GET(_request: Request, { params }: RouteContext) {
    try {
        const company = await getCompanyDetail(params.companyId);
        return successResponse<CompanyDetailResponse['data']>(company);
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

        if (isAppError(error, 'NOT_FOUND')) {
            return errorResponse(404, 'NOT_FOUND', 'Company was not found.');
        }

        throw error;
    }
}

export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const body = (await request.json()) as UpdateCompanyRequest;
        const updated = await updateCompany(params.companyId, body);
        return successResponse<UpdateCompanyResponse['data']>(updated);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }

        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to update companies.');
        }

        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }

        if (isAppError(error, 'NOT_FOUND')) {
            return errorResponse(404, 'NOT_FOUND', 'Company was not found.');
        }

        throw error;
    }
}
