#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Waybill Tracking — Start Services with PM2
# ═══════════════════════════════════════════════════════════════
# This script starts the mock API (port 8080) and the Vite
# dashboard (port 3010) as persistent PM2 background processes.
# They will survive terminal closure and auto-restart on crash.
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="/home/teccjm/Desktop/waybill-tracking"
cd "$PROJECT_DIR"

echo "════════════════════════════════════════════════════════════"
echo "  Waybill Tracking — Service Manager"
echo "════════════════════════════════════════════════════════════"

# Step 1: Kill any processes on ports 3010 and 8080
echo ""
echo "[1/5] Freeing ports 3010 and 8080..."
fuser -k 3010/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true
sleep 1

# Step 2: Remove old PM2 processes
echo "[2/5] Cleaning old PM2 processes..."
pm2 delete waybill-dashboard 2>/dev/null || true
pm2 delete waybill-mock-api 2>/dev/null || true

# Step 3: Start services via ecosystem config
echo "[3/5] Starting services..."
pm2 start ecosystem.config.cjs

# Step 4: Save the PM2 process list so it auto-restores after reboot
echo "[4/5] Saving PM2 process list..."
pm2 save

# Step 5: Show status
echo ""
echo "[5/5] Current status:"
pm2 list

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Services are running in the background!"
echo ""
echo "  Dashboard:  http://localhost:3010"
echo "  Mock API:   http://localhost:8080"
echo ""
echo "  Useful commands:"
echo "    pm2 logs              — View live logs"
echo "    pm2 logs waybill-dashboard  — Dashboard logs only"
echo "    pm2 restart all       — Restart all services"
echo "    pm2 stop all          — Stop all services"
echo "    pm2 list              — Check service status"
echo "════════════════════════════════════════════════════════════"
