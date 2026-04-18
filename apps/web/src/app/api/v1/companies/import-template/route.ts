import { buildCompanyImportTemplateCsv, getCompanyImportFieldMappings } from '@/modules/customer-management/company/application/company-import';
import { isAppError } from '@/shared/server/errors';
import { errorResponse } from '@/shared/server/http';

export async function GET() {
    try {
        const fieldMappings = await getCompanyImportFieldMappings();
        const csv = buildCompanyImportTemplateCsv(fieldMappings);

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="company_import_template.csv"',
            },
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            return errorResponse(401, 'UNAUTHORIZED', 'Authentication is required.');
        }

        throw error;
    }
}
