CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'RETURN_REQUESTED',
    reason TEXT NOT NULL,
    carrier VARCHAR(255),
    notes TEXT,
    return_tracking_number VARCHAR(100),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT returns_waybill_unique UNIQUE (waybill_id)
);

CREATE INDEX IF NOT EXISTS idx_returns_waybill_id ON returns(waybill_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
