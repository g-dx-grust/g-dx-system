CREATE TABLE IF NOT EXISTS "app_settings" (
    "key" text PRIMARY KEY NOT NULL,
    "value" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_by_user_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "app_settings_updated_at_idx"
    ON "app_settings" USING btree ("updated_at");
