CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SHIPPER',
    company VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE waybills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    shipper_id UUID NOT NULL REFERENCES users(id),
    shipper_name VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    dimensions VARCHAR(100),
    service_type VARCHAR(50) DEFAULT 'STANDARD',
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    estimated_delivery TIMESTAMPTZ,
    actual_delivery TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waybills_tracking_number ON waybills(tracking_number);
CREATE INDEX idx_waybills_shipper_id ON waybills(shipper_id);
CREATE INDEX idx_waybills_status ON waybills(status);
CREATE INDEX idx_waybills_created_at ON waybills(created_at DESC);

CREATE TABLE scan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT '',
    courier_id UUID REFERENCES users(id),
    courier_name VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remark TEXT
);

CREATE INDEX idx_scan_events_waybill_id ON scan_events(waybill_id);
CREATE INDEX idx_scan_events_timestamp ON scan_events(timestamp DESC);

SELECT create_hypertable('scan_events', 'timestamp', if_not_exists => TRUE);
