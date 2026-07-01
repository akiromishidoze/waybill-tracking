ALTER TABLE users DROP COLUMN IF EXISTS password_changed_at;
DROP TABLE IF EXISTS password_reset_tokens;
