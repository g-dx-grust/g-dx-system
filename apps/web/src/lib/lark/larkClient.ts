/**
 * Lark API 共通クライアント
 * tenant_access_token の取得とキャッシュ（有効期限2時間）を管理する
 */

const LARK_BASE_URL = 'https://open.larksuite.com';

interface TokenCache {
    token: string;
    expiresAt: number; // unix ms
}

let _cache: TokenCache | null = null;

export async function getTenantAccessToken(): Promise<string> {
    const now = Date.now();
    // 5分の余裕を持って再取得
    if (_cache && _cache.expiresAt - 5 * 60 * 1000 > now) {
        return _cache.token;
    }

    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    if (!appId || !appSecret) {
        throw new Error('LARK_APP_ID or LARK_APP_SECRET is not configured');
    }

    const res = await fetch(`${LARK_BASE_URL}/open-apis/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });

    if (!res.ok) {
        throw new Error(`Failed to get tenant_access_token: HTTP ${res.status}`);
    }

    const data = await res.json() as { code: number; msg: string; tenant_access_token: string; expire: number };
    if (data.code !== 0) {
        throw new Error(`Lark auth error: ${data.msg} (code=${data.code})`);
    }

    _cache = {
        token: data.tenant_access_token,
        expiresAt: now + data.expire * 1000,
    };

    return _cache.token;
}

export { LARK_BASE_URL };
