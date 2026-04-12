// ダッシュボード系: 明示的なキャッシュ削除（server-actions）があるため5分で安全
export const DASHBOARD_DATA_REVALIDATE_SECONDS = 300;

// ヘッダー通知バッジ: ユーザーが既読にした瞬間に削除されるが、他ユーザーからの新着は30秒待つ
export const HEADER_BADGE_REVALIDATE_SECONDS = 30;
