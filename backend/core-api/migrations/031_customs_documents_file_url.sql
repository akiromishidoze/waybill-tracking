-- Add file_url column to customs_documents for storing uploaded file paths
ALTER TABLE customs_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
