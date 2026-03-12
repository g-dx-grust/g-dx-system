import type {
    ContactListQuery,
    ContactListResponse,
    CreateContactRequest,
    CreateContactResponse,
} from '@g-dx/contracts';
import { createContact } from '@/modules/customer-management/contact/application/create-contact';
import { listContacts } from '@/modules/customer-management/contact/application/list-contacts';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page') ?? '1');
        const pageSize = Number(searchParams.get('pageSize') ?? '20');
        const keyword = searchParams.get('keyword') ?? undefined;
        const companyId = searchParams.get('companyId') ?? undefined;

        const result = await listContacts({
            page: Number.isFinite(page) ? page : 1,
            pageSize: Number.isFinite(pageSize) ? pageSize : 20,
            keyword,
            companyId,
        } satisfies Pick<ContactListQuery, 'page' | 'pageSize' | 'keyword' | 'companyId'>);

        return successResponse<ContactListResponse['data'], ContactListResponse['meta']>(result.data, result.meta);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }

        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to contacts.');
        }

        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }

        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as CreateContactRequest;

        if (!body.companyId || !body.name?.trim()) {
            const fields: Record<string, string[]> = {};
            if (!body.companyId) {
                fields.companyId = ['Company is required.'];
            }
            if (!body.name?.trim()) {
                fields.name = ['Contact name is required.'];
            }

            return errorResponse(422, 'VALIDATION_ERROR', 'Company and contact name are required.', {
                fields,
            });
        }

        const created = await createContact(body);
        return successResponse<CreateContactResponse['data']>(created);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }

        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to create contacts.');
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
