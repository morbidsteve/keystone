#!/usr/bin/env bash
# wait-for-healthy.sh
# Polls a health endpoint until it responds 200 or timeout is reached.
# Usage: ./wait-for-healthy.sh <url> [timeout_seconds]
# Exit 0 when healthy, exit 1 on timeout.

set -euo pipefail

URL="${1:?Usage: $0 <url> [timeout_seconds]}"
TIMEOUT="${2:-60}"

echo "Waiting for ${URL} to become healthy (timeout: ${TIMEOUT}s)..."

elapsed=0
while [[ ${elapsed} -lt ${TIMEOUT} ]]; do
  if curl -sf -o /dev/null -w '' "${URL}" 2>/dev/null; then
    echo "[HEALTHY] ${URL} responded successfully after ${elapsed}s"
    exit 0
  fi

  sleep 1
  elapsed=$((elapsed + 1))

  # Print progress every 10 seconds
  if [[ $((elapsed % 10)) -eq 0 ]]; then
    echo "  ...still waiting (${elapsed}/${TIMEOUT}s)"
  fi
done

echo "[TIMEOUT] ${URL} did not respond within ${TIMEOUT}s"
exit 1
