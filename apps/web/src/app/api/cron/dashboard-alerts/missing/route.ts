import { NextRequest, NextResponse } from 'next/server';
import { sendDashboardAlertNotification } from '@/modules/sales/deal/infrastructure/dashboard-alert-lark-notification';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await sendDashboardAlertNotification('MISSING');
        return NextResponse.json(result);
    } catch (error) {
        console.error('[cron/dashboard-alerts/missing] Failed to send notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
