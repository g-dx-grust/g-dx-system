import { NextResponse } from 'next/server';
import type { ApiErrorCode, ApiErrorDetail, ApiErrorResponse, ApiSuccessResponse } from '@g-dx/contracts';

export function successResponse<TData, TMeta = undefined>(
    data: TData,
    meta?: TMeta
): NextResponse<ApiSuccessResponse<TData, TMeta>> {
    const payload: ApiSuccessResponse<TData, TMeta> = {
        data,
        meta: (meta ?? undefined) as ApiSuccessResponse<TData, TMeta>['meta'],
    };

    return NextResponse.json(payload);
}

export function errorResponse(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: ApiErrorDetail
): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            error: {
                code,
                message,
                details,
            },
        },
        { status }
    );
}
