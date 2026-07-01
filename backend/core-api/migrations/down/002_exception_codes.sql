ALTER TABLE scan_events
    DROP COLUMN IF EXISTS exception_code,
    DROP COLUMN IF EXISTS exception_detail,
    DROP COLUMN IF EXISTS resolved_at;

DROP TABLE IF EXISTS exception_codes;
