import { redirect } from 'next/navigation';
import { listMeetings } from '@/modules/sales/meeting/application/list-meetings';
import { MeetingList } from '@/modules/sales/meeting/ui/meeting-list';
import { isAppError } from '@/shared/server/errors';
import type { MeetingActivityType, MeetingCounterpartyType } from '@g-dx/contracts';

interface MeetingsPageProps {
    searchParams?: {
        dateFrom?: string;
        dateTo?: string;
        ownerUserId?: string;
        activityType?: string;
        counterpartyType?: string;
        created?: string;
        deleted?: string;
    };
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
    let result;
    try {
        result = await listMeetings({
            dateFrom: searchParams?.dateFrom,
            dateTo: searchParams?.dateTo,
            ownerUserId: searchParams?.ownerUserId,
            activityType: searchParams?.activityType as MeetingActivityType | undefined,
            counterpartyType: searchParams?.counterpartyType as MeetingCounterpartyType | undefined,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <MeetingList
            meetings={result.data}
            total={result.total}
            dateFrom={searchParams?.dateFrom}
            dateTo={searchParams?.dateTo}
            ownerUserId={searchParams?.ownerUserId}
            activityType={searchParams?.activityType}
            counterpartyType={searchParams?.counterpartyType}
            created={searchParams?.created === '1'}
            deleted={searchParams?.deleted === '1'}
        />
    );
}
