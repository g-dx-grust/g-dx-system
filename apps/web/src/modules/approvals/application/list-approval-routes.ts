import type { ApprovalRouteListResponse } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listApprovalRoutes } from '../infrastructure/approval-repository';

export async function getApprovalRoutes(): Promise<ApprovalRouteListResponse['data']> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'approval.request.read');

    return listApprovalRoutes(session.activeBusinessScope);
}
