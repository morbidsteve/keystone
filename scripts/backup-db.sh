#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="keystone_${TIMESTAMP}.sql.gz"
KEEP_DAYS="${KEEP_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
pg_dump -h "${PGHOST:-db}" -U "${PGUSER:-keystone}" -d "${PGDATABASE:-keystone}" | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup saved: ${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

# Rotate old backups
find "$BACKUP_DIR" -name "keystone_*.sql.gz" -mtime +${KEEP_DAYS} -delete
echo "[$(date)] Cleaned backups older than ${KEEP_DAYS} days"
