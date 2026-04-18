/**
 * GDX-001 – Minimal auth configuration tests.
 *
 * Run with:
 *   pnpm --filter web test
 *
 * Uses Node.js built-in test runner (node:test) via tsx – no extra framework
 * required.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
// Import from the pure helpers module – no appConfig singleton loaded, so
// this file can run without any environment variables being set.
import { buildLarkAuthUrl, checkLarkAuthEnv } from '../../server/auth/lark-helpers.js';

// ─── buildLarkAuthUrl ─────────────────────────────────────────────────────────

describe('buildLarkAuthUrl', () => {
    const CLIENT_ID = 'test_client_id';
    const REDIRECT_URI = 'https://app.example.com/api/v1/auth/lark/callback';
    const STATE = 'csrf-state-token-123';

    it('returns a URL pointing at the Lark authorize endpoint', () => {
        const url = buildLarkAuthUrl(CLIENT_ID, REDIRECT_URI, STATE);
        assert.ok(url.startsWith('https://passport.larksuite.com/suite/passport/oauth/authorize?'));
    });

    it('includes client_id in the query string', () => {
        const url = buildLarkAuthUrl(CLIENT_ID, REDIRECT_URI, STATE);
        assert.ok(url.includes(`client_id=${CLIENT_ID}`));
    });

    it('includes redirect_uri (URL-encoded) in the query string', () => {
        const url = buildLarkAuthUrl(CLIENT_ID, REDIRECT_URI, STATE);
        assert.ok(url.includes('redirect_uri='));
        // The value must encode to the correct destination.
        const parsed = new URL(url);
        assert.equal(parsed.searchParams.get('redirect_uri'), REDIRECT_URI);
    });

    it('includes the state parameter in the query string', () => {
        const url = buildLarkAuthUrl(CLIENT_ID, REDIRECT_URI, STATE);
        const parsed = new URL(url);
        assert.equal(parsed.searchParams.get('state'), STATE);
    });

    it('sets response_type=code', () => {
        const url = buildLarkAuthUrl(CLIENT_ID, REDIRECT_URI, STATE);
        const parsed = new URL(url);
        assert.equal(parsed.searchParams.get('response_type'), 'code');
    });

    it('throws when clientId is empty', () => {
        assert.throws(
            () => buildLarkAuthUrl('', REDIRECT_URI, STATE),
            /buildLarkAuthUrl/
        );
    });

    it('throws when redirectUri is empty', () => {
        assert.throws(
            () => buildLarkAuthUrl(CLIENT_ID, '', STATE),
            /buildLarkAuthUrl/
        );
    });

    it('throws when state is empty', () => {
        assert.throws(
            () => buildLarkAuthUrl(CLIENT_ID, REDIRECT_URI, ''),
            /buildLarkAuthUrl/
        );
    });
});

// ─── checkLarkAuthEnv ─────────────────────────────────────────────────────────

describe('checkLarkAuthEnv', () => {
    const valid = {
        larkClientId: 'cli_xxx',
        larkClientSecret: 'secret_yyy',
        larkRedirectUri: 'https://app.example.com/api/v1/auth/lark/callback',
    };

    it('does not throw when all values are present', () => {
        assert.doesNotThrow(() => checkLarkAuthEnv(valid));
    });

    it('throws and names the missing variable when LARK_CLIENT_ID is absent', () => {
        assert.throws(
            () => checkLarkAuthEnv({ ...valid, larkClientId: '' }),
            /LARK_CLIENT_ID/
        );
    });

    it('throws and names the missing variable when LARK_CLIENT_SECRET is absent', () => {
        assert.throws(
            () => checkLarkAuthEnv({ ...valid, larkClientSecret: '' }),
            /LARK_CLIENT_SECRET/
        );
    });

    it('throws and names the missing variable when LARK_REDIRECT_URI is absent', () => {
        assert.throws(
            () => checkLarkAuthEnv({ ...valid, larkRedirectUri: '' }),
            /LARK_REDIRECT_URI/
        );
    });

    it('throws and lists all missing variables when all three are absent', () => {
        let caught: unknown;
        try {
            checkLarkAuthEnv({ larkClientId: '', larkClientSecret: '', larkRedirectUri: '' });
        } catch (e) {
            caught = e;
        }
        assert.ok(caught instanceof Error);
        assert.ok(caught.message.includes('LARK_CLIENT_ID'));
        assert.ok(caught.message.includes('LARK_CLIENT_SECRET'));
        assert.ok(caught.message.includes('LARK_REDIRECT_URI'));
    });
});
