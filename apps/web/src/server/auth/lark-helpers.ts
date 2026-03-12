/**
 * Pure, side-effect-free helpers for Lark OAuth.
 *
 * This file intentionally imports nothing from @g-dx/config so that it can be
 * imported by unit tests without requiring environment variables to be set.
 */

const LARK_AUTHORIZE_BASE_URL = 'https://passport.larksuite.com/suite/passport/oauth/authorize';

/**
 * Builds a Lark OAuth authorization URL from explicit parameters.
 * Pure function – safe to call in tests and server code alike.
 */
export function buildLarkAuthUrl(clientId: string, redirectUri: string, state: string): string {
    if (!clientId || !redirectUri || !state) {
        throw new Error('[GDX Auth] buildLarkAuthUrl: clientId, redirectUri, and state are all required');
    }
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state,
    });
    return `${LARK_AUTHORIZE_BASE_URL}?${params.toString()}`;
}

/**
 * Validates that the three Lark OAuth env-var values are all non-empty.
 * Pure function – accepts explicit values so it can be tested without a
 * running appConfig singleton.
 */
export function checkLarkAuthEnv(env: {
    larkClientId: string;
    larkClientSecret: string;
    larkRedirectUri: string;
}): void {
    const missing: string[] = [];
    if (!env.larkClientId) missing.push('LARK_CLIENT_ID');
    if (!env.larkClientSecret) missing.push('LARK_CLIENT_SECRET');
    if (!env.larkRedirectUri) missing.push('LARK_REDIRECT_URI');
    if (missing.length > 0) {
        throw new Error(
            `[GDX Auth] Missing required environment variables: ${missing.join(', ')}`
        );
    }
}
