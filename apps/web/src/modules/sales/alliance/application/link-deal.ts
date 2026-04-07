import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { AllianceReferralType } from '@g-dx/contracts';
import { linkAllianceToDeal, unlinkAllianceFromDeal } from '../infrastructure/alliance-repository';

export async function linkDealToAlliance(input: {
    allianceId: string;
    dealId: string;
    referralType: AllianceReferralType;
    note?: string;
}) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.alliance.update');
    return linkAllianceToDeal({ ...input, businessScope: session.activeBusinessScope });
}

export async function unlinkDealFromAlliance(allianceId: string, dealId: string) {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.alliance.update');
    return unlinkAllianceFromDeal(allianceId, dealId, session.activeBusinessScope);
}
