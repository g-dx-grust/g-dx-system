/**
 * Lark メッセージ送信モジュール
 */

import { getTenantAccessToken, LARK_BASE_URL } from './larkClient';

/**
 * グループチャットにテキストメッセージを送信する
 */
export async function sendGroupMessage(chatId: string, text: string): Promise<void> {
    const token = await getTenantAccessToken();

    const res = await fetch(
        `${LARK_BASE_URL}/open-apis/im/v1/messages?receive_id_type=chat_id`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                receive_id: chatId,
                msg_type: 'text',
                content: JSON.stringify({ text }),
            }),
        }
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Lark sendGroupMessage failed: HTTP ${res.status} - ${body}`);
    }

    const data = await res.json() as { code: number; msg: string };
    if (data.code !== 0) {
        throw new Error(`Lark sendGroupMessage error: ${data.msg} (code=${data.code})`);
    }
}

// ─── 通知メッセージ生成 ────────────────────────────────────────────────────────

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
        '📋 活動ログが記録されました',
        '━━━━━━━━━━━━━━',
        `案件名: ${p.dealName}`,
        `種別: ${typeLabel[p.activityType] ?? p.activityType}`,
        `日付: ${p.activityDate}`,
        `内容: ${p.content ?? '（記入なし）'}`,
        `担当者: ${p.assigneeName}`,
        '━━━━━━━━━━━━━━',
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
        '🔄 案件ステータスが更新されました',
        '━━━━━━━━━━━━━━',
        `案件名: ${p.dealName}`,
        `変更内容: ${p.oldStage} → ${p.newStage}`,
        `担当者: ${p.assigneeName}`,
        `更新日時: ${p.updatedAt}`,
        '━━━━━━━━━━━━━━',
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
        `案件名：${p.dealName}_${p.approvalTypeLabel}`,
        `商談日：${p.meetingDateTime ?? '（未入力）'}`,
        'G-DXシステムを確認してください。',
        `資料リンク：${p.documentUrl ?? '（なし）'}`,
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
        '⏰ 【本日のアクション予定】',
        '━━━━━━━━━━━━━━',
        `案件名: ${p.dealName}`,
        `会社名: ${p.companyName}`,
        `本日のアクション: ${p.nextActionContent ?? '（未設定）'}`,
        `担当者: ${p.assigneeName}`,
        '━━━━━━━━━━━━━━',
    ].join('\n');
}
