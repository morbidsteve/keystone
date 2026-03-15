# =============================================================================
# KEYSTONE Frontend — Hardened Multi-Stage Dockerfile
# Compliant with DoD Container Hardening Guide
# =============================================================================

# STAGE 1: Build
FROM node:20-slim AS builder
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Set the API base URL so the build uses the real backend API (not demo/mock mode).
# In Docker Compose, nginx proxies /api/ → backend:8000, so /api/v1 is correct.
# Without this, the app falls back to demo mode with mock data.
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_AUTH_MODE=local
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_AUTH_MODE=${VITE_AUTH_MODE}

RUN npm run build

# STAGE 2: Production (nginx-unprivileged, non-root)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/KEYSTONE"
LABEL org.opencontainers.image.description="KEYSTONE Frontend"
LABEL org.opencontainers.image.vendor="USMC Project Dynamis"

# Install openssl for TLS cert generation + ca-certificates for upstream SSL proxy (as root)
USER root
RUN apk add --no-cache openssl ca-certificates

# Copy cert generation script and generate self-signed cert
COPY generate-cert.sh /usr/local/bin/generate-cert.sh
RUN chmod +x /usr/local/bin/generate-cert.sh && \
    /usr/local/bin/generate-cert.sh && \
    chown -R 101:101 /etc/nginx/ssl

# Switch back to nginx user
USER 101

# Copy built assets from builder stage
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -fk https://localhost:8443/ || exit 1

EXPOSE 8080 8443

# STAGE 2b: SRE builder (SSO auth mode baked into JS bundle)
FROM builder AS builder-sre
ENV VITE_AUTH_MODE=sso
RUN npm run build

# STAGE 3: SRE / Kubernetes deployment (no SSL — Istio handles TLS)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS sre

LABEL org.opencontainers.image.source="https://github.com/KEYSTONE"
LABEL org.opencontainers.image.description="KEYSTONE Frontend (SRE)"
LABEL org.opencontainers.image.vendor="USMC Project Dynamis"

# Install ca-certificates for upstream SSL proxy (tile proxies)
USER root
RUN apk add --no-cache ca-certificates
USER 101

# Copy built assets from SRE builder stage (with VITE_AUTH_MODE=sso)
COPY --from=builder-sre /build/dist /usr/share/nginx/html

# Copy SRE-compatible nginx configuration (no SSL)
COPY nginx-sre.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080
