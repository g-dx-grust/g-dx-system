-- Migration 0011: user_kpi_targets に新規面会 / 新規商談の目標列を追加
-- 既存データは旧列の値を引き継ぐ

ALTER TABLE "user_kpi_targets"
    ADD COLUMN IF NOT EXISTS "new_visit_target" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "user_kpi_targets"
    ADD COLUMN IF NOT EXISTS "new_negotiation_target" INTEGER NOT NULL DEFAULT 0;

UPDATE "user_kpi_targets"
SET
    "new_visit_target" = CASE
        WHEN "new_visit_target" = 0 THEN "visit_target"
        ELSE "new_visit_target"
    END,
    "new_negotiation_target" = CASE
        WHEN "new_negotiation_target" = 0 THEN "negotiation_target"
        ELSE "new_negotiation_target"
    END;
