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
    | 'unreachable'
    | 'receptionist_handled'
    | 'receptionist_rejected'
    | 'key_person_handled'
    | 'key_person_rejected'
    | 'appointment_secured'
    | 'material_sent';

export const CALL_RESULT_OPTIONS: { value: CallResult; label: string }[] = [
    { value: 'unreachable', label: '不通' },
    { value: 'receptionist_handled', label: '代理対応' },
    { value: 'receptionist_rejected', label: '代理拒否' },
    { value: 'key_person_handled', label: 'KM対応' },
    { value: 'key_person_rejected', label: 'KM拒否' },
    { value: 'appointment_secured', label: 'アポ獲得' },
    { value: 'material_sent', label: '資料送付' },
];

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
    unreachable: '不通',
    receptionist_handled: '代理対応',
    receptionist_rejected: '代理拒否',
    key_person_handled: 'KM対応',
    key_person_rejected: 'KM拒否',
    appointment_secured: 'アポ獲得',
    material_sent: '資料送付',
};

export const CALL_RESULT_STYLES: Record<CallResult, string> = {
    unreachable: 'bg-gray-200 text-gray-700',
    receptionist_handled: 'bg-blue-100 text-blue-700',
    receptionist_rejected: 'bg-red-100 text-red-700',
    key_person_handled: 'bg-indigo-100 text-indigo-700',
    key_person_rejected: 'bg-orange-100 text-orange-700',
    appointment_secured: 'bg-green-100 text-green-800',
    material_sent: 'bg-emerald-100 text-emerald-700',
};

export const QUICK_COMPLETE_STATUSES: CallResult[] = [
    'unreachable',
    'receptionist_rejected',
    'key_person_rejected',
];

export const NEXT_CALL_DATETIME_STATUSES: CallResult[] = [
    'receptionist_handled',
    'key_person_handled',
    'material_sent',
];

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
    summary: string | null;
}

export type CallsListResponse = ApiSuccessResponse<CallListItem[], PaginationMeta>;

export interface CreateCallRequest {
    businessScope: BusinessScopeType;
    companyId: UUID;
    contactId?: UUID;
    dealId?: UUID;
    assignedUserId: UUID;
    result: CallResult;
    notes?: string;
    nextCallDatetime?: ISODateString;
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
    nextCallDatetime: ISODateString | null;
}

export type CallDetailResponse = ApiSuccessResponse<CallDetail>;

export interface UpdateCallRequest {
    result?: CallResult;
    notes?: string;
    nextCallDatetime?: ISODateString | null;
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
