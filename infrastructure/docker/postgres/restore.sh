#!/bin/sh
set -e

BACKUP_FILE="$1"
DB_NAME="${POSTGRES_DB:-waybill}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>"
  exit 1
fi

echo "[restore] restoring ${DB_NAME} from ${BACKUP_FILE}"
if [ "${FORCE_RESTORE:-false}" != "true" ]; then
  echo "[restore] this will drop and recreate ${DB_NAME}. Set FORCE_RESTORE=true to proceed."
  exit 1
fi

PGPASSWORD="${POSTGRES_PASSWORD}" gunzip -c "$BACKUP_FILE" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d postgres

echo "[restore] ${DB_NAME} restored from ${BACKUP_FILE}"
