import { redirect } from 'next/navigation';
import { DealList } from '@/modules/sales/deal/ui/deal-list';
import { listDeals } from '@/modules/sales/deal/application/list-deals';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { db } from '@g-dx/database';
import { users, userBusinessMemberships, businessUnits } from '@g-dx/database/schema';
import { and, eq, isNull } from 'drizzle-orm';
import type { DealStageKey, DealStatus } from '@g-dx/contracts';

interface DealsPageProps {
    searchParams?: {
        keyword?: string;
        stage?: string;
        ownerUserId?: string;
        amountMin?: string;
        amountMax?: string;
        nextActionStatus?: string;
        dealStatus?: string;
        created?: string;
        deleted?: string;
    };
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const amountMin = searchParams?.amountMin ? Number(searchParams.amountMin) : undefined;
    const amountMax = searchParams?.amountMax ? Number(searchParams.amountMax) : undefined;

    let result;
    try {
        result = await listDeals({
            keyword: searchParams?.keyword,
            stage: searchParams?.stage as DealStageKey | undefined,
            ownerUserId: searchParams?.ownerUserId,
            amountMin: amountMin !== undefined && !isNaN(amountMin) ? amountMin : undefined,
            amountMax: amountMax !== undefined && !isNaN(amountMax) ? amountMax : undefined,
            nextActionStatus: searchParams?.nextActionStatus as 'NOT_SET' | 'OVERDUE' | 'THIS_WEEK' | 'ALL' | undefined,
            dealStatus: searchParams?.dealStatus as DealStatus | undefined,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    // 同じビジネスユニットのユーザー一覧を取得
    const businessUnit = await db
        .select({ id: businessUnits.id })
        .from(businessUnits)
        .where(eq(businessUnits.code, session.activeBusinessScope))
        .limit(1)
        .then((rows) => rows[0]);

    const userOptions = businessUnit
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
              .then((rows) => rows.filter((r) => r.id !== null).map((r) => ({ id: r.id, name: r.name ?? '名前未設定' })))
        : await db
              .select({ id: users.id, name: users.displayName })
              .from(users)
              .where(and(eq(users.status, 'active'), isNull(users.deletedAt)))
              .then((rows) => rows.map((r) => ({ id: r.id, name: r.name ?? '名前未設定' })));

    return (
        <DealList
            deals={result.data}
            total={result.meta.total}
            keyword={searchParams?.keyword}
            stage={searchParams?.stage}
            ownerUserId={searchParams?.ownerUserId}
            amountMin={searchParams?.amountMin}
            amountMax={searchParams?.amountMax}
            nextActionStatus={searchParams?.nextActionStatus}
            dealStatus={searchParams?.dealStatus}
            users={userOptions}
            created={searchParams?.created === '1'}
            deleted={searchParams?.deleted === '1'}
        />
    );
}
