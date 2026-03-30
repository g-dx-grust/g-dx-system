import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ContractCreateForm } from '@/modules/sales/contract/ui/contract-create-form';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { isAppError } from '@/shared/server/errors';
import { db } from '@g-dx/database';
import { users } from '@g-dx/database/schema';
import { isNull } from 'drizzle-orm';

interface NewContractPageProps {
    searchParams?: {
        error?: string;
        dealId?: string;
        companyId?: string;
        title?: string;
        amount?: string;
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

    const allUsers = await db
        .select({ id: users.id, name: users.displayName })
        .from(users)
        .where(isNull(users.deletedAt));

    const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name ?? '名前未設定' }));

    const defaultValues = searchParams?.dealId
        ? {
              dealId: searchParams.dealId,
              companyId: searchParams.companyId,
              title: searchParams.title,
              amount: searchParams.amount,
          }
        : undefined;

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">契約登録</h1>
                    <p className="text-sm text-gray-500">
                        {defaultValues?.dealId ? '案件からの契約登録' : '契約登録'}
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/sales/contracts">一覧へ戻る</Link>
                </Button>
            </div>
            <ContractCreateForm
                companies={companies.data.map((c) => ({ id: c.id, name: c.name }))}
                users={userOptions}
                errorMessage={getErrorMessage(searchParams?.error)}
                defaultValues={defaultValues}
            />
        </div>
    );
}
