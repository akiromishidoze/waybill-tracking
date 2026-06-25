CREATE TABLE IF NOT EXISTS gps_locations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    courier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(6, 2),
    altitude DECIMAL(10, 2),
    speed DECIMAL(6, 2),
    heading DECIMAL(5, 2),
    battery_level DECIMAL(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_gps_locations_waybill_id ON gps_locations(waybill_id);
CREATE INDEX IF NOT EXISTS idx_gps_locations_recorded_at ON gps_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_locations_courier_id ON gps_locations(courier_id);

SELECT create_hypertable('gps_locations', 'recorded_at', if_not_exists => TRUE);
