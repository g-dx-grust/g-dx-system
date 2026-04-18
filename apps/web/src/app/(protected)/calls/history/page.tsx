import { redirect } from 'next/navigation';
import { listCallHistory } from '@/modules/call/application/list-call-history';
import { CallHistoryView } from '@/modules/call/ui/call-history';
import { isAppError } from '@/shared/server/errors';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';
import type { CallResult } from '@g-dx/contracts';

interface Props { searchParams?: { keyword?: string; result?: string; recorded?: string } }

export default async function CallHistoryPage({ searchParams }: Props) {
    let result, companiesResult;
    try {
        [result, companiesResult] = await Promise.all([
            listCallHistory({ keyword: searchParams?.keyword, result: searchParams?.result as CallResult | undefined }),
            listCompanies({ pageSize: 200 }),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    return <CallHistoryView calls={result.data} total={result.total} keyword={searchParams?.keyword} result={searchParams?.result} companies={companiesResult.data.map((c) => ({ id: c.id, name: c.name }))} recorded={searchParams?.recorded === '1'} />;
}
