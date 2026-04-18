import { NextRequest, NextResponse } from 'next/server';
import { getDealsWithTodayNextAction } from '@/modules/sales/deal/infrastructure/deal-repository';
import { sendGroupMessage, buildDailyAlertMessage } from '@/lib/lark/larkMessaging';

/**
 * 毎朝9時（JST）に実行されるcronジョブ
 * 次回アクション日が本日の案件にLarkアラートを送信する
 *
 * vercel.json で "0 0 * * *"（UTC 0時 = JST 9時）にスケジュールされる
 */
export async function GET(req: NextRequest) {
    // cronエンドポイントをCRON_SECRETで保護
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayJst = new Date(Date.now() + 9 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]; // YYYY-MM-DD in JST

    let deals;
    try {
        deals = await getDealsWithTodayNextAction(todayJst);
    } catch (err) {
        console.error('[cron/deal-alerts] Failed to fetch deals:', err);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const results: { dealId: string; status: 'sent' | 'error'; error?: string }[] = [];

    for (const deal of deals) {
        try {
            const message = buildDailyAlertMessage({
                dealName: deal.title,
                companyName: deal.companyName,
                nextActionContent: deal.nextActionContent,
                assigneeName: deal.ownerName,
            });
            await sendGroupMessage(deal.larkChatId, message);
            results.push({ dealId: deal.id, status: 'sent' });
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`[cron/deal-alerts] Failed to send alert for deal ${deal.id}:`, errMsg);
            results.push({ dealId: deal.id, status: 'error', error: errMsg });
        }
    }

    return NextResponse.json({ date: todayJst, processed: results.length, results });
}
