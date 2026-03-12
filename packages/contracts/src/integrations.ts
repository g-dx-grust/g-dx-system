import { ApiSuccessResponse, ISODateString, ListQuery, PaginationMeta, UUID } from './common';

export interface LarkSyncUsersRequest {
    mode: 'incremental' | 'full';
}

export type LarkSyncUsersResponse = ApiSuccessResponse<{
    jobId: UUID;
    status: 'queued';
}>;

export interface LarkSyncJobsQuery extends ListQuery {
    type?: 'users' | string;
    status?: 'queued' | 'running' | 'success' | 'failed';
}

export interface LarkSyncJobSummary {
    id: UUID;
    type: string;
    status: 'queued' | 'running' | 'success' | 'failed';
    startedAt: ISODateString | null;
    finishedAt: ISODateString | null;
    summary: {
        created: number;
        updated: number;
        failed: number;
    };
}

export type LarkSyncJobsResponse = ApiSuccessResponse<LarkSyncJobSummary[], PaginationMeta>;

export interface LarkSyncJobDetail {
    id: UUID;
    type: string;
    status: 'queued' | 'running' | 'success' | 'failed';
    startedAt: ISODateString | null;
    finishedAt: ISODateString | null;
    logs: Array<{
        level: 'info' | 'warn' | 'error';
        message: string;
    }>;
}

export type LarkSyncJobDetailResponse = ApiSuccessResponse<LarkSyncJobDetail>;

export interface LarkUserWebhookRequest {
    eventId: string;
    type: 'user.updated' | 'user.created' | 'user.deleted' | string;
    payload: Record<string, unknown>;
}

export type LarkUserWebhookResponse = ApiSuccessResponse<{
    accepted: boolean;
}>;

export type LarkConnectionStatusResponse = ApiSuccessResponse<{
    oauthConfigured: boolean;
    webhookConfigured: boolean;
    lastUserSyncAt: ISODateString | null;
    lastSyncStatus: 'queued' | 'running' | 'success' | 'failed' | null;
}>;
