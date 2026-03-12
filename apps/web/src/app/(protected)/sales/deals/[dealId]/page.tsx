import { redirect } from 'next/navigation';
import { DealDetailView } from '@/modules/sales/deal/ui/deal-detail';
import { getDealDetail, getDealStageHistory } from '@/modules/sales/deal/application/get-deal-detail';
import { getPipeline } from '@/modules/sales/deal/application/get-pipeline';
import { getDealActivities } from '@/modules/sales/deal/application/list-deal-activities';
import { isAppError } from '@/shared/server/errors';

interface DealDetailPageProps {
    params: { dealId: string };
    searchParams?: {
        updated?: string;
        created?: string;
        staged?: string;
        activityAdded?: string;
    };
}

export default async function DealDetailPage({ params, searchParams }: DealDetailPageProps) {
    let deal;
    let pipeline;
    let activities;
    let stageHistory;
    try {
        [deal, pipeline, activities, stageHistory] = await Promise.all([
            getDealDetail(params.dealId),
            getPipeline(),
            getDealActivities(params.dealId),
            getDealStageHistory(params.dealId),
        ]);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/deals');
        throw error;
    }

    return (
        <DealDetailView
            deal={deal}
            stages={pipeline.stages}
            activities={activities}
            stageHistory={stageHistory}
            updated={searchParams?.updated === '1' || searchParams?.created === '1'}
            staged={searchParams?.staged === '1'}
            activityAdded={searchParams?.activityAdded === '1'}
        />
    );
}
