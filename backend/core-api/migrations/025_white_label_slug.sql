ALTER TABLE white_label_config
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Backfill: derive slug from brand_name (lowercase, replace spaces with hyphens, strip non-alphanumeric)
UPDATE white_label_config
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(brand_name, '[^a-zA-Z0-9 ]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Ensure slug is not null going forward
ALTER TABLE white_label_config
    ALTER COLUMN slug SET NOT NULL,
    ALTER COLUMN slug SET DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_wl_config_slug ON white_label_config(slug);
