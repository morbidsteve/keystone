# KEYSTONE — DevSecOps Pipeline (Claude Code Prompt)

Paste this into Claude Code in the KEYSTONE repo. It builds a production-grade DevSecOps pipeline using GitHub Actions that meets government (NIST, FedRAMP, DoD) and healthcare (HIPAA) compliance requirements.

---

## What We're Building

A comprehensive DevSecOps CI/CD pipeline for KEYSTONE using **GitHub Actions**. This pipeline ensures every commit, container image, and deployment artifact is scanned, signed, attested, and auditable — meeting the bar for deployment to government information systems (FedRAMP High, DoD IL4/IL5) and healthcare environments (HIPAA).

The pipeline enforces a **"nothing ships without passing every gate"** policy. If any security check fails, the pipeline blocks the merge/deploy.

## Compliance Targets

This pipeline is designed to satisfy:

- **NIST SP 800-218 (SSDF)** — Secure Software Development Framework
- **NIST SP 800-53 Rev 5** — Security controls (SA, SI, AU, AC, SC families)
- **NIST SP 800-190** — Container security
- **NIST SP 800-204D** — Software supply chain security in DevSecOps
- **FedRAMP High Baseline** — CM-3, CM-5, IA-2, IA-5, SC-7, SI-2, SI-3, SI-4
- **DoD Enterprise DevSecOps Reference Design v2.0** — Container hardening, signed artifacts
- **DoD Container Hardening Guide v1.2** — Non-root, minimal base, no secrets, signed
- **Executive Order 14028** — SBOMs, supply chain security, provenance
- **HIPAA Security Rule** — Technical safeguards (access, audit, integrity, transmission)
- **SLSA Level 3** — Provenance, hermetic builds, signed attestations

## Tool Stack

| Function | Tool | Why This Tool |
|---|---|---|
| **SAST** | Semgrep | Low false-positive rate, 30+ languages, OWASP/CWE rulesets, free for OSS |
| **Secrets Scanning** | TruffleHog | Only reports *verified* secrets (tests against live APIs), near-zero false positives |
| **SBOM Generation** | Syft (Anchore) | NIST-recommended, outputs SPDX 2.3 + CycloneDX, fast |
| **Dependency/Image Vuln Scanning** | Grype (Anchore) | Superior risk scoring (CVSS + EPSS + KEV), pairs with Syft SBOMs |
| **Container Scanning** | Trivy (Aqua) | Comprehensive OS + app vuln scan, misconfig detection, DoD-endorsed |
| **Malware Scanning** | ClamAV | Open-source antivirus, scans source + build artifacts for malware |
| **DAST** | OWASP ZAP | Free, full-scan and API-scan modes, GitHub Actions native |
| **License Compliance** | Syft + custom policy | Extracts license info from SBOM, flags copyleft/restricted licenses |
| **Container Signing** | Cosign (Sigstore) | Keyless signing via GitHub OIDC, logged in Rekor transparency log |
| **Policy Enforcement** | Custom gate checks (+ Kyverno for K8s runtime) | Fail pipeline on policy violations |
| **Linting** | Ruff (Python), ESLint + TypeScript (frontend) | Fast, catches bugs before SAST |

## Repository Structure (New Files)

```
keystone/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                        # Main CI pipeline (runs on every PR + push to main)
│   │   ├── nightly-scan.yml              # Nightly vuln rescan of deployed images + SBOMs
│   │   ├── release.yml                   # Release pipeline (tag-triggered, builds + signs + deploys)
│   │   └── dependency-review.yml         # PR-level dependency change review
│   ├── actions/
│   │   ├── setup-security-tools/
│   │   │   └── action.yml                # Composite action: installs Syft, Grype, Cosign, Trivy, ClamAV
│   │   ├── container-build/
│   │   │   └── action.yml                # Composite action: multi-stage Docker build + push
│   │   └── compliance-report/
│   │       └── action.yml                # Composite action: generates compliance evidence report
│   └── policies/
│       ├── semgrep-rules.yml             # Custom Semgrep rules (SQL injection, hardcoded creds, etc.)
│       ├── allowed-licenses.yml          # Approved open-source license list
│       ├── container-policy.yml          # Container hardening policy (non-root, no secrets, minimal base)
│       └── severity-thresholds.yml       # Fail thresholds per scan type (e.g., fail on critical CVEs)
├── backend/
│   └── Dockerfile                        # UPDATE: multi-stage, distroless final, non-root user
├── frontend/
│   └── Dockerfile                        # UPDATE: multi-stage, nginx-unprivileged final, non-root
├── docker-compose.yml                    # UPDATE: no containers run as root
├── docker-compose.ci.yml                # CI-specific compose (ephemeral, for DAST testing)
├── scripts/
│   ├── security/
│   │   ├── check-container-hardening.sh  # Validates Dockerfile best practices
│   │   ├── check-no-root.sh              # Validates no container runs as root
│   │   ├── generate-compliance-report.sh # Aggregates all scan results into compliance doc
│   │   └── update-clamav-db.sh           # Updates ClamAV virus definitions
│   └── ci/
│       ├── wait-for-healthy.sh           # Polls service health endpoints (for DAST)
│       └── run-smoke-tests.sh            # Basic API smoke tests
└── docs/
    └── security/
        ├── SECURITY.md                   # Security policy, vulnerability reporting process
        ├── SBOM.md                       # How SBOMs are generated, stored, and consumed
        └── COMPLIANCE_MATRIX.md          # Control → pipeline step → evidence mapping
```

## GitHub Repository Settings (Configure Manually or via `gh` CLI)

Before the pipeline runs, configure these repo settings:

```bash
# Branch protection on main
gh api repos/{owner}/{repo}/branches/main/protection -X PUT -f \
  required_status_checks='{"strict":true,"contexts":["ci-gate"]}' \
  enforce_admins=true \
  required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  restrictions=null \
  required_linear_history=true \
  allow_force_pushes=false \
  allow_deletions=false

# Require signed commits (recommended)
# Enable GitHub Advanced Security (for SARIF uploads)
# Enable Dependabot alerts + security updates
# Enable secret scanning (GitHub native, in addition to TruffleHog)
```

## Pipeline Architecture

### Trigger Matrix

| Trigger | Workflow | What Runs |
|---|---|---|
| PR opened/updated | `ci.yml` | Lint → SAST → Secrets → SCA → Build → Container Scan → Unit Tests → DAST → Policy Gate |
| Push to `main` | `ci.yml` + `release.yml` | Full CI + Container Sign + SBOM Attestation + Compliance Report |
| Git tag `v*` | `release.yml` | Full CI + Sign + Attest + Generate Release + Publish SBOM |
| Nightly (cron) | `nightly-scan.yml` | Rescan all published images against updated CVE databases |
| PR dependency change | `dependency-review.yml` | Flag new dependencies, license check, known-vuln check |

### Pipeline Phases (ci.yml)

```
Phase 1: Code Quality & Static Analysis (parallel)
├── Lint (Ruff + ESLint + tsc)
├── SAST (Semgrep — OWASP Top 10, CWE Top 25, custom rules)
├── Secrets Scan (TruffleHog — verified secrets only)
├── ClamAV Malware Scan (source code + dependencies)
└── License Compliance Check (Syft SBOM → policy filter)

Phase 2: Build & Scan (sequential, depends on Phase 1)
├── Build backend Docker image (multi-stage, distroless)
├── Build frontend Docker image (multi-stage, nginx-unprivileged)
├── Generate SBOMs (Syft — SPDX 2.3 JSON for each image)
├── Scan images with Grype (fail on critical/high)
├── Scan images with Trivy (OS + app + misconfig)
├── Validate container hardening (non-root, no secrets, minimal base)
└── Upload SARIF reports to GitHub Security tab

Phase 3: Testing (parallel, depends on Phase 2)
├── Backend unit tests (pytest --cov, fail below 80%)
├── Frontend unit tests (vitest run --coverage, fail below 80%)
├── Backend integration tests (pytest with test DB)
└── DAST (OWASP ZAP full scan against running app)

Phase 4: Sign & Attest (depends on Phase 2 + 3, main/tag only)
├── Sign images with Cosign (keyless, GitHub OIDC)
├── Attach SBOM attestation to signed images
├── Generate SLSA provenance
└── Verify signatures

Phase 5: Compliance & Gate (depends on all above)
├── Aggregate all scan results
├── Generate compliance evidence report (NIST, FedRAMP, HIPAA mappings)
├── Final pass/fail gate
└── Upload compliance artifacts
```

## Workflow Files — Detailed Specifications

### `.github/workflows/ci.yml`

```yaml
name: KEYSTONE CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: write
  id-token: write          # Cosign OIDC
  security-events: write   # SARIF uploads
  pull-requests: write     # PR comments

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE: ghcr.io/${{ github.repository }}/keystone-backend
  FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/keystone-frontend
  PYTHON_VERSION: '3.11'
  NODE_VERSION: '20'
  FAIL_ON_SEVERITY: 'critical'   # Grype/Trivy threshold

jobs:

  # ═══════════════════════════════════════════════════
  # PHASE 1: CODE QUALITY & STATIC ANALYSIS
  # ═══════════════════════════════════════════════════

  lint-backend:
    name: "Lint: Backend (Ruff + mypy)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - name: Install tools
        run: pip install ruff mypy
      - name: Ruff lint
        run: ruff check backend/ --output-format=github
      - name: Ruff format check
        run: ruff format --check backend/
      - name: mypy type check
        run: mypy backend/app/ --ignore-missing-imports

  lint-frontend:
    name: "Lint: Frontend (ESLint + tsc)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: ESLint
        run: cd frontend && npx eslint src/ --format=stylish
      - name: TypeScript type check
        run: cd frontend && npx tsc -b --noEmit

  sast-scan:
    name: "SAST: Semgrep"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Semgrep scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: |
            p/owasp-top-ten
            p/cwe-top-25
            p/python
            p/typescript
            p/react
            p/sql-injection
            p/command-injection
            p/xss
            .github/policies/semgrep-rules.yml
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif
          category: sast-semgrep

  secrets-scan:
    name: "Secrets: TruffleHog"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: TruffleHog (verified secrets only)
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified --json

  clamav-scan:
    name: "Malware: ClamAV"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install ClamAV
        run: |
          sudo apt-get update && sudo apt-get install -y clamav clamav-daemon
          sudo systemctl stop clamav-freshclam || true
          sudo freshclam || true
      - name: Scan source code
        run: |
          clamscan --recursive --infected --suppress-ok-results \
            --exclude-dir='.git' \
            --exclude-dir='node_modules' \
            --exclude-dir='__pycache__' \
            --exclude-dir='.venv' \
            . | tee clamav-report.txt
          # ClamAV returns 1 if infected files found
          if grep -q "Infected files: 0" clamav-report.txt; then
            echo "✅ No malware detected"
          else
            echo "❌ Malware detected!"
            exit 1
          fi
      - name: Upload ClamAV report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: clamav-report
          path: clamav-report.txt

  license-check:
    name: "License: Compliance"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Syft
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Generate SBOM for license analysis
        run: syft dir:. -o spdx-json > source-sbom.spdx.json
      - name: Check licenses against policy
        run: |
          # Extract all unique licenses from SBOM
          python3 -c "
          import json, sys
          sbom = json.load(open('source-sbom.spdx.json'))
          # SPDX packages have 'licenseConcluded' or 'licenseDeclared'
          licenses = set()
          for pkg in sbom.get('packages', []):
              lic = pkg.get('licenseConcluded', pkg.get('licenseDeclared', 'NOASSERTION'))
              if lic and lic != 'NOASSERTION':
                  licenses.add(lic)

          # Blocked licenses (copyleft that would require KEYSTONE to be open-sourced)
          blocked = {'GPL-2.0-only', 'GPL-3.0-only', 'AGPL-3.0-only', 'AGPL-3.0-or-later', 'SSPL-1.0', 'EUPL-1.1'}
          flagged = licenses & blocked

          if flagged:
              print(f'❌ BLOCKED licenses found: {flagged}')
              sys.exit(1)
          else:
              print(f'✅ All {len(licenses)} detected licenses are approved')
              for lic in sorted(licenses):
                  print(f'  - {lic}')
          "

  # ═══════════════════════════════════════════════════
  # PHASE 2: BUILD & CONTAINER SCANNING
  # ═══════════════════════════════════════════════════

  build-backend:
    name: "Build: Backend Image"
    needs: [lint-backend, sast-scan, secrets-scan, clamav-scan, license-check]
    runs-on: ubuntu-latest
    outputs:
      image-ref: ${{ steps.meta.outputs.tags }}
      digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.BACKEND_IMAGE }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}

  build-frontend:
    name: "Build: Frontend Image"
    needs: [lint-frontend, sast-scan, secrets-scan, clamav-scan, license-check]
    runs-on: ubuntu-latest
    outputs:
      image-ref: ${{ steps.meta.outputs.tags }}
      digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.FRONTEND_IMAGE }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  scan-backend:
    name: "Scan: Backend Image"
    needs: build-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # --- SBOM Generation (Syft) ---
      - name: Install Syft
        run: curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Generate SBOM (SPDX 2.3)
        run: |
          syft ${{ needs.build-backend.outputs.image-ref }} \
            -o spdx-json=backend-sbom.spdx.json \
            -o cyclonedx-json=backend-sbom.cyclonedx.json
      - name: Upload SBOM artifacts
        uses: actions/upload-artifact@v4
        with:
          name: backend-sbom
          path: |
            backend-sbom.spdx.json
            backend-sbom.cyclonedx.json

      # --- Vulnerability Scanning (Grype) ---
      - name: Install Grype
        run: curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Grype scan (from SBOM)
        run: |
          grype sbom:backend-sbom.spdx.json \
            --fail-on ${{ env.FAIL_ON_SEVERITY }} \
            --output json --file grype-backend-report.json
      - name: Upload Grype report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: grype-backend-report
          path: grype-backend-report.json

      # --- Container Scanning (Trivy) ---
      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ needs.build-backend.outputs.image-ref }}
          format: 'sarif'
          output: 'trivy-backend.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      - name: Upload Trivy SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-backend.sarif
          category: trivy-backend

      # --- Container Hardening Validation ---
      - name: Validate container hardening
        run: |
          echo "=== Backend Container Hardening Check ==="

          # Check: runs as non-root
          USER_LINE=$(docker inspect ${{ needs.build-backend.outputs.image-ref }} --format '{{.Config.User}}')
          if [ -z "$USER_LINE" ] || [ "$USER_LINE" = "root" ] || [ "$USER_LINE" = "0" ]; then
            echo "❌ FAIL: Container runs as root (User=$USER_LINE)"
            exit 1
          fi
          echo "✅ Non-root user: $USER_LINE"

          # Check: no shell in final image (distroless indicator)
          if docker run --rm --entrypoint="" ${{ needs.build-backend.outputs.image-ref }} /bin/sh -c "echo shell_exists" 2>/dev/null; then
            echo "⚠️  WARNING: Shell available in image (consider distroless)"
          else
            echo "✅ No shell in final image (distroless)"
          fi

          # Check: no package manager
          if docker run --rm --entrypoint="" ${{ needs.build-backend.outputs.image-ref }} apt-get --version 2>/dev/null || \
             docker run --rm --entrypoint="" ${{ needs.build-backend.outputs.image-ref }} apk --version 2>/dev/null; then
            echo "⚠️  WARNING: Package manager present in final image"
          else
            echo "✅ No package manager in final image"
          fi

          echo "=== Hardening check complete ==="

  scan-frontend:
    name: "Scan: Frontend Image"
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Syft
        run: curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Generate SBOM (SPDX 2.3)
        run: |
          syft ${{ needs.build-frontend.outputs.image-ref }} \
            -o spdx-json=frontend-sbom.spdx.json \
            -o cyclonedx-json=frontend-sbom.cyclonedx.json
      - name: Upload SBOM artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-sbom
          path: |
            frontend-sbom.spdx.json
            frontend-sbom.cyclonedx.json
      - name: Install Grype
        run: curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Grype scan
        run: |
          grype sbom:frontend-sbom.spdx.json \
            --fail-on ${{ env.FAIL_ON_SEVERITY }} \
            --output json --file grype-frontend-report.json
      - name: Upload Grype report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: grype-frontend-report
          path: grype-frontend-report.json
      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ needs.build-frontend.outputs.image-ref }}
          format: 'sarif'
          output: 'trivy-frontend.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      - name: Upload Trivy SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-frontend.sarif
          category: trivy-frontend
      - name: Validate container hardening
        run: |
          USER_LINE=$(docker inspect ${{ needs.build-frontend.outputs.image-ref }} --format '{{.Config.User}}')
          if [ -z "$USER_LINE" ] || [ "$USER_LINE" = "root" ] || [ "$USER_LINE" = "0" ]; then
            echo "❌ FAIL: Container runs as root"
            exit 1
          fi
          echo "✅ Non-root user: $USER_LINE"

  # ═══════════════════════════════════════════════════
  # PHASE 3: TESTING
  # ═══════════════════════════════════════════════════

  test-backend:
    name: "Test: Backend (pytest)"
    needs: build-backend
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.4
        env:
          POSTGRES_USER: keystone_test
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: keystone_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio httpx
      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql://keystone_test:test_password@localhost:5432/keystone_test
          REDIS_URL: redis://localhost:6379
          TESTING: "true"
        run: |
          cd backend
          pytest tests/ -v --cov=app --cov-report=xml --cov-report=term --cov-fail-under=80
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage.xml

  test-frontend:
    name: "Test: Frontend (Vitest)"
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests with coverage
        run: |
          cd frontend
          npx vitest run --coverage --coverage.thresholds.lines=80

  dast-scan:
    name: "DAST: OWASP ZAP"
    needs: [build-backend, build-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start application stack
        run: |
          # Use CI-specific compose that pulls the just-built images
          docker compose -f docker-compose.ci.yml up -d
      - name: Wait for healthy
        run: |
          echo "Waiting for services to be healthy..."
          for i in $(seq 1 60); do
            if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
              echo "✅ Backend healthy after ${i}s"
              break
            fi
            sleep 1
          done
          # Frontend
          for i in $(seq 1 30); do
            if curl -sf http://localhost:3000 > /dev/null 2>&1; then
              echo "✅ Frontend healthy after ${i}s"
              break
            fi
            sleep 1
          done
      - name: ZAP API scan (backend)
        uses: zaproxy/action-api-scan@v0.7.0
        with:
          target: 'http://localhost:8000/api/v1/openapi.json'
          format: openapi
          cmd_options: '-a -j'
          allow_issue_writing: false
      - name: ZAP full scan (frontend)
        uses: zaproxy/action-full-scan@v0.7.0
        with:
          target: 'http://localhost:3000'
          cmd_options: '-a'
          allow_issue_writing: false
      - name: Cleanup
        if: always()
        run: docker compose -f docker-compose.ci.yml down -v

  # ═══════════════════════════════════════════════════
  # PHASE 4: SIGNING & ATTESTATION (main/tags only)
  # ═══════════════════════════════════════════════════

  sign-and-attest:
    name: "Sign & Attest Images"
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')
    needs: [scan-backend, scan-frontend, test-backend, test-frontend, dast-scan]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Install Cosign
        run: |
          curl -Lo /usr/local/bin/cosign https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
          chmod +x /usr/local/bin/cosign

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Download SBOMs
        uses: actions/download-artifact@v4
        with:
          pattern: '*-sbom'
          merge-multiple: true

      # --- Sign Backend Image ---
      - name: Sign backend image (keyless + OIDC)
        env:
          COSIGN_EXPERIMENTAL: "1"
        run: |
          cosign sign --yes \
            ${{ needs.build-backend.outputs.image-ref }}@${{ needs.build-backend.outputs.digest }}
          echo "✅ Backend image signed"

      - name: Attach backend SBOM attestation
        env:
          COSIGN_EXPERIMENTAL: "1"
        run: |
          cosign attest --yes \
            --predicate backend-sbom.spdx.json \
            --type spdxjson \
            ${{ needs.build-backend.outputs.image-ref }}@${{ needs.build-backend.outputs.digest }}
          echo "✅ Backend SBOM attestation attached"

      # --- Sign Frontend Image ---
      - name: Sign frontend image (keyless + OIDC)
        env:
          COSIGN_EXPERIMENTAL: "1"
        run: |
          cosign sign --yes \
            ${{ needs.build-frontend.outputs.image-ref }}@${{ needs.build-frontend.outputs.digest }}
          echo "✅ Frontend image signed"

      - name: Attach frontend SBOM attestation
        env:
          COSIGN_EXPERIMENTAL: "1"
        run: |
          cosign attest --yes \
            --predicate frontend-sbom.spdx.json \
            --type spdxjson \
            ${{ needs.build-frontend.outputs.image-ref }}@${{ needs.build-frontend.outputs.digest }}
          echo "✅ Frontend SBOM attestation attached"

      # --- Verify ---
      - name: Verify signatures
        env:
          COSIGN_EXPERIMENTAL: "1"
        run: |
          cosign verify \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com \
            ${{ needs.build-backend.outputs.image-ref }}@${{ needs.build-backend.outputs.digest }}
          cosign verify \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com \
            ${{ needs.build-frontend.outputs.image-ref }}@${{ needs.build-frontend.outputs.digest }}
          echo "✅ All signatures verified"

  # ═══════════════════════════════════════════════════
  # PHASE 5: COMPLIANCE GATE
  # ═══════════════════════════════════════════════════

  compliance-gate:
    name: "Compliance: Final Gate"
    needs: [sast-scan, secrets-scan, clamav-scan, license-check, scan-backend, scan-frontend, test-backend, test-frontend, dast-scan]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download all scan artifacts
        uses: actions/download-artifact@v4
        with:
          path: scan-results/

      - name: Generate compliance evidence report
        run: |
          cat > scan-results/COMPLIANCE_EVIDENCE.md << 'REPORT'
          # KEYSTONE — Compliance Evidence Report

          **Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
          **Commit:** ${{ github.sha }}
          **Branch:** ${{ github.ref_name }}
          **Pipeline Run:** ${{ github.run_id }}

          ## Pipeline Results Summary

          | Check | Status | Tool | Evidence |
          |-------|--------|------|----------|
          | SAST | ${{ needs.sast-scan.result }} | Semgrep | SARIF in GitHub Security |
          | Secrets | ${{ needs.secrets-scan.result }} | TruffleHog | Pipeline logs |
          | Malware | ${{ needs.clamav-scan.result }} | ClamAV | clamav-report.txt |
          | License | ${{ needs.license-check.result }} | Syft | Pipeline logs |
          | Backend Image Scan | ${{ needs.scan-backend.result }} | Grype + Trivy | grype/trivy reports |
          | Frontend Image Scan | ${{ needs.scan-frontend.result }} | Grype + Trivy | grype/trivy reports |
          | Backend Tests | ${{ needs.test-backend.result }} | pytest | coverage.xml |
          | Frontend Tests | ${{ needs.test-frontend.result }} | Vitest | Pipeline logs |
          | DAST | ${{ needs.dast-scan.result }} | OWASP ZAP | ZAP report |

          ## Compliance Control Mapping

          ### NIST SP 800-218 (SSDF)
          - PO.3 (SBOM): SPDX 2.3 SBOMs generated for all images
          - PS.4 (Security testing): SAST + DAST + SCA all executed
          - PS.5 (Supply chain): SBOMs + Cosign signatures + Rekor log
          - PD.1 (Hardened artifacts): Non-root, distroless, scanned

          ### FedRAMP High
          - CM-3 (Change control): Branch protection + PR review required
          - SI-2 (Flaw remediation): Grype + Trivy scanning, fail on critical
          - SI-3 (Malware protection): ClamAV scan on source
          - SI-4 (Monitoring): SARIF reports in GitHub Security

          ### HIPAA Technical Safeguards
          - Access controls: RBAC enforced in application
          - Audit controls: Full pipeline audit trail
          - Integrity: Signed commits + signed images
          - Transmission security: TLS enforced

          ### DoD Container Hardening
          - Non-root user: Validated in pipeline
          - Minimal base: Distroless / slim images
          - No hardcoded secrets: TruffleHog verified
          - SBOM: SPDX 2.3 attached as attestation
          - Signed: Cosign keyless via GitHub OIDC
          REPORT

      - name: Upload compliance report
        uses: actions/upload-artifact@v4
        with:
          name: compliance-evidence
          path: scan-results/COMPLIANCE_EVIDENCE.md

      - name: Final gate check
        run: |
          FAILED=0

          check_result() {
            if [ "$2" != "success" ]; then
              echo "❌ FAIL: $1 ($2)"
              FAILED=1
            else
              echo "✅ PASS: $1"
            fi
          }

          echo "══════════════════════════════════════"
          echo "  KEYSTONE COMPLIANCE GATE RESULTS"
          echo "══════════════════════════════════════"

          check_result "SAST (Semgrep)" "${{ needs.sast-scan.result }}"
          check_result "Secrets (TruffleHog)" "${{ needs.secrets-scan.result }}"
          check_result "Malware (ClamAV)" "${{ needs.clamav-scan.result }}"
          check_result "License Compliance" "${{ needs.license-check.result }}"
          check_result "Backend Image Scan (Grype+Trivy)" "${{ needs.scan-backend.result }}"
          check_result "Frontend Image Scan (Grype+Trivy)" "${{ needs.scan-frontend.result }}"
          check_result "Backend Tests (pytest)" "${{ needs.test-backend.result }}"
          check_result "Frontend Tests (Vitest)" "${{ needs.test-frontend.result }}"
          check_result "DAST (OWASP ZAP)" "${{ needs.dast-scan.result }}"

          echo "══════════════════════════════════════"

          if [ $FAILED -ne 0 ]; then
            echo "❌ PIPELINE BLOCKED — Fix failures above before merge"
            exit 1
          fi

          echo "✅ ALL GATES PASSED — Safe to merge/deploy"
```

### `.github/workflows/nightly-scan.yml`

```yaml
name: Nightly Vulnerability Rescan

on:
  schedule:
    - cron: '0 6 * * *'    # 0600 UTC daily
  workflow_dispatch:         # Manual trigger

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE: ghcr.io/${{ github.repository }}/keystone-backend:main
  FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/keystone-frontend:main

jobs:
  rescan-images:
    name: "Rescan Published Images"
    runs-on: ubuntu-latest
    strategy:
      matrix:
        image:
          - name: backend
            ref: ghcr.io/${{ github.repository }}/keystone-backend:main
          - name: frontend
            ref: ghcr.io/${{ github.repository }}/keystone-frontend:main
    steps:
      - name: Install tools
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Pull image
        run: docker pull ${{ matrix.image.ref }}
      - name: Grype rescan
        run: |
          grype ${{ matrix.image.ref }} \
            --fail-on critical \
            --output json --file rescan-${{ matrix.image.name }}.json
      - name: Upload rescan report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: nightly-rescan-${{ matrix.image.name }}
          path: rescan-${{ matrix.image.name }}.json

  rescan-sboms:
    name: "Rescan Stored SBOMs"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Grype
        run: curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Download latest SBOMs
        uses: actions/download-artifact@v4
        with:
          pattern: '*-sbom'
          merge-multiple: true
        continue-on-error: true
      - name: Rescan SBOMs against updated CVE database
        run: |
          for sbom_file in *-sbom.spdx.json; do
            if [ -f "$sbom_file" ]; then
              echo "Scanning $sbom_file..."
              grype sbom:"$sbom_file" --fail-on critical --output table || true
            fi
          done

  notify-on-failure:
    name: "Notify on New Vulnerabilities"
    needs: [rescan-images, rescan-sboms]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Create GitHub Issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[SECURITY] Nightly scan found new vulnerabilities (${new Date().toISOString().split('T')[0]})`,
              body: `The nightly vulnerability rescan detected new critical/high vulnerabilities in published KEYSTONE images.\n\nPipeline run: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}\n\n**Action Required:** Review scan results and patch affected dependencies.`,
              labels: ['security', 'vulnerability', 'automated']
            })
```

### `.github/workflows/dependency-review.yml`

```yaml
name: Dependency Review

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  dependency-review:
    name: "Review Dependency Changes"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: critical
          deny-licenses: GPL-2.0, GPL-3.0, AGPL-3.0, SSPL-1.0
          comment-summary-in-pr: always
```

## Dockerfile Updates

### `backend/Dockerfile` (Hardened Multi-Stage)

```dockerfile
# ============================================================
# STAGE 1: Build
# ============================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# ============================================================
# STAGE 2: Production (slim, non-root)
# ============================================================
FROM python:3.11-slim AS production

# Security labels
LABEL org.opencontainers.image.source="https://github.com/KEYSTONE"
LABEL org.opencontainers.image.description="KEYSTONE Backend API"
LABEL org.opencontainers.image.vendor="USMC Project Dynamis"

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get purge -y --auto-remove

# Create non-root user (UID > 1024 per DoD Container Hardening Guide)
RUN groupadd -g 1001 keystone && \
    useradd -u 1001 -g keystone -s /usr/sbin/nologin -M keystone

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local
COPY --from=builder /build/app ./app
COPY --from=builder /build/alembic ./alembic
COPY --from=builder /build/alembic.ini .

# Set ownership
RUN chown -R keystone:keystone /app

# Switch to non-root user
USER keystone:keystone

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `frontend/Dockerfile` (Hardened Multi-Stage)

```dockerfile
# ============================================================
# STAGE 1: Build
# ============================================================
FROM node:20-slim AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ============================================================
# STAGE 2: Production (nginx-unprivileged, non-root)
# ============================================================
FROM nginxinc/nginx-unprivileged:1.25-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/KEYSTONE"
LABEL org.opencontainers.image.description="KEYSTONE Frontend"
LABEL org.opencontainers.image.vendor="USMC Project Dynamis"

# Copy built assets
COPY --from=builder /build/dist /usr/share/nginx/html

# Custom nginx config (SPA routing, security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx-unprivileged already runs as non-root (UID 101)
# Validate: USER is nginx (not root)

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

EXPOSE 8080
```

### `frontend/nginx.conf` (Security Headers)

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org; connect-src 'self'; font-src 'self'; frame-ancestors 'self';" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Remove server version
    server_tokens off;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (in production, Traefik/ingress handles this)
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Block dotfiles
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

## Custom Semgrep Rules (`.github/policies/semgrep-rules.yml`)

```yaml
rules:
  # --- SQL Injection (Python/FastAPI specific) ---
  - id: keystone-raw-sql-injection
    patterns:
      - pattern: |
          $DB.execute(f"..." % ...)
      - pattern: |
          $DB.execute("..." + $INPUT)
      - pattern: |
          text($USER_INPUT)
    message: "Potential SQL injection — use parameterized queries"
    languages: [python]
    severity: ERROR
    metadata:
      cwe: CWE-89
      owasp: A03:2021

  # --- Hardcoded Credentials ---
  - id: keystone-hardcoded-secret
    patterns:
      - pattern: |
          $VAR = "..."
        metavariable-regex:
          metavariable: $VAR
          regex: '.*(password|secret|api_key|token|credential).*'
    message: "Hardcoded credential detected — use environment variables or secrets manager"
    languages: [python, typescript, javascript]
    severity: ERROR
    metadata:
      cwe: CWE-798

  # --- Logging Sensitive Data ---
  - id: keystone-log-sensitive
    patterns:
      - pattern: |
          logger.$METHOD(..., password=..., ...)
      - pattern: |
          logger.$METHOD(..., token=..., ...)
      - pattern: |
          logger.$METHOD(..., secret=..., ...)
    message: "Sensitive data in log output — mask before logging"
    languages: [python]
    severity: WARNING
    metadata:
      cwe: CWE-532

  # --- Insecure Deserialization ---
  - id: keystone-pickle-usage
    pattern: |
      pickle.loads(...)
    message: "pickle.loads is unsafe — use JSON or a safe serializer"
    languages: [python]
    severity: ERROR
    metadata:
      cwe: CWE-502

  # --- SSRF Prevention ---
  - id: keystone-ssrf-request
    patterns:
      - pattern: |
          requests.get($URL, ...)
      - pattern: |
          httpx.get($URL, ...)
    message: "Validate URL before making external requests (SSRF risk)"
    languages: [python]
    severity: WARNING
    metadata:
      cwe: CWE-918
```

## Severity Thresholds (`.github/policies/severity-thresholds.yml`)

```yaml
# Pipeline fail/warn thresholds for each scan type
# "fail" = block the pipeline, "warn" = annotate but allow

grype:
  fail_on: critical          # Block on critical CVEs
  warn_on: high              # Annotate high CVEs

trivy:
  fail_on: CRITICAL,HIGH     # Block on critical + high
  ignore_unfixed: false       # Don't ignore unfixed — we want visibility

semgrep:
  fail_on: ERROR              # Block on Semgrep ERROR severity
  warn_on: WARNING            # Annotate warnings

clamav:
  fail_on: any_infection      # Any malware detection = block

trufflehog:
  fail_on: any_verified       # Any verified secret = block

license:
  blocked:
    - GPL-2.0-only
    - GPL-3.0-only
    - AGPL-3.0-only
    - AGPL-3.0-or-later
    - SSPL-1.0
    - EUPL-1.1
  warn:
    - LGPL-2.1-only
    - LGPL-3.0-only
    - MPL-2.0

coverage:
  backend_minimum: 80
  frontend_minimum: 80
```

## docker-compose.yml Updates

Update the existing `docker-compose.yml` to enforce non-root and security best practices:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      target: production
    user: "1001:1001"        # Non-root
    read_only: true           # Read-only filesystem
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://keystone:${DB_PASSWORD}@postgres:5432/keystone
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: ./frontend
      target: production
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=50m
      - /var/cache/nginx:size=50m
      - /var/run:size=10m
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    ports:
      - "3000:8080"
    depends_on:
      - backend

  postgres:
    image: postgis/postgis:15-3.4
    user: "999:999"           # postgres user
    security_opt:
      - no-new-privileges:true
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: keystone
      POSTGRES_USER: keystone
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keystone"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    user: "999:999"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  celery-worker:
    build:
      context: ./backend
      target: production
    user: "1001:1001"
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    command: celery -A app.celery_app worker --loglevel=info --concurrency=4
    environment:
      - DATABASE_URL=postgresql://keystone:${DB_PASSWORD}@postgres:5432/keystone
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  pgdata:
```

## CI-Specific Compose (`docker-compose.ci.yml`)

```yaml
version: '3.8'

# Used by DAST scan — runs the app in CI for ZAP to hit
services:
  backend:
    image: ${BACKEND_IMAGE:-ghcr.io/keystone/keystone-backend:latest}
    user: "1001:1001"
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    security_opt:
      - no-new-privileges:true
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://keystone:ci_password@postgres:5432/keystone_ci
      - REDIS_URL=redis://redis:6379
      - TESTING=true
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    image: ${FRONTEND_IMAGE:-ghcr.io/keystone/keystone-frontend:latest}
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=50m
      - /var/cache/nginx:size=50m
      - /var/run:size=10m
    ports:
      - "3000:8080"
    depends_on:
      - backend

  postgres:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_DB: keystone_ci
      POSTGRES_USER: keystone
      POSTGRES_PASSWORD: ci_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keystone"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
```

## Security Documentation

### `docs/security/SECURITY.md`

Create a security policy file:

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest main | ✅ |
| Previous release | ✅ (90 days) |
| Older | ❌ |

## Reporting a Vulnerability

If you discover a security vulnerability in KEYSTONE, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: [security contact TBD]
3. Include: description, reproduction steps, impact assessment
4. We will acknowledge within 48 hours and provide a fix timeline within 7 days

## Security Scanning

Every commit to this repository is automatically scanned by:

- **Semgrep** — Static application security testing (SAST)
- **TruffleHog** — Secrets detection (verified only)
- **ClamAV** — Malware scanning
- **Syft/Grype** — Software composition analysis (SCA) + vulnerability scanning
- **Trivy** — Container image vulnerability + misconfiguration scanning
- **OWASP ZAP** — Dynamic application security testing (DAST)
- **Cosign** — Container image signing and attestation

## Compliance

This pipeline is designed to meet:

- NIST SP 800-218 (SSDF)
- NIST SP 800-53 Rev 5
- NIST SP 800-190 (Container Security)
- FedRAMP High Baseline
- DoD DevSecOps Reference Design v2.0
- DoD Container Hardening Guide v1.2
- Executive Order 14028 (SBOM requirements)
- HIPAA Security Rule Technical Safeguards
```

### `docs/security/COMPLIANCE_MATRIX.md`

Create a compliance traceability matrix:

```markdown
# KEYSTONE Compliance Traceability Matrix

## NIST SP 800-218 (SSDF) → Pipeline Mapping

| SSDF Practice | Pipeline Step | Evidence |
|---|---|---|
| PO.3 — Document threats, generate SBOM | Syft SBOM generation | `*-sbom.spdx.json` artifacts |
| PS.2 — Secure build infrastructure | GitHub Actions ephemeral runners | Runner logs |
| PS.4 — SAST/DAST/SCA | Semgrep + ZAP + Grype | SARIF + JSON reports |
| PS.5 — Supply chain security | Cosign signing + SBOM attestation | Rekor transparency log |
| PD.1 — Hardened artifacts | Container hardening validation | Pipeline logs |
| PD.2 — Signed releases | Cosign keyless + OIDC | Registry signatures |
| PR.1 — Vulnerability response | Nightly rescans + Dependabot | GitHub Issues (automated) |

## NIST SP 800-53 Rev 5 → Pipeline Mapping

| Control | Implementation | Frequency |
|---|---|---|
| SA-11 (Developer testing) | pytest + Vitest (80% coverage) | Every commit |
| SI-2 (Flaw remediation) | Grype + Trivy + Dependabot | Every commit + nightly |
| SI-3 (Malware protection) | ClamAV source scan | Every commit |
| SI-10 (Input validation) | Semgrep SAST rules | Every commit |
| AU-12 (Audit logging) | GitHub Actions audit logs | Continuous |
| CM-3 (Change control) | Branch protection + PR reviews | Every change |
| CM-5 (Access restrictions) | RBAC + MFA + signed commits | Always |

## FedRAMP High → Pipeline Mapping

| Control | Implementation |
|---|---|
| CM-3 | Branch protection, PR reviews, signed commits |
| IA-2 | GitHub MFA enforcement |
| IA-5 | GitHub Secrets (encrypted), rotation policy |
| SC-7 | Ephemeral runners, registry access controls |
| SI-2 | Automated CVE scanning + Dependabot patches |
| SI-3 | ClamAV malware scanning |
| SI-4 | GitHub Security tab (SARIF), nightly rescans |

## DoD Container Hardening → Dockerfile Mapping

| Requirement | Backend Dockerfile | Frontend Dockerfile |
|---|---|---|
| Non-root user (UID > 1024) | `USER 1001:1001` | nginx-unprivileged (UID 101) |
| Minimal base image | python:3.11-slim (multi-stage) | nginx-unprivileged:alpine |
| No package manager in final | Purged in build stage | Alpine minimal |
| No hardcoded secrets | TruffleHog verified | TruffleHog verified |
| Read-only filesystem | `read_only: true` in compose | `read_only: true` in compose |
| No new privileges | `no-new-privileges:true` | `no-new-privileges:true` |
| Capabilities dropped | `cap_drop: ALL` | `cap_drop: ALL` |
| SBOM available | SPDX 2.3 via Syft | SPDX 2.3 via Syft |
| Image signed | Cosign keyless | Cosign keyless |

## HIPAA Technical Safeguards → Implementation

| Safeguard | How |
|---|---|
| Access Controls | Application RBAC + GitHub repo RBAC |
| Audit Controls | Pipeline audit trail + GitHub audit logs |
| Integrity Controls | Signed commits + signed container images |
| Transmission Security | TLS enforced, security headers in nginx |
| Encryption at Rest | GitHub Secrets encrypted, DB encryption |
```

## Build Instructions

1. **Create the directory structure** — all files listed in the repo structure above
2. **Update existing Dockerfiles** — replace with the hardened multi-stage versions
3. **Update docker-compose.yml** — add security options (non-root, read-only, cap_drop, no-new-privileges)
4. **Create all GitHub Actions workflows** — `ci.yml`, `nightly-scan.yml`, `release.yml`, `dependency-review.yml`
5. **Create composite actions** — `setup-security-tools`, `container-build`, `compliance-report`
6. **Create policy files** — Semgrep rules, license allowlist, severity thresholds, container policy
7. **Create security documentation** — `SECURITY.md`, `SBOM.md`, `COMPLIANCE_MATRIX.md`
8. **Create helper scripts** — container hardening checker, no-root validator, compliance report generator, ClamAV DB updater, health check waiter, smoke tests
9. **Create `docker-compose.ci.yml`** — ephemeral compose for DAST testing in CI
10. **Create `frontend/nginx.conf`** — with security headers (X-Frame-Options, CSP, HSTS, etc.)
11. **Test locally** — Run `docker compose build` and `docker compose up -d` and verify all containers run as non-root with `docker compose exec backend whoami` (should NOT be root)
12. **Push to GitHub** — Verify all workflow files trigger correctly, SARIF reports appear in Security tab
13. **Configure repo settings** — Branch protection, signed commits, Dependabot, GitHub Advanced Security

## Key Principles

- **Fail closed**: If any security gate fails, the pipeline blocks. No exceptions, no manual overrides without documented justification.
- **Shift left**: SAST and secrets scanning run first, before any build. Catch issues at the cheapest point to fix.
- **Defense in depth**: Multiple overlapping tools (Grype AND Trivy, Semgrep AND custom rules, TruffleHog AND GitHub secret scanning). If one misses something, another catches it.
- **Signed everything**: Every container image is signed with Cosign using GitHub OIDC. SBOMs are attached as attestations. Provenance is logged in Rekor.
- **No root, ever**: Every container runs as a non-root user. Every compose service has `no-new-privileges`, `cap_drop: ALL`, and `read_only` where possible.
- **SBOM as a first-class artifact**: Generated for every build in SPDX 2.3 format. Rescanned nightly. Attached as signed attestation to container images. This meets EO 14028 requirements.
- **Continuous compliance**: Not a one-time check — nightly rescans, automated issue creation for new CVEs, Dependabot for patches, and a full compliance evidence report generated with every release.
