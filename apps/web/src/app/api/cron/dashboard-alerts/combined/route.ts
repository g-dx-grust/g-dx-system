import { NextRequest, NextResponse } from 'next/server';
import { db } from '@g-dx/database';
import { businessUnits } from '@g-dx/database/schema';
import { eq } from 'drizzle-orm';
import type { BusinessScopeType } from '@g-dx/contracts';
import { getDashboardAlerts } from '@/modules/sales/deal/infrastructure/deal-repository';
import { getDashboardAlertLarkChatId } from '@/modules/admin/infrastructure/app-settings-repository';
import {
    buildCombinedLeakAlertMessage,
    sendGroupMessage,
    type DashboardAlertMessageItem,
} from '@/lib/lark/larkMessaging';

/**
 * 毎朝 8:55 JST (UTC 23:55 前日) に実行される cron
 * 次回アクション未設定 + 期限超過の案件を 1 通にまとめて Lark グループへ送信する
 *
 * vercel.json: "55 23 * * *"
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // チャット ID: DB 設定 → 環境変数の順で取得
    const chatId =
        (await getDashboardAlertLarkChatId()) ??
        process.env.LARK_ALERT_GROUP_CHAT_ID ??
        null;

    if (!chatId) {
        return NextResponse.json({
            status: 'skipped',
            reason: 'not_configured',
        });
    }

    // 全事業部のアラートを集約
    const activeBusinessUnits = await db
        .select({ code: businessUnits.code, name: businessUnits.name, sortOrder: businessUnits.sortOrder })
        .from(businessUnits)
        .where(eq(businessUnits.isActive, true))
        .orderBy(businessUnits.sortOrder, businessUnits.name);

    const noNextActionItems: DashboardAlertMessageItem[] = [];
    const overdueItems: DashboardAlertMessageItem[] = [];

    for (const bu of activeBusinessUnits) {
        const alerts = await getDashboardAlerts(bu.code as BusinessScopeType, { includeTeam: true });
        for (const alert of alerts) {
            const item: DashboardAlertMessageItem = {
                businessUnitName: bu.name,
                companyName: alert.companyName,
                dealName: alert.dealName,
                ownerName: alert.ownerName,
                detail: alert.detail,
                type: alert.type as DashboardAlertMessageItem['type'],
            };
            if (alert.type === 'NO_NEXT_ACTION') {
                noNextActionItems.push(item);
            } else if (alert.type === 'OVERDUE_ACTION') {
                overdueItems.push(item);
            }
        }
    }

    const totalCount = noNextActionItems.length + overdueItems.length;
    if (totalCount === 0) {
        return NextResponse.json({ status: 'skipped', reason: 'no_alerts', count: 0 });
    }

    const generatedAt = new Date().toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour12: false,
    });

    const message = buildCombinedLeakAlertMessage({
        generatedAt,
        noNextActionItems,
        overdueItems,
    });

    await sendGroupMessage(chatId, message);

    return NextResponse.json({
        status: 'sent',
        count: totalCount,
        noNextAction: noNextActionItems.length,
        overdue: overdueItems.length,
        chatId,
    });
}
