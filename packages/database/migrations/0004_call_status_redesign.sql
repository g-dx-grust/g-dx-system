-- Step 1: Add next_call_datetime column to call_logs
ALTER TABLE "call_logs" ADD COLUMN "next_call_datetime" timestamp with time zone;

-- Step 2: Set default for started_at to NOW() for future inserts
ALTER TABLE "call_logs" ALTER COLUMN "started_at" SET DEFAULT now();

-- Step 3: Migrate old result_code values to new 7-status system
UPDATE "call_logs" SET "result_code" = CASE "result_code"
    -- Old 5 TypeScript values
    WHEN 'CONNECTED' THEN 'key_person_handled'
    WHEN 'NO_ANSWER' THEN 'unreachable'
    WHEN 'BUSY' THEN 'unreachable'
    WHEN 'VOICEMAIL' THEN 'unreachable'
    WHEN 'CALLBACK_REQUESTED' THEN 'receptionist_handled'
    -- Old 17 CSV values
    WHEN 'connected_appointment' THEN 'appointment_secured'
    WHEN 'connected_callback_request' THEN 'key_person_handled'
    WHEN 'connected_send_material' THEN 'material_sent'
    WHEN 'connected_not_interested' THEN 'key_person_rejected'
    WHEN 'connected_wrong_person' THEN 'key_person_handled'
    WHEN 'receptionist_transfer_refused' THEN 'receptionist_rejected'
    WHEN 'receptionist_absent' THEN 'receptionist_handled'
    WHEN 'receptionist_callback_accepted' THEN 'receptionist_handled'
    WHEN 'receptionist_no_such_person' THEN 'receptionist_rejected'
    WHEN 'no_answer' THEN 'unreachable'
    WHEN 'busy' THEN 'unreachable'
    WHEN 'disconnected' THEN 'unreachable'
    WHEN 'fax' THEN 'unreachable'
    WHEN 'closed_business' THEN 'unreachable'
    WHEN 'do_not_call' THEN 'unreachable'
    WHEN 'wrong_number' THEN 'unreachable'
    WHEN 'other' THEN 'unreachable'
    ELSE "result_code"
END
WHERE "result_code" NOT IN (
    'unreachable', 'receptionist_handled', 'receptionist_rejected',
    'key_person_handled', 'key_person_rejected', 'appointment_secured', 'material_sent'
);
