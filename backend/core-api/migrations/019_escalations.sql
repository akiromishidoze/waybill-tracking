CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) NOT NULL,
    escalation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
