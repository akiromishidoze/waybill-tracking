CREATE TABLE IF NOT EXISTS carrier_rates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id          UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    service_type        VARCHAR(50)    NOT NULL,
    origin_zone         VARCHAR(100)   NOT NULL DEFAULT '',
    destination_zone    VARCHAR(100)   NOT NULL DEFAULT '',
    weight_min_kg       NUMERIC(10,3)  NOT NULL DEFAULT 0,
    weight_max_kg       NUMERIC(10,3)  NOT NULL DEFAULT 999999,
    base_rate           NUMERIC(12,4)  NOT NULL,
    per_kg_rate         NUMERIC(12,4)  NOT NULL DEFAULT 0,
    currency            VARCHAR(10)    NOT NULL DEFAULT 'PHP',
    transit_days_min    INT            NOT NULL DEFAULT 1,
    transit_days_max    INT            NOT NULL DEFAULT 7,
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    notes               TEXT           NOT NULL DEFAULT '',
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_rates_carrier_id ON carrier_rates(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_rates_service_type ON carrier_rates(service_type);
