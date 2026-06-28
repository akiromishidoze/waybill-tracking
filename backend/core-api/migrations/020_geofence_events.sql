CREATE TABLE IF NOT EXISTS geofence_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) NOT NULL,
    geofence_id VARCHAR(100) NOT NULL,
    geofence_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
