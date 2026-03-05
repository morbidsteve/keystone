# KEYSTONE Compliance Traceability Matrix

This document maps regulatory and framework requirements to specific KEYSTONE pipeline
steps, tools, and implementation evidence. It serves as an auditable traceability matrix
for compliance assessments.

---

## Table of Contents

1. [NIST SP 800-218 (SSDF)](#nist-sp-800-218-ssdf)
2. [NIST SP 800-53 Rev 5](#nist-sp-800-53-rev-5)
3. [FedRAMP High Baseline](#fedramp-high-baseline)
4. [DoD Container Hardening Guide v1.2](#dod-container-hardening-guide-v12)
5. [HIPAA Technical Safeguards](#hipaa-technical-safeguards)
6. [SLSA Level 3](#slsa-level-3)

---

## NIST SP 800-218 (SSDF)

The Secure Software Development Framework defines practices for secure software development.

### PO: Prepare the Organization

| Practice | Task | Pipeline Step | Evidence |
|----------|------|---------------|----------|
| PO.1 | Define security requirements | Policy files in `.github/policies/` | `semgrep-rules.yml`, `allowed-licenses.yml`, `container-policy.yml`, `severity-thresholds.yml` |
| PO.1.1 | Specify security requirements for software | Severity thresholds configuration | `severity-thresholds.yml` defines fail/warn thresholds |
| PO.1.2 | Communicate requirements to third parties | License compliance policy | `allowed-licenses.yml` blocks copyleft licenses |
| PO.3 | Implement supporting toolchains | CI/CD pipeline with integrated security tools | GitHub Actions workflows with Semgrep, Grype, Trivy, TruffleHog, ClamAV, Cosign, Syft |
| PO.5 | Implement and maintain secure environments | Container hardening policies | `container-policy.yml`, non-root enforcement, read-only rootfs |

### PS: Protect the Software

| Practice | Task | Pipeline Step | Evidence |
|----------|------|---------------|----------|
| PS.1 | Protect all forms of code | Branch protection, signed commits | GitHub branch protection rules, Cosign signatures |
| PS.1.1 | Store all code in a version control system | Git repository | GitHub repository with audit trail |
| PS.2 | Provide a mechanism for verifying software integrity | Cosign image signing, SBOM attestation | `cosign sign`, `cosign attest` in CI pipeline |
| PS.3 | Archive and protect each software release | SBOM generation, signed releases | Syft SPDX/CycloneDX output, GitHub Release assets |
| PS.3.1 | Securely archive necessary files | GitHub Releases with signed artifacts | Release pipeline with Cosign signatures |
| PS.3.2 | Collect, safeguard, maintain, and share provenance data | SLSA provenance, SBOM attestations | GitHub Actions OIDC provenance, Cosign attestations |

### PW: Produce Well-Secured Software

| Practice | Task | Pipeline Step | Evidence |
|----------|------|---------------|----------|
| PW.1 | Design software to meet security requirements | Security architecture reviews | Documented in `docs/security/` |
| PW.4 | Reuse existing, well-secured software | Dependency management with vulnerability scanning | Grype/Trivy SCA scanning |
| PW.4.1 | Acquire well-secured software components | License and vulnerability checks | `allowed-licenses.yml`, Grype fail-on-critical |
| PW.4.4 | Verify acquired software integrity | Dependency checksum verification | Lock files (package-lock.json, requirements.txt) |
| PW.5 | Create source code adhering to secure practices | Semgrep SAST | `semgrep-rules.yml` custom rules |
| PW.6 | Configure the build to detect security issues | Build-integrated security checks | `tsc -b`, `ruff check`, Semgrep in CI |
| PW.7 | Review and analyze human-readable code | PR review requirements | GitHub branch protection, required reviews |
| PW.8 | Test executable code | Unit tests, integration tests, smoke tests | Vitest, pytest, `run-smoke-tests.sh` |
| PW.9 | Configure software to have secure settings by default | Container hardening defaults | `container-policy.yml` enforces secure defaults |

### RV: Respond to Vulnerabilities

| Practice | Task | Pipeline Step | Evidence |
|----------|------|---------------|----------|
| RV.1 | Identify and confirm vulnerabilities | Grype, Trivy, Semgrep scanning | CI pipeline scan results |
| RV.1.1 | Gather vulnerability information from sources | Automated CVE database scanning | Grype (NVD, GHSA), Trivy (NVD, GHSA, Red Hat) |
| RV.1.2 | Review and analyze vulnerability reports | Severity threshold enforcement | `severity-thresholds.yml` auto-fails on critical/high |
| RV.2 | Assess, prioritize, and remediate vulnerabilities | Severity-based SLA | `SECURITY.md` defines response timelines |
| RV.3 | Analyze vulnerabilities to identify root causes | Compliance evidence report | `generate-compliance-report.sh` aggregates findings |

---

## NIST SP 800-53 Rev 5

Selected controls applicable to KEYSTONE's software supply chain and deployment.

### Access Control (AC)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| AC-2 | Account Management | GitHub organization member management, service accounts with least privilege | GitHub Org settings, IAM policies |
| AC-3 | Access Enforcement | RBAC in application, branch protection rules | Application auth middleware, GitHub branch rules |
| AC-6 | Least Privilege | Non-root containers, dropped capabilities, minimal base images | `container-policy.yml`, `check-container-hardening.sh` |
| AC-6(1) | Authorize Access to Security Functions | Restricted access to CI/CD secrets and signing keys | GitHub Environments, OIDC federation |
| AC-17 | Remote Access | TLS-only communication, encrypted API endpoints | nginx TLS configuration |

### Audit and Accountability (AU)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| AU-2 | Event Logging | Application audit logging, CI/CD pipeline logs | Structured logging (Python logging), GitHub Actions logs |
| AU-3 | Content of Audit Records | Timestamp, user, action, outcome in all log entries | Structured log format with required fields |
| AU-6 | Audit Record Review | Automated log scanning in smoke tests | `run-smoke-tests.sh` checks for ERROR/FATAL |
| AU-12 | Audit Record Generation | All services emit structured audit events | Service-level logging configuration |

### Configuration Management (CM)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| CM-2 | Baseline Configuration | Infrastructure as Code, Docker Compose definitions | `docker-compose.yml`, Helm charts |
| CM-6 | Configuration Settings | Container security policies, build configs | `container-policy.yml`, Dockerfiles |
| CM-7 | Least Functionality | Distroless/minimal base images, no shell/package managers | `container-policy.yml` no_shell, no_package_manager |
| CM-7(5) | Authorized Software | License allowlist, dependency pinning | `allowed-licenses.yml`, lock files |
| CM-8 | System Component Inventory | SBOM generation for all components | Syft SPDX/CycloneDX output |

### Identification and Authentication (IA)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| IA-5 | Authenticator Management | No hardcoded credentials, secret scanning | TruffleHog, Semgrep `keystone-hardcoded-secret` rule |
| IA-5(7) | No Embedded Unencrypted Authenticators | Pre-commit secret detection | TruffleHog pre-commit hook |
| IA-9 | Service Identification and Authentication | Container image signatures | Cosign keyless signing |

### Risk Assessment (RA)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| RA-5 | Vulnerability Monitoring and Scanning | Automated scanning on every PR and release | Grype, Trivy, Semgrep in CI pipeline |
| RA-5(3) | Breadth/Depth of Coverage | Multi-tool scanning (SAST + SCA + secrets + containers) | Full pipeline: Semgrep + Grype + Trivy + TruffleHog + ClamAV |
| RA-5(5) | Privileged Access | Scanning runs with minimal permissions | GitHub Actions least-privilege OIDC tokens |

### System and Services Acquisition (SA)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| SA-11 | Developer Testing and Evaluation | Unit tests, integration tests, SAST | Vitest, pytest, Semgrep |
| SA-11(1) | Static Code Analysis | Semgrep with custom rules | `semgrep-rules.yml` |
| SA-12 | Supply Chain Protection | SCA, license compliance, SBOM | Grype, Trivy, `allowed-licenses.yml`, Syft |
| SA-15 | Development Process | Documented SDLC with security gates | CI/CD pipeline enforces gates before merge |

### System and Communications Protection (SC)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| SC-7 | Boundary Protection | Network segmentation in Docker, nginx reverse proxy | Docker networks, nginx configuration |
| SC-8 | Transmission Confidentiality | TLS for all external communication | nginx TLS termination |
| SC-12 | Cryptographic Key Management | Sigstore keyless signing, no long-lived keys | Cosign OIDC-based signing |
| SC-13 | Cryptographic Protection | Standard algorithms only | TLS 1.2+, SHA-256 checksums |
| SC-28 | Protection of Information at Rest | Read-only container root filesystems | `container-policy.yml` read_only_rootfs |

### System and Information Integrity (SI)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| SI-2 | Flaw Remediation | Automated vulnerability detection with severity SLAs | `severity-thresholds.yml`, `SECURITY.md` SLAs |
| SI-3 | Malicious Code Protection | ClamAV scanning, Grype/Trivy vulnerability checks | CI pipeline malware and vulnerability scanning |
| SI-7 | Software Integrity | Container image signing, SBOM attestation | Cosign sign/verify, provenance attestations |
| SI-7(1) | Integrity Checks | Automated verification of image signatures | `cosign verify` in deployment pipeline |
| SI-10 | Information Input Validation | Semgrep rules for injection prevention | `keystone-raw-sql-injection`, `keystone-ssrf-request` |

### Supply Chain Risk Management (SR)

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| SR-4 | Provenance | SLSA provenance, SBOM, signed artifacts | GitHub Actions OIDC, Syft, Cosign |
| SR-4(3) | Validate as Genuine | Image signature verification before deployment | `cosign verify` pre-deployment check |
| SR-11 | Component Authenticity | Dependency checksum verification | Lock files, Grype integrity checks |

---

## FedRAMP High Baseline

FedRAMP High baseline controls mapped to KEYSTONE's CI/CD pipeline.

| FedRAMP Control | NIST 800-53 | Pipeline Implementation | Tool/Script |
|-----------------|-------------|------------------------|-------------|
| RA-5 | RA-5 | Vulnerability scanning on every build | Grype, Trivy |
| RA-5(2) | RA-5(2) | Update vulnerability databases before scanning | `update-clamav-db.sh`, Grype/Trivy auto-update |
| RA-5(5) | RA-5(5) | Least-privilege scanning | GitHub Actions OIDC minimal tokens |
| SA-11 | SA-11 | Static analysis and testing | Semgrep, unit tests, smoke tests |
| SA-11(1) | SA-11(1) | SAST with custom rules | Semgrep (`semgrep-rules.yml`) |
| SA-12 | SA-12 | Supply chain risk management | Grype SCA, `allowed-licenses.yml`, SBOM |
| CM-6 | CM-6 | Configuration hardening | `container-policy.yml`, `check-container-hardening.sh` |
| CM-7 | CM-7 | Least functionality | Minimal/distroless images, no package managers |
| CM-8 | CM-8 | Component inventory | Syft SBOM generation |
| SI-2 | SI-2 | Flaw remediation within SLAs | `severity-thresholds.yml` fail gates |
| SI-3 | SI-3 | Malicious code protection | ClamAV, Grype, Trivy |
| SI-7 | SI-7 | Software integrity verification | Cosign signatures and attestations |
| SC-28 | SC-28 | Protection of information at rest | Read-only container rootfs |
| IA-5 | IA-5 | Credential management | TruffleHog secret scanning |
| AC-6 | AC-6 | Least privilege | Non-root containers, dropped capabilities |
| AU-2 | AU-2 | Audit event logging | Structured application logging |

---

## DoD Container Hardening Guide v1.2

Mapping of DoD Container Hardening requirements to KEYSTONE Dockerfile and runtime configuration.

| Requirement | CHG Section | Dockerfile/Compose Implementation | Validation Script |
|-------------|-------------|----------------------------------|-------------------|
| Run as non-root | 3.1 | `USER appuser` (UID >= 1000) | `check-container-hardening.sh`, `check-no-root.sh` |
| Read-only root filesystem | 3.2 | `read_only: true` in compose, `--read-only` flag | `container-policy.yml` enforcement |
| Drop all capabilities | 3.3 | `cap_drop: [ALL]` in compose | `container-policy.yml` enforcement |
| No new privileges | 3.4 | `security_opt: [no-new-privileges:true]` | `container-policy.yml` enforcement |
| Use specific image tags | 3.5 | `FROM node:20-slim` (pinned versions) | `check-container-hardening.sh` :latest check |
| Multi-stage builds | 3.6 | Separate build and runtime stages | `check-container-hardening.sh` FROM count |
| No package managers in final image | 3.7 | `RUN apt-get purge` or distroless base | `container-policy.yml` no_package_manager |
| No shell in final image | 3.7 | Distroless base images preferred | `container-policy.yml` no_shell |
| Health checks | 3.8 | `HEALTHCHECK CMD curl -f http://...` | `check-container-hardening.sh` HEALTHCHECK check |
| No secrets in image | 3.9 | No `.env`/`.pem`/`.key` in COPY/ADD | `check-container-hardening.sh` sensitive file check |
| No secrets in build args | 3.9 | No `ARG password`/`ARG secret` | `check-container-hardening.sh` ARG check |
| Use COPY not ADD | 3.10 | `COPY` for all file operations | `check-container-hardening.sh` ADD detection |
| Image signing | 3.11 | Cosign keyless signing via Sigstore | CI pipeline `cosign sign` step |
| SBOM generation | 3.12 | Syft SPDX 2.3 JSON output | CI pipeline `syft` step |
| Vulnerability scanning | 3.13 | Grype and Trivy scanning | CI pipeline scan + `severity-thresholds.yml` |
| No curl-to-shell | 3.14 | Avoid `curl | bash` patterns | `check-container-hardening.sh` curl pipe check |

---

## HIPAA Technical Safeguards

45 CFR 164.312 Technical Safeguard requirements mapped to KEYSTONE implementations.

| HIPAA Requirement | CFR Reference | Implementation | Evidence |
|-------------------|---------------|----------------|----------|
| Access Control - Unique User ID | 164.312(a)(2)(i) | Per-user authentication, no shared accounts | Application RBAC, GitHub individual accounts |
| Access Control - Emergency Access | 164.312(a)(2)(ii) | Break-glass procedures documented | Operations runbook |
| Access Control - Automatic Logoff | 164.312(a)(2)(iii) | Session timeout configuration | Application session management |
| Access Control - Encryption | 164.312(a)(2)(iv) | TLS 1.2+ for all data in transit | nginx TLS termination |
| Audit Controls | 164.312(b) | Structured audit logging in all services | Python logging, AU-2/AU-3 controls |
| Integrity - Authentication of ePHI | 164.312(c)(2) | Container image signing, SBOM attestation | Cosign signatures, SHA-256 checksums |
| Person/Entity Authentication | 164.312(d) | Multi-factor authentication support | Application auth layer |
| Transmission Security - Integrity | 164.312(e)(2)(i) | TLS for all network communication | nginx TLS, Docker network isolation |
| Transmission Security - Encryption | 164.312(e)(2)(ii) | TLS 1.2+ enforced | nginx minimum TLS version configuration |
| Administrative - Security Management | 164.308(a)(1) | Automated vulnerability scanning pipeline | Full DevSecOps pipeline |
| Administrative - Risk Analysis | 164.308(a)(1)(ii)(A) | Continuous vulnerability assessment | Grype, Trivy, Semgrep on every build |
| Administrative - Malicious Software | 164.308(a)(5)(ii)(B) | ClamAV malware scanning | CI pipeline ClamAV step |
| Administrative - Log-in Monitoring | 164.308(a)(5)(ii)(C) | Audit logging of authentication events | Application audit trail |
| Administrative - Contingency Plan | 164.308(a)(7) | Infrastructure as Code, reproducible builds | Docker Compose, Helm charts, CI/CD |

---

## SLSA Level 3

Supply-chain Levels for Software Artifacts (SLSA) Level 3 requirements.

| SLSA Requirement | Level | Implementation | Evidence |
|------------------|-------|----------------|----------|
| Source - Version controlled | 1 | Git repository on GitHub | GitHub repository |
| Source - Verified history | 3 | Signed commits, branch protection | GitHub branch protection rules |
| Source - Two-person reviewed | 3 | Required PR approvals | GitHub branch protection: required reviews |
| Source - Retained 18 months | 3 | GitHub repository retention | GitHub data retention policy |
| Build - Scripted build | 1 | GitHub Actions workflows | `.github/workflows/` |
| Build - Build service | 2 | GitHub-hosted runners | GitHub Actions hosted runners |
| Build - Ephemeral environment | 3 | Fresh runner per job | GitHub Actions ephemeral runners |
| Build - Isolated | 3 | No shared state between builds | GitHub Actions job isolation |
| Build - Parameterless | 3 | Build inputs from source only | Workflow triggered by push/PR events |
| Build - Hermetic | 3 | Dependencies from lock files, pinned versions | `package-lock.json`, `requirements.txt`, pinned Docker tags |
| Provenance - Available | 1 | Provenance generated per build | GitHub Actions OIDC provenance |
| Provenance - Authenticated | 2 | Cosign keyless signatures | Sigstore Fulcio + Rekor transparency log |
| Provenance - Service generated | 2 | Provenance from build service, not developer | GitHub Actions generates provenance |
| Provenance - Non-falsifiable | 3 | Provenance entries in tamper-evident log | Rekor transparency log entries |
| Provenance - Dependencies complete | 3 | Full SBOM with all transitive dependencies | Syft SPDX 2.3 complete dependency tree |

---

## Evidence Collection

All compliance evidence is automatically aggregated by the
`scripts/security/generate-compliance-report.sh` script, which produces a
`COMPLIANCE_EVIDENCE.md` file mapping scan artifacts to the controls listed in this matrix.

### Audit Artifact Locations

| Artifact | Location | Retention |
|----------|----------|-----------|
| CI/CD pipeline logs | GitHub Actions | 90 days |
| Vulnerability scan results | GitHub Actions artifacts | 90 days |
| SBOM files | GitHub Releases, image attestations | Permanent (releases) |
| Image signatures | Sigstore Rekor transparency log | Permanent |
| Compliance evidence reports | GitHub Actions artifacts | 90 days |
| Container hardening reports | GitHub Actions artifacts | 90 days |

---

_Last updated: 2026-03-03_
_KEYSTONE DevSecOps Pipeline_
