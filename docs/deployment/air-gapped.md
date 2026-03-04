# Air-Gapped / SIPR / Classified Deployment

This guide covers deploying KEYSTONE in air-gapped, disconnected, or classified
network environments where no external internet access is available.

---

## Overview

KEYSTONE is designed to operate fully offline. Key architectural decisions
that enable air-gapped operation:

- All map tile requests route through an nginx proxy, which can point to a local
  tile server instead of internet sources
- No external CDN dependencies — all frontend assets are bundled
- No telemetry or analytics that phone home
- Self-contained Docker images with all dependencies baked in
- Classification banner system for UNCLASSIFIED through TS//SCI

---

## Prerequisites

### On the Connected Build Machine

- Docker Engine 24+
- Docker Compose v2
- Access to `ghcr.io/morbidsteve/keystone` or source code to build locally
- Sufficient disk space for image export (~2-3 GB)

### On the Air-Gapped Target

- Docker Engine 24+ (pre-installed)
- Docker Compose v2 (pre-installed)
- No internet connectivity required after image transfer

---

## Building Docker Images Offline

### Step 1: Build on Connected Network

```bash
# Clone and build all images
git clone https://github.com/morbidsteve/keystone.git
cd keystone
docker compose build
```

### Step 2: Export Images

```bash
# Save all images to a single archive
docker save \
  keystone-backend:latest \
  keystone-frontend:latest \
  postgis/postgis:15-3.4 \
  redis:7-alpine \
  | gzip > keystone-images-$(date +%Y%m%d).tar.gz

# Verify the archive
ls -lh keystone-images-*.tar.gz
# Expect ~1.5-2.5 GB
```

### Step 3: Transfer to Air-Gapped Network

Transfer the following to the target network via approved media
(burn disc, approved USB, cross-domain solution):

| File                                  | Purpose                |
|---------------------------------------|------------------------|
| `keystone-images-YYYYMMDD.tar.gz`     | Docker images          |
| `docker-compose.yml`                  | Compose configuration  |
| `.env` (create for target environment)| Environment variables  |
| Map tiles (MBTiles file, optional)    | Offline map data       |

### Step 4: Load Images on Target

```bash
# Load all images from the archive
docker load < keystone-images-YYYYMMDD.tar.gz

# Verify images are available
docker images | grep -E "keystone|postgis|redis"
```

### Step 5: Start the Stack

```bash
# Copy docker-compose.yml and .env to working directory
docker compose up -d
docker compose ps   # Verify all services are healthy
```

---

## Offline Map Tiles

KEYSTONE's map requires tile data. In air-gapped environments, use a local
tile server with pre-downloaded MBTiles files.

### Obtaining MBTiles (On Connected Network)

Download map tiles for your area of operations:

```bash
# Option 1: OpenMapTiles (full planet or regional extracts)
# Download from https://openmaptiles.org/ or https://download.geofabrik.de/

# Option 2: Use tilemaker to generate from OSM PBF files
# https://github.com/systemed/tilemaker

# Option 3: Use tippecanoe to generate from GeoJSON
```

Regional extracts are recommended to minimize file size:

| Region          | Approximate Size |
|-----------------|-----------------|
| Single country  | 500 MB - 5 GB  |
| Continent       | 10 - 30 GB     |
| Full planet     | 80+ GB         |

### Running tileserver-gl

Add a tile server to your `docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  tileserver:
    image: maptiler/tileserver-gl:latest
    volumes:
      - ./tiles:/data:ro
    ports:
      - "8081:8081"
    command: ["--port", "8081", "--verbose"]
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    restart: unless-stopped
```

Place your `.mbtiles` file in the `./tiles/` directory.

### Configuring KEYSTONE for Local Tiles

KEYSTONE's nginx proxy already includes a local tile route. The frontend
tile layer settings (Admin > Tile Layers) can be configured to use:

```
/tiles/local/{z}/{x}/{y}.png
```

This routes through nginx to the local tileserver container. No external DNS
or internet access is required.

If tileserver-gl is not available, nginx will gracefully fail on `/tiles/local/`
requests without affecting other functionality.

---

## No External DNS Required

KEYSTONE's nginx configuration uses Docker's internal DNS (`127.0.0.11`) for
inter-container resolution and does not require any external DNS servers.

For the frontend tile proxy, all `resolver` directives point to Docker's
embedded DNS. External resolvers (8.8.8.8) in the default config are only
used for the online tile proxy, which is bypassed when using local tiles.

Update `/etc/resolv.conf` on the host if needed for internal DNS resolution:

```
nameserver 10.0.0.1   # Your internal DNS
search your-domain.mil
```

---

## Certificate Management Without Let's Encrypt

In air-gapped environments, Let's Encrypt is not available. Use one of these
approaches:

### Option A: Enterprise / DoD PKI

1. Generate a CSR on the target machine:
   ```bash
   openssl req -new -newkey rsa:4096 -nodes \
     -keyout /etc/ssl/keystone/key.pem \
     -out /etc/ssl/keystone/keystone.csr \
     -subj "/C=US/O=USMC/OU=KEYSTONE/CN=keystone.your-domain.mil"
   ```

2. Submit the CSR to your enterprise CA / DoD PKI portal

3. Install the signed certificate:
   ```bash
   cp signed-cert.pem /etc/ssl/keystone/cert.pem
   # Ensure the full chain is included (intermediate + root CA)
   ```

### Option B: Self-Signed Certificate (Development/Testing)

```bash
mkdir -p /etc/ssl/keystone

openssl req -x509 -nodes -days 365 \
  -newkey rsa:4096 \
  -keyout /etc/ssl/keystone/key.pem \
  -out /etc/ssl/keystone/cert.pem \
  -subj "/C=US/O=USMC/OU=KEYSTONE/CN=keystone.local" \
  -addext "subjectAltName=DNS:keystone.local,IP:10.0.0.100"
```

### Option C: Internal CA

For long-term air-gapped deployments, consider running an internal CA:

```bash
# Generate CA key and certificate
openssl genrsa -out ca-key.pem 4096
openssl req -x509 -new -nodes -key ca-key.pem -days 3650 \
  -out ca-cert.pem -subj "/C=US/O=USMC/OU=KEYSTONE-CA/CN=KEYSTONE Root CA"

# Sign server certificates with your CA
openssl x509 -req -in keystone.csr -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out cert.pem -days 365

# Distribute ca-cert.pem to all client machines as a trusted root
```

Mount certificates into the frontend container:

```yaml
frontend:
  volumes:
    - /etc/ssl/keystone/cert.pem:/etc/nginx/ssl/cert.pem:ro
    - /etc/ssl/keystone/key.pem:/etc/nginx/ssl/key.pem:ro
```

---

## Classification Banner Configuration

KEYSTONE supports configurable classification banners from UNCLASSIFIED
through TS//SCI. Configure via the Admin panel or API:

### Via Admin UI

Navigate to Admin > Classification Settings and select the appropriate level:

| Level           | Banner Color         |
|----------------|---------------------|
| UNCLASSIFIED   | Green               |
| CUI            | Amber               |
| CONFIDENTIAL   | Blue                |
| SECRET         | Red                 |
| TOP SECRET     | Orange              |
| TOP SECRET//SCI| Yellow text on Red  |

### Via API

```bash
curl -X PUT https://localhost/api/v1/settings/classification \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "SECRET",
    "banner_text": "SECRET // REL TO USA, FVEY",
    "color": "red"
  }'
```

The banner appears at the top and bottom of every page and is included in all
generated reports.

---

## Data-at-Rest Encryption

### Database Encryption

For PostgreSQL data-at-rest encryption:

#### Full-Disk Encryption (Recommended)

```bash
# LUKS encryption for the database volume
cryptsetup luksFormat /dev/sdX
cryptsetup open /dev/sdX keystone-data
mkfs.ext4 /dev/mapper/keystone-data
mount /dev/mapper/keystone-data /var/lib/postgresql/data
```

#### PostgreSQL TDE (Transparent Data Encryption)

PostgreSQL 16+ supports TDE. For PostgreSQL 15, use full-disk encryption
or pgcrypto for column-level encryption of sensitive fields.

### Redis Encryption

Redis data is transient (task queues and cache). For classified environments:

- Enable Redis AUTH: `requirepass STRONG_PASSWORD`
- Use Redis TLS: configure `tls-port`, `tls-cert-file`, `tls-key-file`
- Consider encrypted tmpfs for Redis data directory

### Backup Encryption

Always encrypt database backups:

```bash
# Encrypted backup
pg_dump keystone | gpg --symmetric --cipher-algo AES256 \
  -o keystone_backup_$(date +%Y%m%d).sql.gpg

# Restore
gpg -d keystone_backup_20260301.sql.gpg | psql keystone
```

---

## Security Checklist for Classified Deployments

- [ ] Classification banner set to correct level
- [ ] TLS 1.2+ only (no TLS 1.0/1.1)
- [ ] Strong ciphers (FIPS 140-2 compliant)
- [ ] Data-at-rest encryption enabled (LUKS or equivalent)
- [ ] Database backups encrypted
- [ ] No external network connectivity
- [ ] Local tile server configured (no internet map tiles)
- [ ] DoD PKI certificates installed
- [ ] CAC/PIV authentication configured (if required)
- [ ] Audit logging enabled and forwarded to SIEM
- [ ] `ENV_MODE=production` set
- [ ] `SECRET_KEY` is cryptographically random
- [ ] Default accounts removed or password changed
- [ ] Host OS hardened per applicable STIG
- [ ] Docker daemon hardened per DoD Container Hardening Guide
- [ ] Firewall rules restrict access to authorized networks only
