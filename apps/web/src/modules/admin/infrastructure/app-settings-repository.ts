import { db } from '@g-dx/database';
import { appSettings } from '@g-dx/database/schema';
import { eq } from 'drizzle-orm';

export const DASHBOARD_ALERT_LARK_CHAT_ID_KEY = 'dashboard_alert_lark_chat_id';

export async function getDashboardAlertLarkChatId(): Promise<string | null> {
    try {
        const [row] = await db
            .select({ value: appSettings.value })
            .from(appSettings)
            .where(eq(appSettings.key, DASHBOARD_ALERT_LARK_CHAT_ID_KEY))
            .limit(1);

        const value = row?.value?.trim();
        return value ? value : null;
    } catch (e) {
        // app_settings テーブルが未作成の場合などに備えてフォールバック
        console.error('[app-settings] getDashboardAlertLarkChatId error:', e);
        return null;
    }
}

export async function saveDashboardAlertLarkChatId(
    chatId: string | null,
    updatedByUserId: string,
): Promise<void> {
    const normalizedValue = chatId?.trim() || null;

    await db
        .insert(appSettings)
        .values({
            key: DASHBOARD_ALERT_LARK_CHAT_ID_KEY,
            value: normalizedValue,
            updatedByUserId,
        })
        .onConflictDoUpdate({
            target: appSettings.key,
            set: {
                value: normalizedValue,
                updatedAt: new Date(),
                updatedByUserId,
            },
        });
}
