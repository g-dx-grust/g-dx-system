import type { AllianceReferralType, AllianceStatus, AllianceType } from '@g-dx/contracts';

export interface AllianceListFilters {
    keyword?: string;
    relationshipStatus?: AllianceStatus;
}

export interface CreateAllianceInput {
    name: string;
    allianceType: AllianceType;
    contactPersonName?: string;
    contactPersonRole?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
    agreementSummary?: string;
    relationshipStatus?: AllianceStatus;
    notes?: string;
}

export interface UpdateAllianceInput {
    name?: string;
    allianceType?: AllianceType;
    contactPersonName?: string | null;
    contactPersonRole?: string | null;
    contactPersonEmail?: string | null;
    contactPersonPhone?: string | null;
    agreementSummary?: string | null;
    relationshipStatus?: AllianceStatus;
    notes?: string | null;
}

export interface LinkDealInput {
    allianceId: string;
    dealId: string;
    referralType: AllianceReferralType;
    note?: string;
}
