#!/bin/sh
set -e

BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
DB_NAME="${POSTGRES_DB:-waybill}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/waybill-${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[backup] starting backup of ${DB_NAME} at ${TIMESTAMP}"
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --create \
  --verbose | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[backup] created ${BACKUP_FILE}"
else
  echo "[backup] pg_dump failed" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

echo "[backup] pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name 'waybill-*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "[backup] remaining backups:"
ls -1 "${BACKUP_DIR}"
