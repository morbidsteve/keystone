#!/usr/bin/env bash
# update-clamav-db.sh
# Updates ClamAV virus definitions using freshclam.
# Usage: ./update-clamav-db.sh [database-directory]

set -euo pipefail

DB_DIR="${1:-/var/lib/clamav}"

echo "======================================"
echo "ClamAV Database Update"
echo "======================================"
echo "Database directory: ${DB_DIR}"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Check if freshclam is installed
if ! command -v freshclam &> /dev/null; then
  echo "[ERROR] freshclam is not installed."
  echo "Install ClamAV: apt-get install clamav clamav-daemon"
  exit 1
fi

# Ensure database directory exists
if [[ ! -d "${DB_DIR}" ]]; then
  echo "[INFO] Creating database directory: ${DB_DIR}"
  mkdir -p "${DB_DIR}"
fi

# Run freshclam to update virus definitions
echo "[INFO] Downloading latest virus definitions..."
if freshclam --datadir="${DB_DIR}" --log=/dev/stdout 2>&1; then
  echo ""
  echo "[SUCCESS] ClamAV database updated successfully."
else
  echo ""
  echo "[ERROR] ClamAV database update failed."
  echo "Check network connectivity and freshclam configuration."
  exit 1
fi

# Show database info
echo ""
echo "Database files:"
ls -lh "${DB_DIR}"/*.cvd "${DB_DIR}"/*.cld 2>/dev/null || echo "No database files found."

echo ""
echo "======================================"
echo "Update complete"
echo "======================================"
