#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database. Press Ctrl+C to cancel."
read -r -p "Continue? [y/N] " confirm
[ "$confirm" = "y" ] || exit 0

gunzip -c "$BACKUP_FILE" | psql -h "${PGHOST:-db}" -U "${PGUSER:-keystone}" -d "${PGDATABASE:-keystone}"
echo "[$(date)] Restore complete"
