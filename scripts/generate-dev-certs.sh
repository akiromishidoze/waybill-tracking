#!/usr/bin/env bash
# scripts/generate-dev-certs.sh
# ─────────────────────────────────────────────────────────────────────────────
# Generates a self-signed TLS certificate + private key for LOCAL DEVELOPMENT.
#
# Usage:
#   chmod +x scripts/generate-dev-certs.sh
#   ./scripts/generate-dev-certs.sh
#
# Output:
#   infrastructure/docker/nginx/certs/server.crt
#   infrastructure/docker/nginx/certs/server.key
#
# For PRODUCTION use a real CA (e.g. Let's Encrypt via Certbot).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/infrastructure/docker/nginx/certs"

mkdir -p "$CERT_DIR"

echo "Generating self-signed TLS certificate in: $CERT_DIR"

openssl req -x509 -nodes \
  -days 365 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.crt" \
  -subj "/C=US/ST=Dev/L=Local/O=WaybillTracking/CN=waybill.local" \
  -addext "subjectAltName=DNS:waybill.local,DNS:localhost,IP:127.0.0.1"

chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"

echo ""
echo "Certificate generated:"
echo " CRT → $CERT_DIR/server.crt"
echo " KEY → $CERT_DIR/server.key"
echo ""
echo " This is a self-signed certificate for LOCAL development only."
echo " Your browser will show a security warning — add an exception or"
echo " trust the cert in your OS keychain."
echo ""
echo " For production, replace these files with real CA certificates"
echo " (e.g. Let's Encrypt via Certbot)."
