import type { ContractActivityInitiatedBy, ContractActivityType, ContractNextSessionType, ContractProgressStatus } from '@g-dx/contracts';
import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateContractActivity as repo } from '../infrastructure/contract-repository';

export async function updateContractActivity(input: {
    activityId: string;
    contractId: string;
    activityType?: ContractActivityType;
    activityDate?: string;
    summary?: string | null;
    initiatedBy?: ContractActivityInitiatedBy | null;
    sessionNumber?: number | null;
    progressStatus?: ContractProgressStatus | null;
    larkMeetingUrl?: string | null;
    nextSessionType?: ContractNextSessionType | null;
    nextSessionDate?: string | null;
}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.contract.update_basic');
    return repo({ ...input, businessScope: session.activeBusinessScope, actorUserId: session.user.id });
}
