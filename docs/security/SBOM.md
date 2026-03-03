# KEYSTONE Software Bill of Materials (SBOM)

## What is an SBOM?

A Software Bill of Materials (SBOM) is a formal, machine-readable inventory of all
components, libraries, and dependencies that make up a software product. Think of it as a
"nutrition label" for software -- it tells you exactly what ingredients are inside.

### Why SBOMs Matter

- **Vulnerability Management**: When a new CVE is disclosed (e.g., Log4Shell), an SBOM lets
  you instantly determine whether your software is affected.
- **License Compliance**: SBOMs enumerate the licenses of all dependencies, enabling legal
  review and ensuring compliance with organizational policies.
- **Supply Chain Transparency**: SBOMs provide visibility into the full dependency tree,
  including transitive dependencies that developers may not be aware of.
- **Regulatory Compliance**: Executive Order 14028 (May 2021) mandates SBOM generation for
  all software sold to the U.S. federal government.
- **Incident Response**: During a security incident, SBOMs accelerate the process of
  identifying affected components and determining blast radius.

## How KEYSTONE Generates SBOMs

### Generation Tool: Syft

KEYSTONE uses [Syft](https://github.com/anchore/syft) (by Anchore) to generate SBOMs
from source code and container images. Syft supports multiple ecosystems and produces
standards-compliant output.

### Formats Generated

| Format | Standard | Use Case |
|--------|----------|----------|
| SPDX 2.3 (JSON) | ISO/IEC 5962:2021 | Primary format - government/regulatory compliance |
| CycloneDX 1.5 (JSON) | OWASP Standard | Secondary format - vulnerability correlation |

### Generation Points

SBOMs are generated at multiple stages in the CI/CD pipeline:

1. **Source SBOM** (build time):
   ```bash
   syft dir:. -o spdx-json=sbom-source-spdx.json
   syft dir:. -o cyclonedx-json=sbom-source-cdx.json
   ```

2. **Container Image SBOM** (after Docker build):
   ```bash
   syft <image>:<tag> -o spdx-json=sbom-image-spdx.json
   syft <image>:<tag> -o cyclonedx-json=sbom-image-cdx.json
   ```

3. **Runtime SBOM** (deployed environment):
   Generated periodically to capture the actual running state, including any
   dynamically loaded components.

### SBOM Content

Each KEYSTONE SBOM includes:

- **Package Information**: Name, version, supplier, download URL
- **Relationships**: Dependency tree with DEPENDS_ON, CONTAINS relationships
- **Checksums**: SHA-256 hashes for all components
- **License Data**: SPDX license identifiers for each package
- **External References**: Links to source repositories, issue trackers, advisories
- **Creation Information**: Tool version, creation timestamp, creator identity
- **Document Metadata**: SPDX document namespace, document name

## Where SBOMs Are Stored

### GitHub Actions Artifacts

SBOMs are uploaded as build artifacts on every CI run and retained for 90 days.

```
Actions Run -> Artifacts:
  sbom-source-spdx.json
  sbom-source-cdx.json
  sbom-image-spdx.json
  sbom-image-cdx.json
```

### Container Image Attestations

SBOMs are attached directly to container images as OCI attestations using Cosign:

```bash
# Attach SBOM attestation to image
cosign attest --predicate sbom-image-spdx.json \
  --type spdxjson \
  <registry>/<image>:<tag>
```

This ensures the SBOM travels with the image through any registry or deployment.

### Release Assets

For tagged releases, SBOMs are published as GitHub Release assets alongside the
release binaries.

## How to Consume and Verify SBOMs

### Downloading SBOMs

**From GitHub Releases**:
```bash
gh release download v1.0.0 --pattern '*sbom*'
```

**From Container Images**:
```bash
# Verify and extract SBOM attestation
cosign verify-attestation --type spdxjson \
  <registry>/<image>:<tag> | jq -r '.payload' | base64 -d
```

**From CI Artifacts**:
```bash
gh run download <run-id> --name sbom-artifacts
```

### Verifying SBOM Integrity

SBOMs are signed alongside the container images. Verification:

```bash
# Verify image signature (which covers attestations including SBOM)
cosign verify <registry>/<image>:<tag> \
  --certificate-identity-regexp='.*' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com'
```

### Analyzing SBOMs

**Search for a specific package**:
```bash
# Using jq with SPDX
jq '.packages[] | select(.name == "lodash")' sbom-source-spdx.json

# Using Grype to scan SBOM for vulnerabilities
grype sbom:sbom-source-spdx.json
```

**Convert between formats**:
```bash
# SPDX to CycloneDX
syft convert sbom-source-spdx.json -o cyclonedx-json
```

**Generate human-readable summary**:
```bash
# List all packages with versions
jq -r '.packages[] | "\(.name) \(.versionInfo)"' sbom-source-spdx.json | sort
```

## EO 14028 Compliance

Executive Order 14028, "Improving the Nation's Cybersecurity" (May 12, 2021), Section 4
requires software suppliers to the federal government to provide SBOMs. KEYSTONE's SBOM
practices address the following requirements:

| EO 14028 Requirement | KEYSTONE Implementation |
|----------------------|------------------------|
| SBOM generation for all software | Syft generates SBOMs at source and image levels |
| Machine-readable format | SPDX 2.3 JSON (ISO/IEC 5962:2021) |
| NTIA Minimum Elements | All required fields populated (supplier, component name, version, unique identifier, dependency relationship, author, timestamp) |
| Automated generation | CI/CD pipeline generates SBOMs on every build |
| Frequency of updates | New SBOM generated on every commit to main branch |
| Access and delivery | Published as release assets, image attestations, and CI artifacts |
| Vulnerability correlation | Grype and Trivy scan SBOMs for known vulnerabilities |
| Integrity and authenticity | SBOMs are signed via Cosign keyless signing (Sigstore) |

### NTIA Minimum Elements Checklist

| Element | Field in SPDX | Populated |
|---------|---------------|-----------|
| Supplier Name | `packages[].supplier` | Yes |
| Component Name | `packages[].name` | Yes |
| Version | `packages[].versionInfo` | Yes |
| Unique Identifier | `packages[].SPDXID` | Yes |
| Dependency Relationship | `relationships[]` | Yes |
| Author of SBOM Data | `creationInfo.creators` | Yes |
| Timestamp | `creationInfo.created` | Yes |

## Further Reading

- [NTIA SBOM Minimum Elements](https://www.ntia.doc.gov/report/2021/minimum-elements-software-bill-materials-sbom)
- [SPDX Specification](https://spdx.github.io/spdx-spec/v2.3/)
- [CycloneDX Specification](https://cyclonedx.org/specification/overview/)
- [EO 14028 Full Text](https://www.whitehouse.gov/briefing-room/presidential-actions/2021/05/12/executive-order-on-improving-the-nations-cybersecurity/)
- [CISA SBOM Resources](https://www.cisa.gov/sbom)
