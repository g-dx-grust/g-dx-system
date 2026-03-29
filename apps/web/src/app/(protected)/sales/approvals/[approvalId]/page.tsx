import { redirect } from 'next/navigation';
import { getApprovalDetail } from '@/modules/approvals/application/get-approval-detail';
import { ApprovalDetailView } from '@/modules/approvals/ui/approval-detail';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession, getGrantedPermissionKeys } from '@/shared/server/session';

interface ApprovalDetailPageProps {
    params: { approvalId: string };
    searchParams?: {
        decided?: string;
    };
}

export default async function ApprovalDetailPage({ params, searchParams }: ApprovalDetailPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    const permissions = new Set(getGrantedPermissionKeys(session.user.roles));
    const canDecide = permissions.has('approval.decide');

    let detail;
    try {
        detail = await getApprovalDetail(params.approvalId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/approvals');
        throw error;
    }

    return <ApprovalDetailView detail={detail} canDecide={canDecide} decided={searchParams?.decided === '1'} />;
}
