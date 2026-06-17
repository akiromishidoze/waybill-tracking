ALTER TABLE scan_events
    ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) NOT NULL DEFAULT 'SCAN';

UPDATE scan_events SET event_type = 'MILESTONE'
WHERE status IN ('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'CANCELLED');

UPDATE scan_events SET event_type = 'EXCEPTION'
WHERE exception_code IS NOT NULL OR status = 'FAILED_DELIVERY';

CREATE INDEX IF NOT EXISTS idx_scan_events_event_type ON scan_events(event_type);
