#!/usr/bin/env bash
# check-no-root.sh
# Validates that no running containers execute as root.
# Usage: ./check-no-root.sh [docker-compose-file]
# Exit 1 if any container runs as root/UID 0/empty user.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="${1:-docker-compose.yml}"
FAILURES=0

echo "======================================"
echo "Non-Root Container Check"
echo "======================================"
echo "Compose file: ${COMPOSE_FILE}"
echo ""

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo -e "${RED}[ERROR]${NC} Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

# Get running container IDs from the compose project
CONTAINER_IDS=$(docker compose -f "${COMPOSE_FILE}" ps -q 2>/dev/null || true)

if [[ -z "${CONTAINER_IDS}" ]]; then
  echo -e "${YELLOW}[WARN]${NC} No running containers found for compose file: ${COMPOSE_FILE}"
  echo "Ensure containers are running before checking."
  exit 1
fi

while IFS= read -r container_id; do
  if [[ -z "${container_id}" ]]; then
    continue
  fi

  # Get container name
  container_name=$(docker inspect --format '{{.Name}}' "${container_id}" 2>/dev/null | sed 's/^\///')

  # Get the user the container is running as
  container_user=$(docker inspect --format '{{.Config.User}}' "${container_id}" 2>/dev/null || true)

  # Get the actual running UID via exec
  running_uid=$(docker exec "${container_id}" id -u 2>/dev/null || echo "unknown")

  # Determine if running as root
  is_root=false

  if [[ -z "${container_user}" || "${container_user}" == "root" || "${container_user}" == "0" ]]; then
    is_root=true
  fi

  if [[ "${running_uid}" == "0" ]]; then
    is_root=true
  fi

  if [[ "${is_root}" == "true" ]]; then
    echo -e "${RED}[FAIL]${NC} ${container_name} (${container_id:0:12}) - User: '${container_user}', UID: ${running_uid} (RUNNING AS ROOT)"
    FAILURES=$((FAILURES + 1))
  else
    echo -e "${GREEN}[PASS]${NC} ${container_name} (${container_id:0:12}) - User: '${container_user}', UID: ${running_uid}"
  fi

done <<< "${CONTAINER_IDS}"

echo ""
echo "======================================"
echo "Summary"
echo "======================================"

if [[ ${FAILURES} -gt 0 ]]; then
  echo -e "${RED}${FAILURES} container(s) running as root - FAILED${NC}"
  echo ""
  echo "Remediation: Set USER in Dockerfile or user: in docker-compose.yml"
  exit 1
else
  echo -e "${GREEN}All containers running as non-root - PASSED${NC}"
  exit 0
fi
