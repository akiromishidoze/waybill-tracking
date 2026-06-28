CREATE TABLE IF NOT EXISTS auto_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID REFERENCES waybills(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50),
    trigger_type VARCHAR(50) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
