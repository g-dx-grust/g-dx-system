CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    owner_user_id UUID NOT NULL REFERENCES users(id),

    counterparty_type TEXT NOT NULL DEFAULT 'NONE',
    company_id UUID REFERENCES companies(id),
    alliance_id UUID REFERENCES alliances(id),
    contact_name TEXT,
    contact_role TEXT,

    meeting_date TIMESTAMPTZ NOT NULL,
    activity_type TEXT NOT NULL,
    purpose TEXT,
    summary TEXT,
    next_action_date DATE,
    next_action_content TEXT,

    converted_deal_id UUID REFERENCES deals(id),
    converted_alliance_id UUID REFERENCES alliances(id),
    converted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT meetings_counterparty_check CHECK (
        (counterparty_type = 'COMPANY' AND company_id IS NOT NULL AND alliance_id IS NULL)
        OR (counterparty_type = 'ALLIANCE' AND alliance_id IS NOT NULL AND company_id IS NULL)
        OR (counterparty_type = 'NONE' AND company_id IS NULL AND alliance_id IS NULL)
    )
);

CREATE INDEX meetings_business_unit_idx ON meetings(business_unit_id);
CREATE INDEX meetings_owner_user_idx ON meetings(owner_user_id);
CREATE INDEX meetings_meeting_date_idx ON meetings(meeting_date);
CREATE INDEX meetings_company_idx ON meetings(company_id);
CREATE INDEX meetings_alliance_idx ON meetings(alliance_id);
CREATE INDEX meetings_deleted_at_idx ON meetings(deleted_at);
