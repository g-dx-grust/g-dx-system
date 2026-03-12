import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ContractCreateForm } from '@/modules/sales/contract/ui/contract-create-form';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { isAppError } from '@/shared/server/errors';

interface NewContractPageProps {
    searchParams?: {
        error?: string;
    };
}

function getErrorMessage(errorCode?: string): string | undefined {
    switch (errorCode) {
        case 'validation':
            return '契約タイトルと会社は必須です。';
        default:
            return undefined;
    }
}

export default async function NewContractPage({ searchParams }: NewContractPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        assertPermission(session, 'sales.contract.create');
    } catch {
        redirect('/unauthorized');
    }

    let companies;
    try {
        companies = await listCompanies({ pageSize: 100 });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">新規契約登録</h1>
                    <p className="text-sm text-gray-500">
                        新しい契約を登録します。
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/sales/contracts">一覧へ戻る</Link>
                </Button>
            </div>
            <ContractCreateForm
                companies={companies.data.map((c) => ({ id: c.id, name: c.name }))}
                errorMessage={getErrorMessage(searchParams?.error)}
            />
        </div>
    );
}
