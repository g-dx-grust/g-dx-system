-- アライアンス管理テーブル

CREATE TABLE alliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    name TEXT NOT NULL,
    alliance_type TEXT NOT NULL DEFAULT 'COMPANY',
    contact_person_name TEXT,
    contact_person_role TEXT,
    contact_person_email TEXT,
    contact_person_phone TEXT,
    agreement_summary TEXT,
    relationship_status TEXT NOT NULL DEFAULT 'PROSPECT',
    notes TEXT,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX alliances_business_unit_idx ON alliances(business_unit_id);
CREATE INDEX alliances_status_idx ON alliances(relationship_status);

CREATE TABLE alliance_deal_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id UUID NOT NULL REFERENCES alliances(id),
    deal_id UUID NOT NULL REFERENCES deals(id),
    referral_type TEXT NOT NULL DEFAULT 'INTRODUCER',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(alliance_id, deal_id)
);

CREATE INDEX alliance_deal_links_alliance_idx ON alliance_deal_links(alliance_id);
CREATE INDEX alliance_deal_links_deal_idx ON alliance_deal_links(deal_id);
