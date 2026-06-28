CREATE TABLE IF NOT EXISTS erp_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    system VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    endpoint VARCHAR(500) NOT NULL,
    auth_type VARCHAR(50) NOT NULL DEFAULT 'NONE',
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    sync_direction VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
