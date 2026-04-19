/**
 * Lark カレンダー操作モジュール
 */

import { getTenantAccessToken, LARK_BASE_URL } from './larkClient';

export interface CreateCalendarEventParams {
    calendarId: string;     // "primary" or specific calendar ID
    summary: string;        // イベントタイトル
    description: string;    // 内容
    startTime: string;      // ISO8601形式
    endTime: string;        // ISO8601形式（デフォルト: startの1時間後）
    attendees?: string[];   // Lark User IDのリスト（任意）
}

/**
 * Larkカレンダーにイベントを作成する
 * calendarId が "primary" の場合はそのまま URL に使用する
 */
export async function createCalendarEvent(params: CreateCalendarEventParams): Promise<{ eventId: string }> {
    const token = await getTenantAccessToken();

    const body: Record<string, unknown> = {
        summary: params.summary,
        description: params.description,
        start_time: { timestamp: String(Math.floor(new Date(params.startTime).getTime() / 1000)) },
        end_time: { timestamp: String(Math.floor(new Date(params.endTime).getTime() / 1000)) },
    };

    if (params.attendees && params.attendees.length > 0) {
        body.attendee_ability = 'can_see_others';
        body.attendees = params.attendees.map((uid) => ({ type: 'user', user_id: uid }));
    }

    const url = `${LARK_BASE_URL}/open-apis/calendar/v4/calendars/${encodeURIComponent(params.calendarId)}/events`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lark createCalendarEvent failed: HTTP ${res.status} - ${text}`);
    }

    const data = await res.json() as { code: number; msg: string; data?: { event?: { event_id?: string } } };
    if (data.code !== 0) {
        throw new Error(`Lark createCalendarEvent error: ${data.msg} (code=${data.code})`);
    }

    return { eventId: data.data?.event?.event_id ?? '' };
}

/**
 * 次回アクション日時からカレンダーイベントのパラメータを生成する
 * nextActionTime が指定された場合はその JST 時刻を使用、未指定時は 10:00 JST (01:00 UTC) をデフォルトとする
 * 終了時刻は開始の 1 時間後
 */
export function buildNextActionCalendarParams(params: {
    calendarId: string;
    companyName: string;
    dealName: string;
    nextActionContent: string;
    nextActionDate: string; // YYYY-MM-DD
    nextActionTime?: string | null; // HH:MM (JST)
    assigneeName: string;
    attendeeOpenId?: string | null;
}): CreateCalendarEventParams {
    let startTime: string;
    let endTime: string;

    if (params.nextActionTime) {
        const [hStr, mStr] = params.nextActionTime.split(':');
        const jstHours = parseInt(hStr, 10);
        const jstMinutes = parseInt(mStr, 10);
        // JST → UTC: JST は UTC+9 なので 9 時間引く
        const startDate = new Date(`${params.nextActionDate}T00:00:00Z`);
        startDate.setUTCHours(jstHours - 9, jstMinutes, 0, 0);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        startTime = startDate.toISOString();
        endTime = endDate.toISOString();
    } else {
        startTime = `${params.nextActionDate}T01:00:00Z`; // 10:00 JST
        endTime = `${params.nextActionDate}T02:00:00Z`;   // 11:00 JST
    }

    const result: CreateCalendarEventParams = {
        calendarId: params.calendarId,
        summary: `【${params.companyName}】${params.nextActionContent}`,
        description: `案件名: ${params.dealName}\n担当者: ${params.assigneeName}\nG-DX System から自動作成`,
        startTime,
        endTime,
    };

    if (params.attendeeOpenId) {
        result.attendees = [params.attendeeOpenId];
    }

    return result;
}
