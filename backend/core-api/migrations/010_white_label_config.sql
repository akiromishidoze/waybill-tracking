CREATE TABLE IF NOT EXISTS white_label_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name VARCHAR(255) NOT NULL DEFAULT 'Waybill Tracking',
    logo_url VARCHAR(500),
    custom_domain VARCHAR(255),
    primary_color VARCHAR(7) NOT NULL DEFAULT '#2563eb',
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    enabled BOOLEAN NOT NULL DEFAULT false,
    portal_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure at least one row exists
INSERT INTO white_label_config (id, brand_name, primary_color, enabled, portal_url)
VALUES ('00000000-0000-0000-0000-000000000001', 'Waybill Tracking', '#2563eb', false, 'https://portal.example.com')
ON CONFLICT (id) DO NOTHING;
