DROP INDEX IF EXISTS idx_wl_config_slug;
ALTER TABLE white_label_config
    ALTER COLUMN slug DROP NOT NULL,
    ALTER COLUMN slug DROP DEFAULT;
ALTER TABLE white_label_config DROP COLUMN IF EXISTS slug;
