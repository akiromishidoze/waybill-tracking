CREATE TABLE IF NOT EXISTS bi_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    endpoint VARCHAR(500),
    api_key VARCHAR(500),
    datasets TEXT[] NOT NULL DEFAULT '{}',
    refresh_interval INT NOT NULL DEFAULT 60,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_integrations_platform ON bi_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_bi_integrations_status ON bi_integrations(status);
