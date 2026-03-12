import {
    ApiSuccessResponse,
    DateRangeQuery,
    ISODateString,
    ListQuery,
    PaginationMeta,
    UUID,
} from './common';
import { BusinessScopeType } from './permissions';

export type CallResult =
    | 'CONNECTED'
    | 'NO_ANSWER'
    | 'BUSY'
    | 'VOICEMAIL'
    | 'CALLBACK_REQUESTED';

export interface CallsListQuery extends ListQuery, DateRangeQuery {
    businessScope?: BusinessScopeType;
    assignedUserId?: UUID;
    companyId?: UUID;
    contactId?: UUID;
    result?: CallResult;
}

export interface CallListItem {
    id: UUID;
    businessScope: BusinessScopeType;
    calledAt: ISODateString;
    company: {
        id: UUID;
        name: string;
    };
    contact: {
        id: UUID;
        name: string;
    } | null;
    assignedUser: {
        id: UUID;
        name: string;
    };
    result: CallResult;
    durationSec: number | null;
}

export type CallsListResponse = ApiSuccessResponse<CallListItem[], PaginationMeta>;

export interface CreateCallRequest {
    businessScope: BusinessScopeType;
    companyId: UUID;
    contactId?: UUID;
    dealId?: UUID;
    assignedUserId: UUID;
    calledAt: ISODateString;
    result: CallResult;
    durationSec?: number;
    notes?: string;
    nextAction?: string;
    nextActionDueAt?: ISODateString;
}

export type CreateCallResponse = ApiSuccessResponse<{
    id: UUID;
    businessScope: BusinessScopeType;
    result: CallResult;
    createdAt: ISODateString;
}>;

export interface CallDetail {
    id: UUID;
    businessScope: BusinessScopeType;
    calledAt: ISODateString;
    company: {
        id: UUID;
        name: string;
    };
    contact: {
        id: UUID;
        name: string;
    } | null;
    deal: {
        id: UUID;
        name: string;
    } | null;
    assignedUser: {
        id: UUID;
        name: string;
    };
    result: CallResult;
    durationSec: number | null;
    notes: string | null;
    nextAction: string | null;
    nextActionDueAt: ISODateString | null;
}

export type CallDetailResponse = ApiSuccessResponse<CallDetail>;

export interface UpdateCallRequest {
    result?: CallResult;
    notes?: string;
    nextAction?: string;
    nextActionDueAt?: ISODateString | null;
}

export type UpdateCallResponse = ApiSuccessResponse<{
    id: UUID;
    updatedAt: ISODateString;
}>;

export interface CallTasksQuery {
    businessScope?: BusinessScopeType;
    assignedUserId?: UUID;
    status?: 'open' | 'completed';
    dueBefore?: ISODateString;
}

export interface CallTaskItem {
    id: UUID;
    callId: UUID;
    companyName: string;
    contactName: string | null;
    nextAction: string;
    nextActionDueAt: ISODateString | null;
    status: 'open' | 'completed';
}

export type CallTasksResponse = ApiSuccessResponse<CallTaskItem[]>;

export interface StartCallSessionRequest {
    businessScope: BusinessScopeType;
}

export type StartCallSessionResponse = ApiSuccessResponse<{
    sessionId: UUID;
    startedAt: ISODateString;
}>;

export interface EndCallSessionRequest {
    endedAt: ISODateString;
}

export type EndCallSessionResponse = ApiSuccessResponse<{
    sessionId: UUID;
    startedAt: ISODateString;
    endedAt: ISODateString;
    totalDurationSec: number;
}>;

export type CallQueueTargetStatus = 'pending' | 'calling' | 'completed' | 'cancelled';

export interface CallQueueItem {
    id: string;
    companyId: string;
    companyName: string;
    contactId: string | null;
    contactName: string | null;
    phoneNumber: string;
    priority: number;
    targetStatus: CallQueueTargetStatus;
    scheduledAt: string | null;
    notes: string | null;
    assignedUserName: string;
    createdAt: ISODateString;
}
