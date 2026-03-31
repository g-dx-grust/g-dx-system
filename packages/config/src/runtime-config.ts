export type AppEnv = 'local' | 'development' | 'staging' | 'production' | 'test';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppConfig {
    app: {
        env: AppEnv;
        url: string;
    };
    database: {
        url: string;
        poolMax: number;
    };
    redis: {
        url: string;
    };
    auth: {
        sessionSecret: string;
        sessionCookieName: string;
        larkClientId: string;
        larkClientSecret: string;
        larkRedirectUri: string;
    };
    queue: {
        prefix: string;
        concurrency: number;
    };
    logging: {
        level: LogLevel;
        sentryDsn: string;
    };
    featureFlags: {
        dashboardV2: boolean;
    };
}

const DEFAULT_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/gdx';
const DEFAULT_REDIS_URL = 'redis://localhost:6379';
const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_SESSION_SECRET = 'dev-session-secret-change-me';
const DEFAULT_LARK_REDIRECT_URI = `${DEFAULT_APP_URL}/api/v1/auth/lark/callback`;
const DEFAULT_SENTRY_DSN = '';

function readString(name: string, fallback = '', required = false): string {
    const value = process.env[name];
    if (typeof value !== 'string' || value.trim() === '') {
        if (required) {
            throw new Error(`[GDX Configuration Error] Missing required environment variable: ${name}`);
        }
        return fallback;
    }

    return value.trim();
}

function readNumber(name: string, fallback: number): number {
    const raw = readString(name, '');
    if (raw.length === 0) {
        return fallback;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
    const raw = readString(name, '');
    if (raw.length === 0) {
        return fallback;
    }

    return raw === '1' || raw.toLowerCase() === 'true';
}

function readEnum<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
    const raw = readString(name, fallback) as T;
    return allowed.includes(raw) ? raw : fallback;
}

function buildAppConfig(): AppConfig {
    return {
        app: {
            env: readEnum('APP_ENV', ['local', 'development', 'staging', 'production', 'test'], 'local'),
            url: readString('APP_URL', DEFAULT_APP_URL),
        },
        database: {
            url: readString('DATABASE_URL', DEFAULT_DATABASE_URL),
            poolMax: readNumber('DATABASE_POOL_MAX', 10),
        },
        redis: {
            url: readString('REDIS_URL', DEFAULT_REDIS_URL),
        },
        auth: {
            sessionSecret: readString('SESSION_SECRET', DEFAULT_SESSION_SECRET, true),
            sessionCookieName: readString('SESSION_COOKIE_NAME', 'gdx_session'),
            larkClientId: readString('LARK_CLIENT_ID', '', true),
            larkClientSecret: readString('LARK_CLIENT_SECRET', '', true),
            larkRedirectUri: readString('LARK_REDIRECT_URI', DEFAULT_LARK_REDIRECT_URI, true),
        },
        queue: {
            prefix: readString('QUEUE_PREFIX', 'gdx'),
            concurrency: readNumber('QUEUE_CONCURRENCY', 5),
        },
        logging: {
            level: readEnum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'], 'info'),
            sentryDsn: readString('SENTRY_DSN', DEFAULT_SENTRY_DSN),
        },
        featureFlags: {
            dashboardV2: readBoolean('FEATURE_ENABLE_DASHBOARD_V2', false),
        },
    };
}

let _appConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
    if (!_appConfig) {
        _appConfig = buildAppConfig();
    }
    return _appConfig;
}

/** @deprecated Use getAppConfig() instead */
export const appConfig = new Proxy({} as AppConfig, {
    get(_target, prop) {
        return getAppConfig()[prop as keyof AppConfig];
    },
});
