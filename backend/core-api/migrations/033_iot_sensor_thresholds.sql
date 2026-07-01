CREATE TABLE IF NOT EXISTS iot_sensor_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id VARCHAR(100) NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    action_type VARCHAR(20) NOT NULL DEFAULT 'ESCALATION',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sensor FOREIGN KEY (sensor_id) REFERENCES iot_sensors(sensor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_iot_sensor_thresholds_sensor ON iot_sensor_thresholds(sensor_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_thresholds_active ON iot_sensor_thresholds(is_active);
