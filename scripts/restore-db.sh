#!/usr/bin/env bash
set -euo pipefail

# Restore the PostgreSQL database used by the Waybill Tracking system.
# Usage: ./scripts/restore-db.sh <backup_file>
# Environment variables:
#   PGHOST      - database host (default: localhost)
#   PGPORT      - database port (default: 5432)
#   PGUSER      - database user (default: postgres)
#   PGPASSWORD  - database password (default: postgres)
#   PGDATABASE  - database name (default: waybill)

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file>"
  echo "Example: $0 ./backups/waybill-20240101-120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: backup file not found: ${BACKUP_FILE}"
  exit 1
fi

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-waybill}"

echo "WARNING: This will overwrite the ${PGDATABASE} database on ${PGHOST}:${PGPORT}."
read -r -p "Are you sure? [y/N] " confirm

if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring ${PGDATABASE} from ${BACKUP_FILE}..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${PGPASSWORD}" psql \
    -h "${PGHOST}" \
    -p "${PGPORT}" \
    -U "${PGUSER}" \
    -d "${PGDATABASE}"
else
  PGPASSWORD="${PGPASSWORD}" psql \
    -h "${PGHOST}" \
    -p "${PGPORT}" \
    -U "${PGUSER}" \
    -d "${PGDATABASE}" \
    -f "${BACKUP_FILE}"
fi

echo "Restore complete."
