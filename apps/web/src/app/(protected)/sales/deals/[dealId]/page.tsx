import { redirect } from 'next/navigation';
import { DealDetailView } from '@/modules/sales/deal/ui/deal-detail';
import { getDealDetail, getDealStageHistory } from '@/modules/sales/deal/application/get-deal-detail';
import { getPipeline } from '@/modules/sales/deal/application/get-pipeline';
import { getDealActivities } from '@/modules/sales/deal/application/list-deal-activities';
import { listApprovals } from '@/modules/approvals/application/list-approvals';
import { getApprovalRoutes } from '@/modules/approvals/application/list-approval-routes';
import { getHearing, getHearingCompletion } from '@/modules/sales/hearing/application/get-hearing';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';

interface DealDetailPageProps {
    params: { dealId: string };
    searchParams?: {
        updated?: string;
        created?: string;
        staged?: string;
        activityAdded?: string;
        larkSaved?: string;
        approvalCreated?: string;
        hearingSaved?: string;
    };
}

const EMPTY_HEARING_COMPLETION = {
    gapCompleted: false,
    targetCompleted: false,
    scopeCompleted: false,
    subsidyCompleted: false,
    decisionCompleted: false,
    allCompleted: false,
    completedCount: 0,
    totalCount: 5,
};

export default async function DealDetailPage({ params, searchParams }: DealDetailPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    const canReadApprovals = permissions.has('approval.request.read');
    const canCreateApproval = permissions.has('approval.request.create');
    const canEditHearing = permissions.has('sales.hearing.update');
    const canReadHearing = permissions.has('sales.hearing.read');

    let deal;
    let pipeline;
    let activities;
    let stageHistory;
    let hearingRecord = null;
    let hearingCompletion = EMPTY_HEARING_COMPLETION;
    let approvalRequests = [];
    let approvalRoutes = [];
    try {
        [deal, pipeline, activities, stageHistory, hearingRecord, hearingCompletion, approvalRequests, approvalRoutes] = await Promise.all([
            getDealDetail(params.dealId),
            getPipeline(),
            getDealActivities(params.dealId),
            getDealStageHistory(params.dealId),
            canReadHearing ? getHearing(params.dealId) : Promise.resolve(null),
            canReadHearing ? getHearingCompletion(params.dealId) : Promise.resolve(EMPTY_HEARING_COMPLETION),
            canReadApprovals
                ? listApprovals({ dealId: params.dealId, pageSize: 5 }).then((result) => result.data)
                : Promise.resolve([]),
            canCreateApproval
                ? getApprovalRoutes().catch(() => [])
                : Promise.resolve([]),
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
            larkSaved={searchParams?.larkSaved === '1'}
            approvalCreated={searchParams?.approvalCreated === '1'}
            hearingSaved={searchParams?.hearingSaved === '1'}
            hearingRecord={hearingRecord}
            hearingCompletion={hearingCompletion}
            approvalRequests={approvalRequests}
            approvalRoutes={approvalRoutes}
            canEditHearing={canEditHearing}
            canCreateApproval={canCreateApproval}
            canReadApprovals={canReadApprovals}
        />
    );
}
