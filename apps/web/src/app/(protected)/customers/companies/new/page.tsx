import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { listIndustryOptions, listLeadSourceOptions } from '@/modules/master/infrastructure/form-master-repository';
import { CompanyCreateForm } from '@/modules/customer-management/company/ui/company-create-form';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';

interface NewCompanyPageProps {
    searchParams?: {
        error?: string;
    };
}

function getErrorMessage(errorCode?: string): string | undefined {
    switch (errorCode) {
        case 'duplicate':
            return '同じ名前の会社がすでに登録されています。';
        case 'validation':
            return '会社名は必須です。';
        default:
            return undefined;
    }
}

export default async function NewCompanyPage({ searchParams }: NewCompanyPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    try {
        assertPermission(session, 'customer.company.create');
    } catch {
        redirect('/unauthorized');
    }

    const [industries, leadSources] = await Promise.all([
        listIndustryOptions(),
        listLeadSourceOptions(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">会社を登録</h1>
                    <p className="text-sm text-gray-500">
                        会社マスタとビジネスプロフィールを同時に登録します。
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/customers/companies">一覧へ戻る</Link>
                </Button>
            </div>
            <CompanyCreateForm
                industries={industries}
                leadSources={leadSources}
                errorMessage={getErrorMessage(searchParams?.error)}
            />
        </div>
    );
}
