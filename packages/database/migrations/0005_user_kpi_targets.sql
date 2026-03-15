CREATE TABLE "user_kpi_targets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id"),
    "business_unit_id" uuid NOT NULL REFERENCES "business_units"("id"),
    "target_month" text NOT NULL,
    "call_target" integer DEFAULT 0 NOT NULL,
    "visit_target" integer DEFAULT 0 NOT NULL,
    "appointment_target" integer DEFAULT 0 NOT NULL,
    "negotiation_target" integer DEFAULT 0 NOT NULL,
    "contract_target" integer DEFAULT 0 NOT NULL,
    "revenue_target" numeric(18, 2) DEFAULT '0' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "user_kpi_targets_user_id_business_unit_id_target_month_unique"
        UNIQUE ("user_id", "business_unit_id", "target_month")
);
