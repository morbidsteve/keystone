# Docker Compose Deployment (Development & Production)

This guide covers deploying KEYSTONE using Docker Compose for both local development
and production-baseline environments.

---

## Prerequisites

| Requirement       | Minimum Version |
|--------------------|----------------|
| Docker Engine      | 24.0+          |
| Docker Compose     | v2.20+ (plugin) |
| Available RAM      | 4 GB           |
| Available Disk     | 10 GB          |

Verify your installation:

```bash
docker --version          # Docker version 24.x+
docker compose version    # Docker Compose version v2.x+
```

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/morbidsteve/keystone.git
cd keystone

# Start all services
docker compose up -d

# Check health status
docker compose ps
```

Once healthy, access the application:

| Service   | URL                          | Notes                         |
|-----------|------------------------------|-------------------------------|
| Frontend  | https://localhost             | HTTPS with self-signed cert   |
| Frontend  | http://localhost              | Redirects to HTTPS            |
| API Docs  | https://localhost/api/docs    | Swagger UI                    |
| Backend   | http://localhost:8000         | Direct API access (dev only)  |
| Database  | localhost:5432               | PostgreSQL (dev only)         |

Default development credentials are seeded automatically when `ENV_MODE=development`.

---

## Environment Variables

### Backend Service

| Variable                | Default                                | Description                        |
|-------------------------|----------------------------------------|------------------------------------|
| `DATABASE_URL`          | `postgresql+asyncpg://keystone:keystone_dev@db:5432/keystone` | Async database connection |
| `DATABASE_URL_SYNC`     | `postgresql://keystone:keystone_dev@db:5432/keystone`         | Sync database connection (Celery) |
| `REDIS_URL`             | `redis://redis:6379/0`                 | Redis connection string            |
| `SECRET_KEY`            | `dev-secret-key-change-in-production`  | JWT signing key (CHANGE IN PROD)   |
| `CORS_ORIGINS`          | `["http://localhost:5173"]`            | Allowed CORS origins (JSON array)  |
| `ENV_MODE`              | `development`                          | `development` or `production`      |

### Simulator (Demo Profile)

| Variable         | Default            | Description                        |
|------------------|--------------------|------------------------------------|
| `SIM_SPEED`      | `60`               | Simulation speed multiplier        |
| `SIM_SCENARIO`   | `steel_guardian`   | Scenario name to run               |
| `KEYSTONE_URL`   | `http://backend:8000` | Backend API URL                 |

### Overriding Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-production-secret-key-here
DATABASE_URL=postgresql+asyncpg://keystone:STRONGPASSWORD@db:5432/keystone
ENV_MODE=production
```

Or pass them inline:

```bash
SECRET_KEY=mysecret docker compose up -d
```

---

## Running with the Simulator (Demo Mode)

The simulator generates realistic logistics data for demonstrations:

```bash
# Start all services including the simulator
docker compose --profile demo up -d

# Watch simulator logs
docker compose logs -f simulator
```

The simulator runs the `steel_guardian` scenario at 60x speed by default, feeding
supply, equipment, and transportation data into the system.

---

## Persistent Data Volumes

KEYSTONE defines two named volumes:

| Volume      | Mount Point                    | Purpose              |
|-------------|-------------------------------|----------------------|
| `pgdata`    | `/var/lib/postgresql/data`    | PostgreSQL database  |
| `redisdata` | `/data`                       | Redis persistence    |

### Inspecting Volumes

```bash
docker volume ls | grep keystone
docker volume inspect keystone_pgdata
```

### Backing Up PostgreSQL

```bash
docker compose exec db pg_dump -U keystone keystone > backup_$(date +%Y%m%d).sql
```

### Restoring from Backup

```bash
cat backup_20260301.sql | docker compose exec -T db psql -U keystone keystone
```

---

## Updating / Upgrading

```bash
# Pull latest code
git pull origin main

# Rebuild images and restart
docker compose build
docker compose up -d

# Database migrations are applied automatically on backend startup
```

For major version upgrades, check release notes for any manual migration steps.

---

## Troubleshooting

### Services fail to start

```bash
# Check logs for all services
docker compose logs

# Check a specific service
docker compose logs backend

# Check health status
docker compose ps
```

### Database connection refused

The backend waits for PostgreSQL to be healthy before starting. If it still fails:

```bash
# Verify db is healthy
docker compose exec db pg_isready -U keystone

# Check if port 5432 is already in use
lsof -i :5432
```

### Redis connection issues

```bash
docker compose exec redis redis-cli ping
# Expected: PONG
```

### Frontend shows blank page

```bash
# Check nginx is running
docker compose logs frontend

# Verify backend is reachable from frontend container
docker compose exec frontend curl -f http://backend:8000/health
```

### Resetting all data

```bash
docker compose down -v   # -v removes volumes
docker compose up -d     # Fresh start with re-seeded data
```

---

## Production Hardening

The `docker-compose.yml` already includes DoD Container Hardening Guide measures:

- `security_opt: no-new-privileges:true` on all containers
- `cap_drop: ALL` with minimum required capabilities re-added
- `read_only: true` filesystem with explicit tmpfs mounts
- Non-root user (`1001:1001`) for backend and Celery

### Additional Production Steps

1. **Replace SECRET_KEY** with a cryptographically random value:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(64))"
   ```

2. **Use real TLS certificates** — Replace the self-signed cert in the frontend:
   ```yaml
   frontend:
     volumes:
       - /path/to/fullchain.pem:/etc/nginx/ssl/cert.pem:ro
       - /path/to/privkey.pem:/etc/nginx/ssl/key.pem:ro
   ```

3. **Set strong database passwords**:
   ```yaml
   db:
     environment:
       POSTGRES_PASSWORD: ${DB_PASSWORD}  # From secrets manager
   ```

4. **Restrict exposed ports** — In production, only expose ports 80 and 443:
   ```yaml
   db:
     ports: []          # Remove external access
   redis:
     ports: []          # Remove external access
   backend:
     ports: []          # Only accessed via nginx proxy
   ```

5. **Enable `ENV_MODE=production`** — This disables auto-seeding and enforces
   `SECRET_KEY` validation:
   ```yaml
   backend:
     environment:
       ENV_MODE: production
   ```

6. **Set up log aggregation** — Forward Docker logs to your SIEM:
   ```yaml
   logging:
     driver: syslog
     options:
       syslog-address: "tcp://your-siem:514"
       tag: "keystone-{{.Name}}"
   ```
