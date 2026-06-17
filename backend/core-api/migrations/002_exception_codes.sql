CREATE TABLE exception_codes (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO exception_codes (code, label, description) VALUES
    ('DELAY', 'Delivery Delayed', 'Shipment delayed beyond estimated delivery date'),
    ('DAMAGE', 'Package Damaged', 'Package found damaged during transit or delivery'),
    ('WRONG_ADDRESS', 'Wrong Address', 'Recipient address is incorrect or incomplete'),
    ('CUSTOMER_NOT_AVAILABLE', 'Customer Not Available', 'Recipient not present at delivery location'),
    ('ADDRESS_NOT_FOUND', 'Address Not Found', 'Delivery address could not be located'),
    ('REFUSED', 'Refused by Recipient', 'Recipient refused to accept the package'),
    ('LOST', 'Lost in Transit', 'Package missing and cannot be located'),
    ('WEATHER_DELAY', 'Weather Delay', 'Delay caused by adverse weather conditions'),
    ('CUSTOMS_HOLD', 'Customs Hold', 'Package held by customs for inspection or documentation'),
    ('INSUFFICIENT_ADDRESS', 'Insufficient Address', 'Address details insufficient for delivery'),
    ('NO_RESPONSE', 'No Response', 'No response at delivery location after multiple attempts'),
    ('WRONG_PACKAGE', 'Wrong Package', 'Incorrect package delivered to recipient'),
    ('OTHER', 'Other Exception', 'Other exception not covered by specific codes');

ALTER TABLE scan_events
    ADD COLUMN IF NOT EXISTS exception_code VARCHAR(50) REFERENCES exception_codes(code),
    ADD COLUMN IF NOT EXISTS exception_detail TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
