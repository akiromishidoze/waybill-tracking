CREATE TABLE IF NOT EXISTS customs_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    customs_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REQUIRED',
    origin_country VARCHAR(100) NOT NULL DEFAULT 'PH',
    destination_country VARCHAR(100) NOT NULL DEFAULT 'PH',
    estimated_clearance TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customs_shipments_waybill_unique UNIQUE (waybill_id)
);

CREATE INDEX IF NOT EXISTS idx_customs_shipments_waybill_id ON customs_shipments(waybill_id);
CREATE INDEX IF NOT EXISTS idx_customs_shipments_status ON customs_shipments(customs_status);

CREATE TABLE IF NOT EXISTS customs_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    file_name VARCHAR(255) NOT NULL DEFAULT '',
    file_size INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customs_documents_waybill_id ON customs_documents(waybill_id);

CREATE TABLE IF NOT EXISTS cod_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount - fee) STORED,
    currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
    carrier_name VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'COLLECTED',
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    dispute_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cod_payments_waybill_unique UNIQUE (waybill_id)
);

CREATE INDEX IF NOT EXISTS idx_cod_payments_status ON cod_payments(status);
CREATE INDEX IF NOT EXISTS idx_cod_payments_waybill_id ON cod_payments(waybill_id);
