import type { MeetingActivityType, MeetingCounterpartyType } from '@g-dx/contracts';

export interface MeetingListFilters {
    dateFrom?: string;
    dateTo?: string;
    ownerUserId?: string;
    activityType?: MeetingActivityType;
    counterpartyType?: MeetingCounterpartyType;
}

export interface CreateMeetingInput {
    ownerUserId: string;
    counterpartyType: MeetingCounterpartyType;
    companyId?: string | null;
    allianceId?: string | null;
    contactName?: string | null;
    contactRole?: string | null;
    meetingDate: Date;
    activityType: MeetingActivityType;
    purpose?: string | null;
    summary?: string | null;
    nextActionDate?: string | null;
    nextActionContent?: string | null;
}

export interface UpdateMeetingInput {
    ownerUserId?: string;
    counterpartyType?: MeetingCounterpartyType;
    companyId?: string | null;
    allianceId?: string | null;
    contactName?: string | null;
    contactRole?: string | null;
    meetingDate?: Date;
    activityType?: MeetingActivityType;
    purpose?: string | null;
    summary?: string | null;
    nextActionDate?: string | null;
    nextActionContent?: string | null;
    convertedDealId?: string | null;
    convertedAllianceId?: string | null;
    convertedAt?: Date | null;
}
