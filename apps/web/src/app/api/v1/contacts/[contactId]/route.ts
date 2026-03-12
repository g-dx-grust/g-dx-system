import type { UpdateContactRequest, UpdateContactResponse } from '@g-dx/contracts';
import { updateContact } from '@/modules/customer-management/contact/application/update-contact';
import { isAppError } from '@/shared/server/errors';
import { errorResponse, successResponse } from '@/shared/server/http';

interface RouteContext {
    params: {
        contactId: string;
    };
}

export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const body = (await request.json()) as UpdateContactRequest;
        const updated = await updateContact(params.contactId, body);
        return successResponse<UpdateContactResponse['data']>(updated);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }

        if (isAppError(error, 'FORBIDDEN')) {
            return errorResponse(403, 'FORBIDDEN', 'You do not have access to update contacts.');
        }

        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            return errorResponse(403, 'BUSINESS_SCOPE_FORBIDDEN', 'Active business scope is invalid.');
        }

        if (isAppError(error, 'NOT_FOUND')) {
            return errorResponse(404, 'NOT_FOUND', 'Contact was not found.');
        }

        throw error;
    }
}
