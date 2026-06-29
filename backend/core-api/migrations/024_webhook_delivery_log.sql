CREATE TABLE webhook_delivery_log (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id   UUID        NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event        TEXT        NOT NULL,
    waybill_id   TEXT        NOT NULL DEFAULT '',
    payload      JSONB       NOT NULL DEFAULT '{}',
    status       TEXT        NOT NULL DEFAULT 'pending',  -- pending | success | failed | dead
    attempt      INT         NOT NULL DEFAULT 0,
    max_attempts INT         NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ,
    last_error   TEXT,
    response_status INT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wdl_webhook_id  ON webhook_delivery_log(webhook_id);
CREATE INDEX idx_wdl_status      ON webhook_delivery_log(status);
CREATE INDEX idx_wdl_next_retry  ON webhook_delivery_log(next_retry_at) WHERE status = 'pending';
