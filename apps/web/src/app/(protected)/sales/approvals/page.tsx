import { redirect } from 'next/navigation';
import { listApprovals } from '@/modules/approvals/application/list-approvals';
import { ApprovalListView } from '@/modules/approvals/ui/approval-list';
import { isAppError } from '@/shared/server/errors';

interface ApprovalListPageProps {
    searchParams?: {
        approvalType?: string;
        approvalStatus?: string;
        dealId?: string;
    };
}

export default async function ApprovalListPage({ searchParams }: ApprovalListPageProps) {
    let result;
    try {
        result = await listApprovals({
            approvalType: searchParams?.approvalType,
            approvalStatus: searchParams?.approvalStatus,
            dealId: searchParams?.dealId,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    return (
        <ApprovalListView
            items={result.data}
            total={result.meta.total}
            filters={{
                approvalType: searchParams?.approvalType,
                approvalStatus: searchParams?.approvalStatus,
                dealId: searchParams?.dealId,
            }}
        />
    );
}
