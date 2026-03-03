#!/usr/bin/env bash
# generate-compliance-report.sh
# Aggregates all scan results into a compliance evidence markdown file.
# Usage: ./generate-compliance-report.sh <scan-results-directory> [output-file]
# Output: COMPLIANCE_EVIDENCE.md

set -euo pipefail

SCAN_DIR="${1:?Usage: $0 <scan-results-directory> [output-file]}"
OUTPUT="${2:-COMPLIANCE_EVIDENCE.md}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HOSTNAME=$(hostname 2>/dev/null || echo "unknown")

if [[ ! -d "${SCAN_DIR}" ]]; then
  echo "Error: Scan results directory not found: ${SCAN_DIR}"
  exit 1
fi

cat > "${OUTPUT}" <<HEADER
# KEYSTONE Compliance Evidence Report

**Generated**: ${TIMESTAMP}
**Host**: ${HOSTNAME}
**Scan Directory**: ${SCAN_DIR}

---

## Table of Contents

1. [Scan Artifacts Inventory](#scan-artifacts-inventory)
2. [Vulnerability Scanning (NIST SI-3, SI-7)](#vulnerability-scanning)
3. [Software Composition Analysis (NIST SA-12, SR-4)](#software-composition-analysis)
4. [Static Analysis (NIST SA-11)](#static-analysis)
5. [Secrets Detection (NIST IA-5)](#secrets-detection)
6. [Container Security (NIST CM-7, SC-28)](#container-security)
7. [Malware Scanning (NIST SI-3)](#malware-scanning)
8. [License Compliance](#license-compliance)
9. [SBOM Artifacts (EO 14028)](#sbom-artifacts)
10. [Control Mapping Summary](#control-mapping-summary)

---

## Scan Artifacts Inventory

| # | Artifact | Path | Size | Modified |
|---|----------|------|------|----------|
HEADER

# Enumerate all scan artifacts
artifact_num=0
while IFS= read -r -d '' file; do
  artifact_num=$((artifact_num + 1))
  file_size=$(stat -c%s "${file}" 2>/dev/null || stat -f%z "${file}" 2>/dev/null || echo "unknown")
  file_mod=$(stat -c%y "${file}" 2>/dev/null || stat -f%Sm "${file}" 2>/dev/null || echo "unknown")
  rel_path="${file#${SCAN_DIR}/}"
  echo "| ${artifact_num} | $(basename "${file}") | \`${rel_path}\` | ${file_size} bytes | ${file_mod} |" >> "${OUTPUT}"
done < <(find "${SCAN_DIR}" -type f -print0 2>/dev/null | sort -z)

if [[ ${artifact_num} -eq 0 ]]; then
  echo "| - | No artifacts found | - | - | - |" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION2'

---

## Vulnerability Scanning

**Controls**: NIST SI-3 (Malicious Code Protection), SI-7 (Software Integrity), FedRAMP RA-5, HIPAA 164.308(a)(1)

### Grype Results

SECTION2

if ls "${SCAN_DIR}"/grype*.json 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/grype*.json; do
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
    critical=$(grep -c '"Severity":"Critical"' "${f}" 2>/dev/null || echo "0")
    high=$(grep -c '"Severity":"High"' "${f}" 2>/dev/null || echo "0")
    medium=$(grep -c '"Severity":"Medium"' "${f}" 2>/dev/null || echo "0")
    low=$(grep -c '"Severity":"Low"' "${f}" 2>/dev/null || echo "0")
    echo "| Severity | Count |" >> "${OUTPUT}"
    echo "|----------|-------|" >> "${OUTPUT}"
    echo "| Critical | ${critical} |" >> "${OUTPUT}"
    echo "| High | ${high} |" >> "${OUTPUT}"
    echo "| Medium | ${medium} |" >> "${OUTPUT}"
    echo "| Low | ${low} |" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No Grype scan results found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION2B'
### Trivy Results

SECTION2B

if ls "${SCAN_DIR}"/trivy*.json 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/trivy*.json; do
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
    critical=$(grep -ci '"CRITICAL"' "${f}" 2>/dev/null || echo "0")
    high=$(grep -ci '"HIGH"' "${f}" 2>/dev/null || echo "0")
    echo "| Severity | Count |" >> "${OUTPUT}"
    echo "|----------|-------|" >> "${OUTPUT}"
    echo "| Critical | ${critical} |" >> "${OUTPUT}"
    echo "| High | ${high} |" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No Trivy scan results found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION3'
---

## Software Composition Analysis

**Controls**: NIST SA-12 (Supply Chain Protection), SR-4 (Provenance), FedRAMP SA-12, EO 14028 Section 4

SECTION3

if ls "${SCAN_DIR}"/sca*.json "${SCAN_DIR}"/dependency*.json 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/sca*.json "${SCAN_DIR}"/dependency*.json; do
    [[ -f "${f}" ]] || continue
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No SCA results found. Refer to Grype/Trivy results above for dependency vulnerabilities._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION4'
---

## Static Analysis

**Controls**: NIST SA-11 (Developer Testing), FedRAMP SA-11, HIPAA 164.312(a)(1)

### Semgrep Results

SECTION4

if ls "${SCAN_DIR}"/semgrep*.json 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/semgrep*.json; do
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
    errors=$(grep -c '"severity":"ERROR"' "${f}" 2>/dev/null || echo "0")
    warnings=$(grep -c '"severity":"WARNING"' "${f}" 2>/dev/null || echo "0")
    echo "| Severity | Count |" >> "${OUTPUT}"
    echo "|----------|-------|" >> "${OUTPUT}"
    echo "| ERROR | ${errors} |" >> "${OUTPUT}"
    echo "| WARNING | ${warnings} |" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No Semgrep scan results found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION5'
---

## Secrets Detection

**Controls**: NIST IA-5 (Authenticator Management), SC-12 (Cryptographic Key Management), FedRAMP IA-5

### TruffleHog Results

SECTION5

if ls "${SCAN_DIR}"/trufflehog*.json 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/trufflehog*.json; do
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
    verified=$(grep -c '"Verified":true' "${f}" 2>/dev/null || echo "0")
    unverified=$(grep -c '"Verified":false' "${f}" 2>/dev/null || echo "0")
    echo "| Status | Count |" >> "${OUTPUT}"
    echo "|--------|-------|" >> "${OUTPUT}"
    echo "| Verified secrets | ${verified} |" >> "${OUTPUT}"
    echo "| Unverified | ${unverified} |" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No TruffleHog scan results found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION6'
---

## Container Security

**Controls**: NIST CM-7 (Least Functionality), SC-28 (Protection of Information at Rest), DoD Container Hardening Guide v1.2

SECTION6

if ls "${SCAN_DIR}"/container-hardening*.txt "${SCAN_DIR}"/container-hardening*.json 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/container-hardening*; do
    [[ -f "${f}" ]] || continue
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
    echo '```' >> "${OUTPUT}"
    head -100 "${f}" >> "${OUTPUT}"
    echo '```' >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No container hardening results found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION7'
---

## Malware Scanning

**Controls**: NIST SI-3 (Malicious Code Protection), FedRAMP SI-3, HIPAA 164.308(a)(5)(ii)(B)

### ClamAV Results

SECTION7

if ls "${SCAN_DIR}"/clamav*.txt "${SCAN_DIR}"/clamav*.log 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/clamav*; do
    [[ -f "${f}" ]] || continue
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
    infections=$(grep -c "FOUND" "${f}" 2>/dev/null || echo "0")
    echo "Infections detected: **${infections}**" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No ClamAV scan results found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION8'
---

## License Compliance

**Controls**: Organizational license policy, DFARS 252.227-7014

SECTION8

if ls "${SCAN_DIR}"/license*.json "${SCAN_DIR}"/license*.txt 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/license*; do
    [[ -f "${f}" ]] || continue
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No license compliance results found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<'SECTION9'
---

## SBOM Artifacts

**Controls**: EO 14028 Section 4, NTIA Minimum Elements, NIST SP 800-218 (SSDF) PS.3

SECTION9

if ls "${SCAN_DIR}"/sbom*.json "${SCAN_DIR}"/*spdx*.json "${SCAN_DIR}"/*cyclonedx*.json 2>/dev/null | head -1 > /dev/null; then
  for f in "${SCAN_DIR}"/sbom*.json "${SCAN_DIR}"/*spdx*.json "${SCAN_DIR}"/*cyclonedx*.json; do
    [[ -f "${f}" ]] || continue
    echo "**File**: \`$(basename "${f}")\`" >> "${OUTPUT}"
    file_size=$(stat -c%s "${f}" 2>/dev/null || stat -f%z "${f}" 2>/dev/null || echo "unknown")
    echo "Size: ${file_size} bytes" >> "${OUTPUT}"
    echo "" >> "${OUTPUT}"
  done
else
  echo "_No SBOM artifacts found._" >> "${OUTPUT}"
  echo "" >> "${OUTPUT}"
fi

cat >> "${OUTPUT}" <<SECTION10
---

## Control Mapping Summary

| Framework | Control | Tool/Evidence | Status |
|-----------|---------|---------------|--------|
| NIST SI-3 | Malicious Code Protection | ClamAV, Grype, Trivy | See sections above |
| NIST SI-7 | Software Integrity | Cosign signatures, SBOM attestation | See SBOM section |
| NIST SA-11 | Developer Testing | Semgrep, unit tests | See Static Analysis |
| NIST SA-12 | Supply Chain Protection | Grype, Trivy, license check | See SCA section |
| NIST IA-5 | Authenticator Management | TruffleHog | See Secrets Detection |
| NIST CM-7 | Least Functionality | Container hardening checks | See Container Security |
| NIST SC-12 | Cryptographic Key Mgmt | TruffleHog, Cosign | See Secrets Detection |
| NIST SC-28 | Protection at Rest | Container read-only rootfs | See Container Security |
| FedRAMP RA-5 | Vulnerability Scanning | Grype, Trivy | See Vulnerability Scanning |
| FedRAMP SA-11 | Developer Testing | Semgrep, unit tests | See Static Analysis |
| FedRAMP SA-12 | Supply Chain Risk Mgmt | SCA, SBOM, license check | See SCA section |
| HIPAA 164.308(a)(1) | Security Management | All scanning tools | Full report |
| HIPAA 164.312(a)(1) | Access Control | Static analysis, container checks | See relevant sections |
| DoD CHG v1.2 | Container Hardening | Container hardening script | See Container Security |
| EO 14028 Sec 4 | Software Supply Chain | SBOM, Cosign, provenance | See SBOM section |
| SLSA Level 3 | Build Provenance | GitHub Actions, Cosign, SBOM | See SBOM section |

---

_Report generated by KEYSTONE DevSecOps pipeline._
_${TIMESTAMP}_
SECTION10

echo "Compliance evidence report generated: ${OUTPUT}"
echo "Total artifacts cataloged: ${artifact_num}"
