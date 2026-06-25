CREATE TABLE IF NOT EXISTS driver_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_name VARCHAR(255) NOT NULL,
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    recipient_name VARCHAR(255) NOT NULL DEFAULT '',
    recipient_address TEXT NOT NULL DEFAULT '',
    recipient_phone VARCHAR(50) NOT NULL DEFAULT '',
    origin VARCHAR(255) NOT NULL DEFAULT '',
    destination VARCHAR(255) NOT NULL DEFAULT '',
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver_id ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_waybill_id ON driver_assignments(waybill_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_status ON driver_assignments(status);

CREATE TABLE IF NOT EXISTS driver_scan_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_name VARCHAR(255) NOT NULL,
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) NOT NULL,
    scan_type VARCHAR(20) NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT '',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    photo_url TEXT,
    signature TEXT,
    remark TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_scan_events_driver_id ON driver_scan_events(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_scan_events_waybill_id ON driver_scan_events(waybill_id);
