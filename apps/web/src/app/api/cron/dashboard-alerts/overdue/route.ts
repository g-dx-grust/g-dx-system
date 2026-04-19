import { NextRequest, NextResponse } from 'next/server';
import { sendDashboardAlertNotification } from '@/modules/sales/deal/infrastructure/dashboard-alert-lark-notification';
import { requireCronAuthorization } from '@/shared/server/request-guards';

export async function GET(req: NextRequest) {
    const authFailure = requireCronAuthorization(req);
    if (authFailure) {
        return authFailure;
    }

    try {
        const result = await sendDashboardAlertNotification('OVERDUE');
        return NextResponse.json(result);
    } catch (error) {
        console.error('[cron/dashboard-alerts/overdue] Failed to send notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
