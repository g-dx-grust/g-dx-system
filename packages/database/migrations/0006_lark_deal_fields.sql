-- Migration: Add Lark integration fields to deals table
-- lark_chat_id: Lark group chat ID for notifications
-- lark_calendar_id: Calendar ID for event creation (defaults to "primary")

ALTER TABLE "deals"
    ADD COLUMN IF NOT EXISTS "lark_chat_id" text,
    ADD COLUMN IF NOT EXISTS "lark_calendar_id" text;
