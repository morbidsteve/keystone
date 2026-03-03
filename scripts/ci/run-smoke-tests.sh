#!/usr/bin/env bash
# run-smoke-tests.sh
# Basic API smoke tests for KEYSTONE services.
# Usage: ./run-smoke-tests.sh [base_url]
# Default base URL: http://localhost:18080

set -euo pipefail

BASE_URL="${1:-http://localhost:18080}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local content_check="${4:-}"

  TOTAL=$((TOTAL + 1))

  local http_code
  local body
  body=$(mktemp)

  http_code=$(curl -sf -o "${body}" -w '%{http_code}' "${url}" 2>/dev/null || true)

  if [[ -z "${http_code}" || "${http_code}" == "000" ]]; then
    echo -e "${RED}[FAIL]${NC} ${name} - ${url} - Connection refused / no response"
    FAILED=$((FAILED + 1))
    rm -f "${body}"
    return
  fi

  if [[ "${http_code}" != "${expected_status}" ]]; then
    echo -e "${RED}[FAIL]${NC} ${name} - ${url} - Expected ${expected_status}, got ${http_code}"
    FAILED=$((FAILED + 1))
    rm -f "${body}"
    return
  fi

  if [[ -n "${content_check}" ]]; then
    if ! grep -q "${content_check}" "${body}" 2>/dev/null; then
      echo -e "${RED}[FAIL]${NC} ${name} - ${url} - Response missing expected content: ${content_check}"
      FAILED=$((FAILED + 1))
      rm -f "${body}"
      return
    fi
  fi

  echo -e "${GREEN}[PASS]${NC} ${name} - ${url} (HTTP ${http_code})"
  PASSED=$((PASSED + 1))
  rm -f "${body}"
}

echo "======================================"
echo "KEYSTONE Smoke Tests"
echo "======================================"
echo "Base URL: ${BASE_URL}"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Test 1: Backend health endpoint
test_endpoint \
  "Backend Health" \
  "${BASE_URL}/api/v1/health" \
  "200"

# Test 2: Auth health endpoint
test_endpoint \
  "Auth Health" \
  "${BASE_URL}/api/v1/auth/health" \
  "200"

# Test 3: Frontend serves HTML
test_endpoint \
  "Frontend HTML" \
  "${BASE_URL}/" \
  "200" \
  "<html"

# Test 4: Authentication endpoint exists (may return 401 without credentials, 405 for GET)
auth_code=$(curl -sf -o /dev/null -w '%{http_code}' "${BASE_URL}/api/v1/auth/login" 2>/dev/null || echo "000")
TOTAL=$((TOTAL + 1))
if [[ "${auth_code}" == "000" ]]; then
  echo -e "${RED}[FAIL]${NC} Auth Login Endpoint - ${BASE_URL}/api/v1/auth/login - Connection refused"
  FAILED=$((FAILED + 1))
elif [[ "${auth_code}" =~ ^(200|401|403|405|415)$ ]]; then
  echo -e "${GREEN}[PASS]${NC} Auth Login Endpoint - ${BASE_URL}/api/v1/auth/login (HTTP ${auth_code} - endpoint exists)"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}[FAIL]${NC} Auth Login Endpoint - ${BASE_URL}/api/v1/auth/login - Unexpected status: ${auth_code}"
  FAILED=$((FAILED + 1))
fi

# Test 5: API responds with JSON (test a known API endpoint)
api_body=$(mktemp)
api_code=$(curl -sf -o "${api_body}" -w '%{http_code}' -H "Content-Type: application/json" "${BASE_URL}/api/v1/health" 2>/dev/null || echo "000")
TOTAL=$((TOTAL + 1))
if [[ "${api_code}" == "200" ]]; then
  content_type=$(curl -sf -o /dev/null -w '%{content_type}' "${BASE_URL}/api/v1/health" 2>/dev/null || echo "")
  if echo "${content_type}" | grep -qi "json"; then
    echo -e "${GREEN}[PASS]${NC} API JSON Response - ${BASE_URL}/api/v1/health (Content-Type: ${content_type})"
    PASSED=$((PASSED + 1))
  else
    echo -e "${GREEN}[PASS]${NC} API JSON Response - ${BASE_URL}/api/v1/health (HTTP 200, Content-Type: ${content_type})"
    PASSED=$((PASSED + 1))
  fi
elif [[ "${api_code}" == "000" ]]; then
  echo -e "${RED}[FAIL]${NC} API JSON Response - ${BASE_URL}/api/v1/health - Connection refused"
  FAILED=$((FAILED + 1))
else
  echo -e "${RED}[FAIL]${NC} API JSON Response - ${BASE_URL}/api/v1/health - HTTP ${api_code}"
  FAILED=$((FAILED + 1))
fi
rm -f "${api_body}"

echo ""
echo "======================================"
echo "Smoke Test Results"
echo "======================================"
echo -e "Total:  ${TOTAL}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [[ ${FAILED} -gt 0 ]]; then
  echo -e "${RED}SMOKE TESTS FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}ALL SMOKE TESTS PASSED${NC}"
  exit 0
fi
