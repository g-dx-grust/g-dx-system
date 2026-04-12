/**
 * JST (Asia/Tokyo = UTC+9) 基準の日付ヘルパー
 *
 * JST は夏時間なし・常に UTC+9 なので、単純に +9h するだけで正確。
 * サーバーのロケールやタイムゾーン設定に依存しない。
 */

/** JST の「今日」を YYYY-MM-DD 文字列で返す */
export function getTokyoTodayStr(): string {
    const now = new Date();
    const jstMs = now.getTime() + 9 * 60 * 60 * 1000;
    const jst = new Date(jstMs);
    const y = jst.getUTCFullYear();
    const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jst.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * JST 基準で「今週の日曜日」を YYYY-MM-DD 文字列で返す。
 * today が日曜なら today 自身を返す (月〜日を1週間とみなす)。
 *
 * @param todayStr YYYY-MM-DD 形式の JST 今日
 */
export function getTokyoWeekEndStr(todayStr: string): string {
    const [year, month, day] = todayStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntilSunday = (7 - dayOfWeek) % 7; // 0 if already Sunday
    const sunday = new Date(Date.UTC(year, month - 1, day + daysUntilSunday));
    const y = sunday.getUTCFullYear();
    const m = String(sunday.getUTCMonth() + 1).padStart(2, '0');
    const d = String(sunday.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
