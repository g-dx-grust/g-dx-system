import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getCompanyImportFieldMappings } from '@/modules/customer-management/company/application/company-import';
import { CompanyImport } from '@/modules/customer-management/company/ui/company-import';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';

export default async function CompanyImportPage() {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    try {
        assertPermission(session, 'customer.company.create');
    } catch {
        redirect('/unauthorized');
    }

    const fieldMappings = await getCompanyImportFieldMappings();

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">会社CSV取込</h1>
                    <p className="text-sm text-gray-500">TSR CSV取込</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/customers/companies">一覧へ戻る</Link>
                </Button>
            </div>

            <CompanyImport fieldMappings={fieldMappings} />
        </div>
    );
}
