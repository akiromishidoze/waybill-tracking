CREATE TABLE IF NOT EXISTS ecommerce_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(100) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    store_url VARCHAR(500),
    webhook_url VARCHAR(500),
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    connected BOOLEAN NOT NULL DEFAULT false,
    total_orders INTEGER NOT NULL DEFAULT 0,
    synced_orders INTEGER NOT NULL DEFAULT 0,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_platforms_connected ON ecommerce_platforms(connected);

CREATE TABLE IF NOT EXISTS ecommerce_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES ecommerce_platforms(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    orders_synced INTEGER NOT NULL DEFAULT 0,
    errors_count INTEGER NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_sync_logs_platform_id ON ecommerce_sync_logs(platform_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_sync_logs_synced_at ON ecommerce_sync_logs(synced_at DESC);
