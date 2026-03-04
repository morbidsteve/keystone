# On-Premises / Bare Metal Deployment

This guide covers deploying KEYSTONE directly on physical or virtual servers without
container orchestration.

---

## System Requirements

| Resource   | Minimum         | Recommended       |
|------------|-----------------|-------------------|
| CPU        | 4 cores         | 8 cores           |
| RAM        | 8 GB            | 16 GB             |
| Disk       | 50 GB SSD       | 200 GB SSD        |
| OS         | Ubuntu 22.04 LTS / RHEL 8+ | Ubuntu 24.04 LTS / RHEL 9 |
| Network    | 1 Gbps          | 1 Gbps            |

---

## Installing Dependencies

### PostgreSQL 15+ with PostGIS

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y postgresql-15 postgresql-15-postgis-3

# RHEL / Rocky / Alma
sudo dnf install -y postgresql15-server postgresql15-contrib postgis34_15

# Initialize and start
sudo postgresql-setup --initdb   # RHEL only
sudo systemctl enable --now postgresql
```

Create the database and user:

```bash
sudo -u postgres psql <<SQL
CREATE USER keystone WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE keystone OWNER keystone;
\c keystone
CREATE EXTENSION IF NOT EXISTS postgis;
SQL
```

### Redis 7+

```bash
# Ubuntu / Debian
sudo apt install -y redis-server
sudo systemctl enable --now redis-server

# RHEL
sudo dnf install -y redis
sudo systemctl enable --now redis
```

Verify: `redis-cli ping` should return `PONG`.

### Python 3.11+

```bash
# Ubuntu 24.04 (Python 3.11+ included)
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# RHEL 8/9
sudo dnf install -y python3.11 python3.11-devel
```

### Node.js 20 LTS

```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v20.x
npm --version    # 10.x
```

---

## Backend Setup

### Create Application Directory

```bash
sudo mkdir -p /opt/keystone
sudo useradd -r -s /usr/sbin/nologin -d /opt/keystone keystone
sudo chown keystone:keystone /opt/keystone
```

### Clone and Configure

```bash
cd /opt/keystone
sudo -u keystone git clone https://github.com/morbidsteve/keystone.git app
cd app/backend
```

### Python Virtual Environment

```bash
sudo -u keystone python3.11 -m venv /opt/keystone/venv
sudo -u keystone /opt/keystone/venv/bin/pip install --upgrade pip
sudo -u keystone /opt/keystone/venv/bin/pip install -r requirements.txt
```

### Environment Configuration

Create `/opt/keystone/.env`:

```env
DATABASE_URL=postgresql+asyncpg://keystone:CHANGE_ME_STRONG_PASSWORD@localhost:5432/keystone
DATABASE_URL_SYNC=postgresql://keystone:CHANGE_ME_STRONG_PASSWORD@localhost:5432/keystone
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=GENERATE_WITH_python3_-c_"import secrets; print(secrets.token_urlsafe(64))"
ENV_MODE=production
CORS_ORIGINS=["https://your-domain.mil"]
```

### Database Initialization

Tables are created automatically on first startup. Start the backend once to
initialize:

```bash
cd /opt/keystone/app/backend
/opt/keystone/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
# Wait for "Database tables ready." then Ctrl+C
```

### Seed Initial Data (Optional)

For a fresh deployment with sample data:

```bash
cd /opt/keystone/app/backend
ENV_MODE=development /opt/keystone/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
# Wait for seeding to complete, then Ctrl+C
# Then switch back to production mode in .env
```

---

## Frontend Build

```bash
cd /opt/keystone/app/frontend
npm ci
npm run build
```

The built SPA will be in `frontend/dist/`. This directory will be served by Nginx.

---

## Nginx Reverse Proxy

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

### Configuration

Create `/etc/nginx/sites-available/keystone`:

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name your-domain.mil;
    return 301 https://$host$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl;
    server_name your-domain.mil;

    # TLS
    ssl_certificate /etc/ssl/keystone/fullchain.pem;
    ssl_certificate_key /etc/ssl/keystone/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss:; font-src 'self'; frame-ancestors 'self';" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    server_tokens off;
    root /opt/keystone/app/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Tile proxy (optional — for online map tiles)
    resolver 8.8.8.8 1.1.1.1 valid=300s ipv6=off;
    resolver_timeout 5s;

    location /tiles/osm/ {
        set $osm_upstream "tile.openstreetmap.org";
        proxy_pass https://$osm_upstream/;
        proxy_set_header Host tile.openstreetmap.org;
        proxy_set_header User-Agent "KEYSTONE/1.0";
        proxy_ssl_server_name on;
        proxy_cache_valid 200 7d;
        expires 7d;
    }

    location /tiles/satellite/ {
        set $esri_upstream "server.arcgisonline.com";
        proxy_pass https://$esri_upstream/ArcGIS/rest/services/World_Imagery/MapServer/tile/;
        proxy_set_header Host server.arcgisonline.com;
        proxy_set_header User-Agent "KEYSTONE/1.0";
        proxy_ssl_server_name on;
        proxy_cache_valid 200 7d;
        expires 7d;
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/keystone /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## systemd Service Files

### Backend API — `/etc/systemd/system/keystone-api.service`

```ini
[Unit]
Description=KEYSTONE Backend API
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=exec
User=keystone
Group=keystone
WorkingDirectory=/opt/keystone/app/backend
EnvironmentFile=/opt/keystone/.env
ExecStart=/opt/keystone/venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 4 \
    --log-level info
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/keystone /tmp

[Install]
WantedBy=multi-user.target
```

### Celery Worker — `/etc/systemd/system/keystone-celery.service`

```ini
[Unit]
Description=KEYSTONE Celery Worker
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=exec
User=keystone
Group=keystone
WorkingDirectory=/opt/keystone/app/backend
EnvironmentFile=/opt/keystone/.env
ExecStart=/opt/keystone/venv/bin/celery -A app.tasks:celery_app worker \
    --loglevel=info \
    --concurrency=4
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/keystone /tmp

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now keystone-api keystone-celery
sudo systemctl status keystone-api keystone-celery
```

---

## SSL/TLS Certificate Setup

### Option A: Let's Encrypt (Internet-Connected)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.mil
sudo systemctl reload nginx
```

Certbot automatically configures auto-renewal via systemd timer.

### Option B: DoD PKI / Enterprise CA

1. Obtain a certificate from your CA matching your server hostname
2. Place the certificate chain and private key:
   ```bash
   sudo mkdir -p /etc/ssl/keystone
   sudo cp fullchain.pem /etc/ssl/keystone/fullchain.pem
   sudo cp privkey.pem /etc/ssl/keystone/privkey.pem
   sudo chmod 600 /etc/ssl/keystone/privkey.pem
   sudo chown root:root /etc/ssl/keystone/*
   ```
3. Update the Nginx config to reference these paths (shown above)
4. Reload: `sudo systemctl reload nginx`

---

## Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# firewalld (RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

Do NOT expose ports 5432 (PostgreSQL) or 6379 (Redis) externally.

---

## Log Management

### Viewing Logs

```bash
# Backend API
sudo journalctl -u keystone-api -f

# Celery worker
sudo journalctl -u keystone-celery -f

# Nginx access/error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Log Rotation

Nginx logs are rotated by `logrotate` automatically. For systemd journal:

```bash
# Limit journal disk usage
sudo journalctl --vacuum-size=500M
```

For SIEM integration, configure `rsyslog` or `journald` forwarding to your
log aggregation platform.

---

## Backup and Restore

### Full Database Backup

```bash
sudo -u postgres pg_dump keystone > /backup/keystone_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Daily Backups (cron)

```bash
# /etc/cron.d/keystone-backup
0 2 * * * postgres pg_dump keystone | gzip > /backup/keystone_$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup

```bash
# Stop the application first
sudo systemctl stop keystone-api keystone-celery

# Drop and recreate
sudo -u postgres dropdb keystone
sudo -u postgres createdb keystone -O keystone
sudo -u postgres psql keystone -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql keystone < /backup/keystone_20260301.sql

# Restart
sudo systemctl start keystone-api keystone-celery
```

### Redis Backup

Redis uses RDB snapshots by default stored in the data directory. For explicit backup:

```bash
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/redis_$(date +%Y%m%d).rdb
```
