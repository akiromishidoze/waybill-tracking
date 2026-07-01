DROP INDEX IF EXISTS idx_scan_events_event_type;
ALTER TABLE scan_events DROP COLUMN IF EXISTS event_type;
