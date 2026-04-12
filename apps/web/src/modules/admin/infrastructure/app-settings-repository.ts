import { db } from '@g-dx/database';
import { appSettings } from '@g-dx/database/schema';
import { eq } from 'drizzle-orm';

export const DASHBOARD_ALERT_LARK_CHAT_ID_KEY = 'dashboard_alert_lark_chat_id';
export const DASHBOARD_SECTIONS_KEY = 'dashboard_deals_sections';

export type DashboardSectionKey =
    | 'businessGoals'
    | 'alerts'
    | 'teamKpi'
    | 'aiSummary'
    | 'metricCards'
    | 'stageCharts'
    | 'companyChart'
    | 'nextActions';

export type DashboardSectionsConfig = Record<DashboardSectionKey, boolean>;

export const DASHBOARD_SECTION_LABELS: Record<DashboardSectionKey, string> = {
    businessGoals: '会社目標',
    alerts: 'アラート',
    teamKpi: 'チームKPI',
    aiSummary: 'AI週次サマリー',
    metricCards: 'サマリー指標（4枚カード）',
    stageCharts: 'フェーズ別チャート',
    companyChart: '会社別進行中案件',
    nextActions: 'ネクストアクション',
};

export const DEFAULT_DASHBOARD_SECTIONS: DashboardSectionsConfig = {
    businessGoals: true,
    alerts: true,
    teamKpi: true,
    aiSummary: true,
    metricCards: true,
    stageCharts: true,
    companyChart: true,
    nextActions: true,
};

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

export async function getDashboardSectionsConfig(): Promise<DashboardSectionsConfig> {
    try {
        const [row] = await db
            .select({ value: appSettings.value })
            .from(appSettings)
            .where(eq(appSettings.key, DASHBOARD_SECTIONS_KEY))
            .limit(1);

        if (!row?.value) return { ...DEFAULT_DASHBOARD_SECTIONS };
        const parsed = JSON.parse(row.value) as Partial<DashboardSectionsConfig>;
        // DB にない新キーはデフォルト値で補完
        return { ...DEFAULT_DASHBOARD_SECTIONS, ...parsed };
    } catch {
        return { ...DEFAULT_DASHBOARD_SECTIONS };
    }
}

export async function saveDashboardSectionsConfig(
    config: DashboardSectionsConfig,
    updatedByUserId: string,
): Promise<void> {
    const value = JSON.stringify(config);
    await db
        .insert(appSettings)
        .values({ key: DASHBOARD_SECTIONS_KEY, value, updatedByUserId })
        .onConflictDoUpdate({
            target: appSettings.key,
            set: { value, updatedAt: new Date(), updatedByUserId },
        });
}
