-- Add COD and country fields to waybills
ALTER TABLE waybills
    ADD COLUMN IF NOT EXISTS is_cod            BOOLEAN        NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cod_amount        DECIMAL(12,2)  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS origin_country    VARCHAR(10)    NOT NULL DEFAULT 'PH',
    ADD COLUMN IF NOT EXISTS destination_country VARCHAR(10)  NOT NULL DEFAULT 'PH';

-- ─── Trigger: auto-create cod_payments row when is_cod = true ───────────────

CREATE OR REPLACE FUNCTION fn_auto_create_cod_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- On INSERT: create row if is_cod
    IF TG_OP = 'INSERT' AND NEW.is_cod = TRUE THEN
        INSERT INTO cod_payments (waybill_id, amount, currency, carrier_name, status, collected_at)
        VALUES (NEW.id, NEW.cod_amount, 'PHP', COALESCE(NEW.carrier_name, ''), 'PENDING', NOW())
        ON CONFLICT (waybill_id) DO NOTHING;

    -- On UPDATE to DELIVERED: mark existing PENDING payment as COLLECTED
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'DELIVERED' AND OLD.status <> 'DELIVERED' THEN
        UPDATE cod_payments
        SET status = 'COLLECTED', collected_at = NOW(), updated_at = NOW()
        WHERE waybill_id = NEW.id AND status = 'PENDING';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_cod_payment ON waybills;
CREATE TRIGGER trg_auto_cod_payment
    AFTER INSERT OR UPDATE OF status ON waybills
    FOR EACH ROW EXECUTE FUNCTION fn_auto_create_cod_payment();

-- ─── Trigger: auto-create customs_shipments row for cross-border waybills ────

CREATE OR REPLACE FUNCTION fn_auto_create_customs_shipment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Cross-border: origin_country differs from destination_country
    IF NEW.origin_country IS DISTINCT FROM NEW.destination_country THEN
        INSERT INTO customs_shipments (
            waybill_id, customs_status, origin_country, destination_country, updated_at
        )
        VALUES (
            NEW.id,
            'DOCUMENTS_PENDING',
            NEW.origin_country,
            NEW.destination_country,
            NOW()
        )
        ON CONFLICT (waybill_id) DO UPDATE SET
            origin_country      = EXCLUDED.origin_country,
            destination_country = EXCLUDED.destination_country,
            updated_at          = NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_customs_shipment ON waybills;
CREATE TRIGGER trg_auto_customs_shipment
    AFTER INSERT OR UPDATE OF origin_country, destination_country ON waybills
    FOR EACH ROW EXECUTE FUNCTION fn_auto_create_customs_shipment();
