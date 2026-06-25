CREATE TABLE IF NOT EXISTS app_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL DEFAULT 'WaybillTrack',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Manila',
    session_timeout INTEGER NOT NULL DEFAULT 60,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    default_service_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    logo_url VARCHAR(500) NOT NULL DEFAULT '',
    dwell_threshold_minutes INTEGER NOT NULL DEFAULT 1440,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (id, company_name, timezone, session_timeout, email_notifications, default_service_type, logo_url, dwell_threshold_minutes)
VALUES ('00000000-0000-0000-0000-000000000002', 'WaybillTrack', 'Asia/Manila', 60, TRUE, 'STANDARD', '', 1440)
ON CONFLICT (id) DO NOTHING;
