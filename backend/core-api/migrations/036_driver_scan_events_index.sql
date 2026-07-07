CREATE INDEX IF NOT EXISTS idx_driver_scan_events_waybill_scan ON driver_scan_events(waybill_id, scan_type);
