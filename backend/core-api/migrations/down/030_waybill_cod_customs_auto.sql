DROP TRIGGER IF EXISTS trg_auto_customs_shipment ON waybills;
DROP FUNCTION IF EXISTS fn_auto_create_customs_shipment();
DROP TRIGGER IF EXISTS trg_auto_cod_payment ON waybills;
DROP FUNCTION IF EXISTS fn_auto_create_cod_payment();

ALTER TABLE waybills
    DROP COLUMN IF EXISTS destination_country,
    DROP COLUMN IF EXISTS origin_country,
    DROP COLUMN IF EXISTS cod_amount,
    DROP COLUMN IF EXISTS is_cod;
