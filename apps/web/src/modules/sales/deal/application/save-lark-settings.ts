import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { updateDealLarkSettings } from '../infrastructure/deal-repository';

export async function saveLarkSettings(input: {
    dealId: string;
    larkChatId: string | null;
    larkCalendarId: string | null;
}): Promise<void> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');
    assertPermission(session, 'sales.deal.update_basic');
    await updateDealLarkSettings({
        dealId: input.dealId,
        larkChatId: input.larkChatId,
        larkCalendarId: input.larkCalendarId,
        actorUserId: session.user.id,
    });
}
