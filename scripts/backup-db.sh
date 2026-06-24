#!/usr/bin/env bash
set -euo pipefail

# Backup the PostgreSQL database used by the Waybill Tracking system.
# Usage: ./scripts/backup-db.sh [output_dir]
# Environment variables:
#   PGHOST      - database host (default: localhost)
#   PGPORT      - database port (default: 5432)
#   PGUSER      - database user (default: postgres)
#   PGPASSWORD  - database password (default: postgres)
#   PGDATABASE  - database name (default: waybill)

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-waybill}"

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/${PGDATABASE}-${TIMESTAMP}.sql.gz"

mkdir -p "${OUTPUT_DIR}"

echo "Backing up ${PGDATABASE} from ${PGHOST}:${PGPORT} to ${BACKUP_FILE}..."

PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_FILE}"

echo "Backup complete: ${BACKUP_FILE}"
