import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@g-dx/database';
import { users, userBusinessMemberships } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { listIndustryOptions, listLeadSourceOptions } from '@/modules/master/infrastructure/form-master-repository';
import { CompanyCreateForm } from '@/modules/customer-management/company/ui/company-create-form';
import { findBusinessUnitByScope } from '@/shared/server/business-unit';
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
            return '同じ会社がすでに登録されています。';
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

    const businessUnit = await findBusinessUnitByScope(session.activeBusinessScope);
    const allUsers = businessUnit
        ? await db
              .select({ id: users.id, name: users.displayName })
              .from(users)
              .innerJoin(userBusinessMemberships, eq(userBusinessMemberships.userId, users.id))
              .where(
                  and(
                      eq(userBusinessMemberships.businessUnitId, businessUnit.id),
                      eq(userBusinessMemberships.membershipStatus, 'active'),
                      eq(users.status, 'active'),
                      isNull(users.deletedAt),
                  )
              )
        : [];
    const userOptions = allUsers.map((u) => ({ id: u.id, name: u.name ?? '名前未設定' }));

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">会社登録</h1>
                    <p className="text-sm text-gray-500">会社登録</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/customers/companies">一覧へ戻る</Link>
                </Button>
            </div>
            <CompanyCreateForm
                industries={industries}
                leadSources={leadSources}
                users={userOptions}
                currentUserId={session.user.id}
                errorMessage={getErrorMessage(searchParams?.error)}
            />
        </div>
    );
}
