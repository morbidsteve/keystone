# KEYSTONE Security Policy

## Supported Versions

| Version | Supported | Notes |
|---------|-----------|-------|
| 1.x.x  | Yes       | Current release - receives all security patches |
| 0.x.x  | No        | Pre-release - no longer maintained |

Only the latest minor release within a supported major version receives security updates.
Users are strongly encouraged to upgrade to the latest patch release at all times.

## Vulnerability Reporting

KEYSTONE follows a **responsible disclosure** process. Do NOT open public GitHub issues for
security vulnerabilities.

### How to Report

1. **Email**: Send vulnerability details to the project security team at the designated
   security contact address. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected component(s) and version(s)
   - Potential impact assessment
   - Suggested fix (if any)

2. **PGP Encryption**: Encrypt sensitive reports using the project's PGP key (available in
   the repository at `docs/security/pgp-key.asc` when published).

3. **Response Timeline**:
   - **Acknowledgment**: Within 48 hours of receipt
   - **Initial Assessment**: Within 5 business days
   - **Patch Development**: Severity-dependent (Critical: 72 hours, High: 7 days, Medium: 30 days)
   - **Disclosure**: Coordinated with reporter, typically 90 days after report

### Severity Classification

| Severity | CVSS Range | Response SLA | Examples |
|----------|-----------|--------------|---------|
| Critical | 9.0 - 10.0 | 72 hours | RCE, auth bypass, data exfiltration |
| High | 7.0 - 8.9 | 7 days | Privilege escalation, SQL injection |
| Medium | 4.0 - 6.9 | 30 days | XSS, CSRF, information disclosure |
| Low | 0.1 - 3.9 | Next release | Minor information leaks, cosmetic |

## Automated Security Tools in Pipeline

The KEYSTONE CI/CD pipeline includes the following security tools, executed on every pull
request and release build:

### Static Application Security Testing (SAST)

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Semgrep** | Custom rule-based SAST for Python, TypeScript, JavaScript | `.github/policies/semgrep-rules.yml` |
| **TypeScript Compiler** | Type safety enforcement (`tsc --noEmit`, `tsc -b`) | `tsconfig.json` per service |

### Software Composition Analysis (SCA)

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Grype** | Vulnerability scanning of dependencies and container images | `.github/policies/severity-thresholds.yml` |
| **Trivy** | Comprehensive vulnerability and misconfiguration scanner | `.github/policies/severity-thresholds.yml` |
| **License Checker** | SPDX license compliance validation | `.github/policies/allowed-licenses.yml` |

### Secrets Detection

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **TruffleHog** | Pre-commit and CI secret scanning across git history | `.github/policies/severity-thresholds.yml` |

### Container Security

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Container Hardening Check** | Dockerfile best practice validation | `scripts/security/check-container-hardening.sh` |
| **Non-Root Check** | Runtime validation that no containers run as root | `scripts/security/check-no-root.sh` |
| **Cosign** | Container image signing and verification | CI/CD pipeline |
| **Syft** | SBOM generation for container images | CI/CD pipeline |

### Malware Scanning

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **ClamAV** | Malware and virus scanning of artifacts | `.github/policies/severity-thresholds.yml` |

### Supply Chain Security

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Cosign** | Keyless image signing via Sigstore | CI/CD pipeline |
| **SLSA Provenance** | Build provenance attestation | GitHub Actions OIDC |
| **Syft** | SPDX 2.3 and CycloneDX SBOM generation | CI/CD pipeline |

## Compliance Targets

KEYSTONE is designed and operated to meet the requirements of the following frameworks:

### NIST SP 800-53 Rev 5

Applicable control families: AC, AU, CM, IA, RA, SA, SC, SI, SR. The full control mapping
is documented in `docs/security/COMPLIANCE_MATRIX.md`.

### NIST SP 800-218 (SSDF)

The Secure Software Development Framework practices (PO, PS, PW, RV) are mapped to specific
pipeline steps in the compliance matrix.

### FedRAMP High Baseline

KEYSTONE's security controls are designed to satisfy FedRAMP High baseline requirements for
cloud-deployed instances. Key areas: vulnerability management (RA-5), configuration
management (CM-6, CM-7), access control (AC-2, AC-6), and audit logging (AU-2, AU-3).

### HIPAA Technical Safeguards

For deployments handling electronic Protected Health Information (ePHI), KEYSTONE implements
controls addressing 45 CFR 164.312 requirements including access control, audit controls,
integrity controls, and transmission security.

### DoD Container Hardening Guide v1.2

All container images comply with the DoD Container Hardening Guide requirements:
non-root execution, read-only root filesystems, capability dropping, health checks, image
signing, and SBOM generation. See `.github/policies/container-policy.yml`.

### SLSA Level 3

Build integrity is ensured through:
- Hermetic builds in GitHub Actions
- Signed provenance attestations
- Tamper-evident build logs
- Two-person review requirements on main branch

## Security Contacts

For security inquiries, vulnerability reports, or compliance questions, contact the
KEYSTONE security team through the designated security reporting channel.
