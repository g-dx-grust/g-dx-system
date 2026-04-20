-- JET（WATER_SAVING）スコープ用KPI項目追加
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS is_km_contact boolean NOT NULL DEFAULT false;
ALTER TABLE user_kpi_targets ADD COLUMN IF NOT EXISTS km_contact_target integer NOT NULL DEFAULT 0;
ALTER TABLE user_kpi_targets ADD COLUMN IF NOT EXISTS online_target integer NOT NULL DEFAULT 0;
