-- approval_requests: meeting_date を timestamp with time zone に変更し、document_url 列を追加
ALTER TABLE approval_requests
    ALTER COLUMN meeting_date TYPE timestamp with time zone
        USING meeting_date::timestamp with time zone;

ALTER TABLE approval_requests
    ADD COLUMN IF NOT EXISTS document_url text;
