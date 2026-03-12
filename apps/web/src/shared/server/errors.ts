import type { ApiErrorCode } from '@g-dx/contracts';

export class AppError extends Error {
    readonly code: ApiErrorCode;
    readonly details?: Record<string, unknown>;

    constructor(code: ApiErrorCode, message?: string, details?: Record<string, unknown>) {
        super(message ?? code);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
    }
}

export function isAppError(error: unknown, code?: ApiErrorCode): error is AppError {
    if (!(error instanceof AppError)) {
        return false;
    }

    return code ? error.code === code : true;
}
