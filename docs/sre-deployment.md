# Deploying KEYSTONE on SRE Platform

KEYSTONE supports deployment on the SRE Platform (Secure Runtime Environment) — a
government-compliant Kubernetes platform with Istio service mesh, automated builds,
and security hardening.

## Quick Deploy

1. Open the SRE Dashboard at `https://dashboard.apps.sre.example.com`
2. Navigate to **Deploy App** > **Deploy from Git**
3. Enter:
   - **Git Repository URL**: `https://github.com/morbidsteve/keystone`
   - **App Name**: `keystone`
   - **Team Name**: your team name
4. Click **Deploy**

The platform will:
- Detect the Docker Compose project (5 services)
- Auto-provision PostgreSQL (PostGIS) and Redis
- Build backend and frontend images via Kaniko
- Deploy all services with Istio mTLS and network policies
- Create ingress at `https://keystone.apps.sre.example.com`

## What's Different on SRE

| Feature | Standalone (Docker Compose) | SRE Platform |
|---------|---------------------------|--------------|
| TLS | Self-signed certs in nginx | Istio gateway handles TLS |
| Service mesh | None | Istio mTLS (zero-trust) |
| Database | docker-compose PostgreSQL | Platform-managed PostgreSQL |
| Image registry | Local | Harbor (scanned + signed) |
| Network security | Docker bridge networks | Kubernetes NetworkPolicies |
| Build | docker compose build | Kaniko in-cluster builds |
| Monitoring | Optional Prometheus profile | Prometheus + Grafana included |
| Access | localhost:8443 | https://keystone.apps.sre.example.com |

## SRE Build Targets

The Dockerfiles include an `sre` build stage that the platform auto-detects:

- **Frontend**: `nginx-sre.conf` serves on HTTP port 8080 (no SSL — Istio handles TLS)
- **Backend**: Pre-configured DATABASE_URL with `?ssl=disable` (Istio mTLS encrypts the connection)

These stages are selected automatically by the SRE platform. No manual configuration needed.

## Environment Variables

The SRE platform auto-configures these for the backend:

| Variable | SRE Value |
|----------|-----------|
| DATABASE_URL | `postgresql+asyncpg://keystone:keystone_dev@db:5432/keystone?ssl=disable` |
| REDIS_URL | `redis://redis:6379/0` |
| ENV_MODE | `production` |

For production deployments, override credentials via OpenBao/External Secrets.

## Local Development

Nothing changes for local development. `docker compose up` still works exactly as before
with SSL on port 8443.
