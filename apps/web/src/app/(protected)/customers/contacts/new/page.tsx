import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import { ContactCreateForm } from '@/modules/customer-management/contact/ui/contact-create-form';
import { assertPermission } from '@/shared/server/authorization';
import { getAuthenticatedAppSession } from '@/shared/server/session';

interface NewContactPageProps {
    searchParams?: {
        error?: string;
        companyId?: string;
    };
}

function getErrorMessage(errorCode?: string): string | undefined {
    switch (errorCode) {
        case 'validation':
            return '会社名とコンタクト名は必須です。';
        case 'company':
            return '選択した会社はこのビジネスで利用できません。';
        default:
            return undefined;
    }
}

export default async function NewContactPage({ searchParams }: NewContactPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    try {
        assertPermission(session, 'customer.contact.create');
    } catch {
        redirect('/unauthorized');
    }

    const companies = await listCompanies({
        pageSize: 100,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">コンタクトを登録</h1>
                    <p className="text-sm text-gray-500">
                        コンタクトを登録して会社に紐づけます。
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/customers/contacts">一覧へ戻る</Link>
                </Button>
            </div>
            <ContactCreateForm
                companies={companies.data.map((company) => ({ id: company.id, name: company.name }))}
                defaultCompanyId={searchParams?.companyId}
                errorMessage={getErrorMessage(searchParams?.error)}
            />
        </div>
    );
}
