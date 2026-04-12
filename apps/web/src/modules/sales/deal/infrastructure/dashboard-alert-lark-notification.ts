import { db } from '@g-dx/database';
import { businessUnits } from '@g-dx/database/schema';
import { eq } from 'drizzle-orm';
import type { BusinessScopeType, DashboardAlert, DashboardAlertType } from '@g-dx/contracts';
import {
    buildDashboardLeakAlertMessage,
    buildDashboardOverdueAlertMessage,
    sendGroupMessage,
    type DashboardAlertMessageItem,
} from '@/lib/lark/larkMessaging';
import { getDashboardAlertLarkChatId } from '@/modules/admin/infrastructure/app-settings-repository';
import { getDashboardAlerts } from './deal-repository';

export type DashboardAlertNotificationKind = 'MISSING' | 'OVERDUE';

export interface DashboardAlertNotificationResult {
    kind: DashboardAlertNotificationKind;
    status: 'sent' | 'skipped';
    reason?: 'not_configured' | 'no_alerts';
    count: number;
    chatId?: string;
}

const ALERT_TYPES_BY_KIND: Record<DashboardAlertNotificationKind, DashboardAlertType[]> = {
    MISSING: ['NO_NEXT_ACTION', 'NO_OWNER', 'STALE_DEAL', 'SLA_EXCEEDED'],
    OVERDUE: ['OVERDUE_ACTION'],
};

function formatGeneratedAt(date: Date): string {
    return date.toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour12: false,
    });
}

function toMessageItem(
    businessUnitName: string,
    alert: DashboardAlert,
): DashboardAlertMessageItem {
    return {
        businessUnitName,
        companyName: alert.companyName,
        dealName: alert.dealName,
        ownerName: alert.ownerName,
        detail: alert.detail,
        type: alert.type as DashboardAlertMessageItem['type'],
    };
}

async function listAlertMessageItems(
    kind: DashboardAlertNotificationKind,
): Promise<DashboardAlertMessageItem[]> {
    const activeBusinessUnits = await db
        .select({
            code: businessUnits.code,
            name: businessUnits.name,
            sortOrder: businessUnits.sortOrder,
        })
        .from(businessUnits)
        .where(eq(businessUnits.isActive, true))
        .orderBy(businessUnits.sortOrder, businessUnits.name);

    const targetTypes = new Set(ALERT_TYPES_BY_KIND[kind]);
    const alertGroups = await Promise.all(
        activeBusinessUnits.map(async (businessUnit) => {
            const alerts = await getDashboardAlerts(businessUnit.code as BusinessScopeType, {
                includeTeam: true,
            });

            return alerts
                .filter((alert) => targetTypes.has(alert.type))
                .map((alert) => toMessageItem(businessUnit.name, alert));
        }),
    );

    return alertGroups.flat();
}

export async function sendDashboardAlertNotification(
    kind: DashboardAlertNotificationKind,
): Promise<DashboardAlertNotificationResult> {
    const chatId = await getDashboardAlertLarkChatId();
    if (!chatId) {
        return {
            kind,
            status: 'skipped',
            reason: 'not_configured',
            count: 0,
        };
    }

    const items = await listAlertMessageItems(kind);
    if (items.length === 0) {
        return {
            kind,
            status: 'skipped',
            reason: 'no_alerts',
            count: 0,
            chatId,
        };
    }

    const generatedAt = formatGeneratedAt(new Date());
    const message =
        kind === 'MISSING'
            ? buildDashboardLeakAlertMessage({ generatedAt, items })
            : buildDashboardOverdueAlertMessage({ generatedAt, items });

    await sendGroupMessage(chatId, message);

    return {
        kind,
        status: 'sent',
        count: items.length,
        chatId,
    };
}
