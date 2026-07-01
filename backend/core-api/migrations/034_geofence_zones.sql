CREATE TABLE IF NOT EXISTS geofence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(20) NOT NULL,
    center_lat DECIMAL(10,8),
    center_lon DECIMAL(11,8),
    radius_meters DECIMAL(10,2),
    polygon_coords JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geofence_zones_id ON geofence_zones(zone_id);
CREATE INDEX IF NOT EXISTS idx_geofence_zones_active ON geofence_zones(is_active);
