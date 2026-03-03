#!/usr/bin/env bash
# check-container-hardening.sh
# Validates Dockerfile best practices for container hardening.
# Usage: ./check-container-hardening.sh <Dockerfile> [<Dockerfile> ...]
# Exit 1 on any failure.

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

FAILURES=0
WARNINGS=0

fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  FAILURES=$((FAILURES + 1))
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
}

check_dockerfile() {
  local dockerfile="$1"
  echo ""
  echo "======================================"
  echo "Checking: ${dockerfile}"
  echo "======================================"

  if [[ ! -f "${dockerfile}" ]]; then
    fail "File not found: ${dockerfile}"
    return
  fi

  local content
  content=$(cat "${dockerfile}")

  # Check 1: USER instruction (non-root)
  if echo "${content}" | grep -qiE '^\s*USER\s+'; then
    local user_line
    user_line=$(echo "${content}" | grep -iE '^\s*USER\s+' | tail -1 | awk '{print $2}')
    if [[ "${user_line}" == "root" || "${user_line}" == "0" ]]; then
      fail "USER is set to root in ${dockerfile}"
    else
      pass "USER instruction found: ${user_line}"
    fi
  else
    fail "No USER instruction found - container will run as root"
  fi

  # Check 2: HEALTHCHECK instruction
  if echo "${content}" | grep -qiE '^\s*HEALTHCHECK\s+'; then
    pass "HEALTHCHECK instruction found"
  else
    fail "No HEALTHCHECK instruction found"
  fi

  # Check 3: Multi-stage build
  local from_count
  from_count=$(echo "${content}" | grep -ciE '^\s*FROM\s+' || true)
  if [[ "${from_count}" -ge 2 ]]; then
    pass "Multi-stage build detected (${from_count} stages)"
  else
    warn "No multi-stage build detected - consider using multi-stage for smaller images"
  fi

  # Check 4: COPY vs ADD
  if echo "${content}" | grep -qiE '^\s*ADD\s+'; then
    local add_lines
    add_lines=$(echo "${content}" | grep -ciE '^\s*ADD\s+' || true)
    # Allow ADD for URLs or tar extraction, but warn
    warn "ADD instruction found (${add_lines} occurrences) - prefer COPY unless extracting archives"
  else
    pass "No ADD instructions found (COPY used correctly)"
  fi

  # Check 5: No secrets in build args
  if echo "${content}" | grep -qiE '^\s*ARG\s+.*(password|secret|api_key|token|credential|private_key)'; then
    fail "Potential secret in ARG instruction - secrets must not be passed as build args"
  else
    pass "No secrets detected in ARG instructions"
  fi

  # Check 6: No :latest tag
  if echo "${content}" | grep -qiE '^\s*FROM\s+\S+:latest(\s|$)'; then
    fail "Image uses :latest tag - pin to a specific version"
  elif echo "${content}" | grep -qiE '^\s*FROM\s+[^:@\s]+\s+(AS|as)\s+' ; then
    # FROM without any tag at all (implies :latest)
    warn "FROM instruction without explicit tag may default to :latest"
  else
    pass "No :latest tags detected"
  fi

  # Check 7: No RUN with curl piped to shell
  if echo "${content}" | grep -qiE '^\s*RUN\s+.*curl.*\|\s*(bash|sh)'; then
    fail "curl piped to shell detected - download and verify scripts before execution"
  else
    pass "No curl-to-shell piping detected"
  fi

  # Check 8: No sensitive files copied
  if echo "${content}" | grep -qiE '^\s*(COPY|ADD)\s+.*\.(env|pem|key|p12|pfx|jks)'; then
    fail "Sensitive file copied into image - use secrets management instead"
  else
    pass "No sensitive files copied into image"
  fi
}

# Main
if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <Dockerfile> [<Dockerfile> ...]"
  echo ""
  echo "If no arguments provided, scanning for Dockerfiles in current directory tree..."
  mapfile -t DOCKERFILES < <(find . -name 'Dockerfile*' -not -path './.git/*' 2>/dev/null)
  if [[ ${#DOCKERFILES[@]} -eq 0 ]]; then
    echo "No Dockerfiles found."
    exit 0
  fi
else
  DOCKERFILES=("$@")
fi

for df in "${DOCKERFILES[@]}"; do
  check_dockerfile "${df}"
done

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo -e "Failures: ${RED}${FAILURES}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [[ ${FAILURES} -gt 0 ]]; then
  echo -e "${RED}Container hardening check FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}Container hardening check PASSED${NC}"
  exit 0
fi
