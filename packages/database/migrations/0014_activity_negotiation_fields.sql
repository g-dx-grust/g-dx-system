ALTER TABLE deal_activities
    ADD COLUMN is_negotiation BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE deal_activities
    ADD COLUMN negotiation_outcome TEXT;

ALTER TABLE deal_activities
    ADD COLUMN competitor_info TEXT;
