/**
 * Lark message utilities.
 */

import { getTenantAccessToken, LARK_BASE_URL } from './larkClient';

export async function sendGroupMessage(chatId: string, text: string): Promise<void> {
    const token = await getTenantAccessToken();

    const res = await fetch(
        `${LARK_BASE_URL}/open-apis/im/v1/messages?receive_id_type=chat_id`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                receive_id: chatId,
                msg_type: 'text',
                content: JSON.stringify({ text }),
            }),
        },
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Lark sendGroupMessage failed: HTTP ${res.status} - ${body}`);
    }

    const data = (await res.json()) as { code: number; msg: string };
    if (data.code !== 0) {
        throw new Error(`Lark sendGroupMessage error: ${data.msg} (code=${data.code})`);
    }
}

export interface ActivityNotificationParams {
    dealName: string;
    activityType: string;
    activityDate: string;
    content: string | null;
    assigneeName: string;
}

export function buildActivityMessage(p: ActivityNotificationParams): string {
    const typeLabel: Record<string, string> = {
        VISIT: '訪問',
        ONLINE: 'オンライン',
        CALL: '電話',
        EMAIL: 'メール',
        OTHER: 'その他',
    };

    return [
        '【商談】活動ログが登録されました',
        '------------------------------',
        `商談: ${p.dealName}`,
        `種別: ${typeLabel[p.activityType] ?? p.activityType}`,
        `日付: ${p.activityDate}`,
        `内容: ${p.content ?? '未記入'}`,
        `担当: ${p.assigneeName}`,
        '------------------------------',
    ].join('\n');
}

export interface StageChangeNotificationParams {
    dealName: string;
    oldStage: string;
    newStage: string;
    assigneeName: string;
    updatedAt: string;
}

export function buildStageChangeMessage(p: StageChangeNotificationParams): string {
    return [
        '【商談】ステージが更新されました',
        '------------------------------',
        `商談: ${p.dealName}`,
        `変更: ${p.oldStage} -> ${p.newStage}`,
        `担当: ${p.assigneeName}`,
        `更新日時: ${p.updatedAt}`,
        '------------------------------',
    ].join('\n');
}

export interface ApprovalRequestNotificationParams {
    dealName: string;
    approvalTypeLabel: string;
    meetingDateTime: string | null;
    documentUrl: string | null;
}

export function buildApprovalRequestMessage(p: ApprovalRequestNotificationParams): string {
    return [
        `商談名: ${p.dealName}_${p.approvalTypeLabel}`,
        `商談日時: ${p.meetingDateTime ?? '未入力'}`,
        'G-DXシステムで確認してください。',
        `資料リンク: ${p.documentUrl ?? 'なし'}`,
    ].join('\n');
}

export interface DailyAlertParams {
    dealName: string;
    companyName: string;
    nextActionContent: string | null;
    assigneeName: string;
}

export function buildDailyAlertMessage(p: DailyAlertParams): string {
    return [
        '【本日のアクション予定】',
        '------------------------------',
        `商談: ${p.dealName}`,
        `会社: ${p.companyName}`,
        `本日のアクション: ${p.nextActionContent ?? '未設定'}`,
        `担当: ${p.assigneeName}`,
        '------------------------------',
    ].join('\n');
}

export interface DashboardAlertMessageItem {
    businessUnitName: string;
    companyName: string;
    dealName: string;
    ownerName: string | null;
    detail: string;
    type: 'NO_NEXT_ACTION' | 'NO_OWNER' | 'STALE_DEAL' | 'SLA_EXCEEDED' | 'OVERDUE_ACTION';
}

export interface DashboardAlertMessageParams {
    generatedAt: string;
    items: DashboardAlertMessageItem[];
}

const DASHBOARD_ALERT_TYPE_LABELS: Record<DashboardAlertMessageItem['type'], string> = {
    NO_NEXT_ACTION: '次回アクション未設定',
    NO_OWNER: '担当者未設定',
    STALE_DEAL: '長期停滞',
    SLA_EXCEEDED: 'SLA超過',
    OVERDUE_ACTION: '期限超過',
};

function buildDashboardAlertLines(items: DashboardAlertMessageItem[]): string[] {
    return items.flatMap((item, index) => [
        `${index + 1}. [${item.businessUnitName}] ${item.companyName} / ${item.dealName}`,
        `   担当: ${item.ownerName ?? '未設定'}`,
        `   ${DASHBOARD_ALERT_TYPE_LABELS[item.type]}: ${item.detail}`,
    ]);
}

export function buildDashboardLeakAlertMessage(p: DashboardAlertMessageParams): string {
    return [
        '【商談ダッシュボード】漏れ検知アラート',
        `送信時刻: ${p.generatedAt}`,
        `対象件数: ${p.items.length}件`,
        '',
        ...buildDashboardAlertLines(p.items),
    ].join('\n');
}

export function buildDashboardOverdueAlertMessage(p: DashboardAlertMessageParams): string {
    return [
        '【商談ダッシュボード】次回アクション期限超過',
        `送信時刻: ${p.generatedAt}`,
        `対象件数: ${p.items.length}件`,
        '',
        ...buildDashboardAlertLines(p.items),
    ].join('\n');
}

export interface CombinedLeakAlertParams {
    generatedAt: string;
    noNextActionItems: DashboardAlertMessageItem[];
    overdueItems: DashboardAlertMessageItem[];
}

export function buildCombinedLeakAlertMessage(p: CombinedLeakAlertParams): string {
    const totalCount = p.noNextActionItems.length + p.overdueItems.length;
    const lines: string[] = [
        '【漏れ検知アラート】',
        `送信時刻: ${p.generatedAt}`,
        `対象件数: ${totalCount}件`,
    ];

    if (p.noNextActionItems.length > 0) {
        lines.push('');
        lines.push(`[次回アクション未設定] ${p.noNextActionItems.length}件`);
        lines.push('------------------------------');
        p.noNextActionItems.forEach((item, i) => {
            lines.push(`${i + 1}. ${item.dealName} (${item.companyName})`);
            lines.push(`   担当: ${item.ownerName ?? '未設定'}`);
        });
    }

    if (p.overdueItems.length > 0) {
        lines.push('');
        lines.push(`[次回アクション期限超過] ${p.overdueItems.length}件`);
        lines.push('------------------------------');
        p.overdueItems.forEach((item, i) => {
            lines.push(`${i + 1}. ${item.dealName} (${item.companyName})`);
            lines.push(`   担当: ${item.ownerName ?? '未設定'}  ${item.detail}`);
        });
    }

    return lines.join('\n');
}
