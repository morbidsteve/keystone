# =============================================================================
# KEYSTONE Backend — Hardened Multi-Stage Dockerfile
# Compliant with DoD Container Hardening Guide
# =============================================================================

# STAGE 1: Build
FROM python:3.11-slim AS builder
WORKDIR /build

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Download spaCy model into the install prefix so it ships with deps
RUN /install/bin/python -m spacy download en_core_web_sm-3.7.1 \
        --pip-args="--prefix=/install --no-cache-dir" \
    || echo "spaCy model download failed — NLP fallback will use keyword matching"

COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY seed/ ./seed/

# STAGE 2: Production (slim, non-root)
FROM python:3.11-slim AS production

LABEL org.opencontainers.image.source="https://github.com/KEYSTONE"
LABEL org.opencontainers.image.description="KEYSTONE Backend API"
LABEL org.opencontainers.image.vendor="USMC Project Dynamis"

# Install only the minimal runtime library needed for PostgreSQL
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get purge -y --auto-remove

# Non-root user (UID > 1024 per DoD Container Hardening Guide)
RUN groupadd -g 1001 keystone && \
    useradd -u 1001 -g keystone -s /usr/sbin/nologin -M keystone

WORKDIR /app

COPY --from=builder /install /usr/local
COPY --from=builder /build/app ./app
COPY --from=builder /build/alembic ./alembic
COPY --from=builder /build/alembic.ini .
COPY --from=builder /build/seed ./seed

RUN chown -R keystone:keystone /app

USER keystone:keystone

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# STAGE: SRE / Kubernetes deployment
FROM production AS sre

# SRE defaults — Istio handles mTLS, no SSL needed for DB connections
ENV DATABASE_URL="postgresql+asyncpg://keystone:keystone_dev@db:5432/keystone" \
    DATABASE_URL_SYNC="postgresql://keystone:keystone_dev@db:5432/keystone?sslmode=disable" \
    REDIS_URL="redis://redis:6379/0" \
    ENV_MODE="development" \
    PGSSLMODE="disable"
