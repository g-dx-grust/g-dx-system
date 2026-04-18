import { redirect } from 'next/navigation';
import { listCallQueue } from '@/modules/call/application/list-call-queue';
import { CallQueueView } from '@/modules/call/ui/call-queue';
import { isAppError } from '@/shared/server/errors';
import { listCompanies } from '@/modules/customer-management/company/application/list-companies';

interface Props { searchParams?: { added?: string; called?: string } }

export default async function CallQueuePage({ searchParams }: Props) {
    let queue, companiesResult;
    try {
        [queue, companiesResult] = await Promise.all([listCallQueue(), listCompanies({ pageSize: 200 })]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
    return <CallQueueView queue={queue} companies={companiesResult.data.map((c) => ({ id: c.id, name: c.name, phone: c.phone ?? '' }))} added={searchParams?.added === '1'} called={searchParams?.called === '1'} />;
}
