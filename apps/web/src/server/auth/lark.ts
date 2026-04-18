import { appConfig } from '@g-dx/config';
import { buildLarkAuthUrl, checkLarkAuthEnv } from './lark-helpers';

// Re-export pure helpers so callers can import from a single location.
export { buildLarkAuthUrl, checkLarkAuthEnv } from './lark-helpers';

export const OAUTH_STATE_COOKIE_NAME = 'gdx_oauth_state';
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60; // 10 minutes

/**
 * Convenience wrapper that reads Lark credentials from appConfig.
 * Use buildLarkAuthUrl (from lark-helpers) in tests.
 */
export function getLarkAuthUrl(state: string): string {
    const { larkClientId, larkRedirectUri } = appConfig.auth;
    return buildLarkAuthUrl(larkClientId, larkRedirectUri, state);
}

/**
 * Asserts that the running process has all required Lark OAuth env vars.
 * Throws with an actionable message listing the missing variable names.
 */
export function assertLarkAuthConfigured(): void {
    checkLarkAuthEnv(appConfig.auth);
}
