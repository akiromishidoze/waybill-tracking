CREATE TABLE IF NOT EXISTS auto_communication_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template TEXT NOT NULL,
    send_to_shipper BOOLEAN NOT NULL DEFAULT true,
    send_to_recipient BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_communication_rules_trigger ON auto_communication_rules(trigger);
CREATE INDEX IF NOT EXISTS idx_auto_communication_rules_active ON auto_communication_rules(is_active);
