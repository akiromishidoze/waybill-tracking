CREATE TABLE IF NOT EXISTS iot_sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id VARCHAR(100) NOT NULL UNIQUE,
    sensor_type VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_reading_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iot_sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id VARCHAR(100) NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
