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
RUN npm run build

# STAGE 2: Production (nginx-unprivileged, non-root)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/KEYSTONE"
LABEL org.opencontainers.image.description="KEYSTONE Frontend"
LABEL org.opencontainers.image.vendor="USMC Project Dynamis"

# Install openssl for TLS cert generation (as root)
USER root
RUN apk add --no-cache openssl

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
