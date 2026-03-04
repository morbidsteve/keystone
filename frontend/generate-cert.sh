#!/bin/sh
# Generate self-signed TLS certificate for KEYSTONE dev/air-gapped deployment
# Creates cert at /etc/nginx/ssl/cert.pem and key at /etc/nginx/ssl/key.pem

CERT_DIR="/etc/nginx/ssl"
CERT_FILE="${CERT_DIR}/cert.pem"
KEY_FILE="${CERT_DIR}/key.pem"

# Skip if cert already exists and is not expired
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    # Check if cert is still valid (within 30 days of expiry)
    if openssl x509 -checkend 2592000 -noout -in "$CERT_FILE" 2>/dev/null; then
        echo "TLS certificate exists and is valid. Skipping generation."
        exit 0
    fi
    echo "TLS certificate expired or expiring soon. Regenerating..."
fi

mkdir -p "$CERT_DIR"

# NOTE: This generates a DEV/AIR-GAPPED certificate only.
# Production deployments MUST use PKI-issued certificates.
echo "Generating self-signed TLS certificate (dev/air-gapped only)..."
openssl req -x509 -nodes -newkey rsa:4096 \
    -days 365 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=US/ST=Virginia/L=Quantico/O=USMC/OU=KEYSTONE/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:keystone.local,IP:127.0.0.1"

chmod 644 "$CERT_FILE"
chmod 600 "$KEY_FILE"

echo "TLS certificate generated successfully."
echo "  Certificate: $CERT_FILE"
echo "  Key: $KEY_FILE"
