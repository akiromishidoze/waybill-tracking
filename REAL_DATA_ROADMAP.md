# Real-World Data Input Roadmap

To make the waybill-tracking application functional with real-world data, complete the following steps in order.

## 1. Run Database Migrations

The database is the source of truth. Apply all migrations so the backend can store real entities.

```bash
cd /home/teccjm/Desktop/waybill-tracking/backend/core-api
# using your existing migrator
./scripts/migrate-up.sh
```

Verify these tables exist:
- `users`
- `waybills`
- `scan_events`
- `teams`
- `attachments`
- `ecommerce_platforms` / `ecommerce_sync_logs`
- `white_label_config`
- `audit_logs`
- `webhooks`

## 2. Start Required Infrastructure

The backend expects these services to be running and reachable from `backend/core-api/.env`:

- **PostgreSQL** — stores all relational data.
- **Redis** — caches waybill lookups and rate-limiting.
- **Kafka** — receives waybill created/updated events.
- **Elasticsearch** — indexes waybills for search.
- **SMTP / SMS gateway** — used by Celery workers for notifications.

Use Docker Compose or your existing scripts to start them, then confirm via the health endpoint:

```bash
curl http://localhost:8080/health
```

## 3. Create an Admin / Shipper User

Register the first user through the API, then promote the role to `ADMIN` if needed.

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123","name":"Admin","role":"ADMIN"}'
```

Login returns a JWT which is required for all protected endpoints.

## 4. Create Real Waybills

### Option A: Dashboard UI
1. Go to **Waybills > New Waybill**.
2. Fill in shipper, recipient, and carrier details.
3. Submit. The backend validates input, generates a unique tracking number, and writes to PostgreSQL.

### Option B: REST API

```bash
curl -X POST http://localhost:8080/api/v1/waybills \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Manila, PH",
    "destination": "Cebu, PH",
    "recipientName": "Juan Dela Cruz",
    "recipientAddress": "123 Mango St, Cebu City",
    "recipientEmail": "juan@example.com",
    "recipientPhone": "+639171234567",
    "carrierName": "J&T Express",
    "serviceType": "Standard"
  }'
```

## 5. Add Scan Events

Real movement data comes from carrier scans or IoT devices. Insert scans via the API (or the UI if you build a scan page):

```bash
curl -X POST http://localhost:8080/api/v1/waybills/<id>/scans \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_TRANSIT",
    "location": "Manila Hub",
    "timestamp": "2026-06-24T08:00:00Z"
  }'
```

Each scan updates the waybill status and triggers Kafka/Elasticsearch/webhook events.

## 6. Enable Real-Time GPS Tracking

GPS locations are stored in the `gps_locations` hypertable and exposed via REST/WebSocket.

1. Apply migration `012_gps_locations.sql` (TimescaleDB hypertable).
2. Verify backend endpoints:
   - `POST /api/v1/gps/location` — submit a location update.
   - `GET /api/v1/gps/waybills` — list current waybill positions.
   - `GET /api/v1/gps/waybills/:id/history` — location history for a waybill.
3. Use the dashboard **GPS Simulator** page to send test coordinates.
4. Open the **Real-Time GPS Tracking** map page to view live markers. The frontend uses WebSocket subscriptions to refresh markers automatically.

## 7. Connect E-Commerce Platforms

1. Go to **Integrations > E-Commerce Platform Connectors**.
2. Click **Add Platform**.
3. Enter platform name, store name, store URL, and webhook URL.
4. Save. The new platform appears in the dashboard and can receive real order imports via the webhook or a scheduled sync job.

Next step: implement a periodic sync worker or webhook listener that reads orders from the platform API and creates corresponding waybills.

## 8. Configure the White-Label Portal

1. Go to **Integrations > White-Label Portal**.
2. Click **Edit Configuration**.
3. Set brand name, primary color, support contacts, and portal URL.
4. Enable the portal.
5. Real customers can then use the public tracking URL to look up their waybills.

## 9. Add Teams and Assign Waybills

1. Create teams via `POST /api/v1/teams` or the UI.
2. Assign waybills to teams via `PATCH /api/v1/waybills/<id>/assign-team`.

This routes operational work to the correct team.

## 10. Upload Attachments

For proof of delivery, invoices, or damage photos:

```bash
curl -X POST http://localhost:8080/api/v1/waybills/<waybillId>/attachments \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@/path/to/pod.pdf"
```

## 11. Import Bulk Data

For real-world migration, add a CSV/Excel import feature:

- Frontend: new **Import** page with drag-and-drop file upload.
- Backend: `POST /api/v1/waybills/import` that parses rows, validates each waybill, and inserts in a transaction.
- Required columns: `origin`, `destination`, `recipientName`, `recipientAddress`, `recipientPhone`, `carrierName`, `serviceType`.
- Optional columns: `trackingNumber`, `recipientEmail`, `referenceNumber`, `teamId`.

## 12. Connect External Systems

Enable real data flow from external systems:

- **ERP / WMS** — push waybills into `POST /api/v1/waybills`.
- **Carriers** — poll carrier APIs for tracking scans and insert them via the scan endpoint.
- **E-commerce webhooks** — Shopify/Lazada/Shopee send order events to your webhook URL, which creates waybills automatically.
- **Analytics** — the analytics service reads directly from PostgreSQL, so it stays accurate as data is inserted.

## 13. Verify Data Flow

After inserting real data, confirm:

- `GET /api/v1/waybills` returns the inserted waybills.
- `GET /api/v1/track/<trackingNumber>` returns correct public tracking info.
- Elasticsearch indexes the waybill for search.
- Redis cache invalidates on updates.
- Kafka events are published.
- Webhooks are dispatched.
- Audit logs are recorded.
- Analytics dashboard reflects the new data.

## 14. Production Hardening

Before real users interact with the system:

- Use strong passwords and rotate secrets.
- Run migrations automatically on deploy.
- Enable TLS on the API and portal.
- Restrict the `ADMIN` role for user/role management.
- Add rate limiting to public endpoints (`/track/:trackingNumber`).
- Back up PostgreSQL regularly.
- Monitor Kafka, Redis, and Elasticsearch health.

---

## Quick Checklist

- [ ] Infrastructure services are running.
  - **Current blocker:** PostgreSQL password authentication fails when the backend starts.
- [ ] Database migrations are applied.
  - `001_init.sql` and `012_gps_locations.sql` are ready.
- [ ] Admin user exists.
- [ ] First real waybill created via UI or API.
- [ ] Scan events added for that waybill.
- [x] GPS tracking endpoints, migration, and dashboard pages are implemented.
  - `POST /api/v1/gps/location`, `GET /api/v1/gps/waybills`, WebSocket live updates.
  - Frontend uses CartoDB (free) tiles.
- [ ] E-commerce platform connected.
- [ ] White-label portal configured and enabled.
- [ ] Teams created and assigned.
- [x] Bulk import page and backend endpoint implemented; works with mock data in dev mode.
- [ ] External webhooks/integrations connected.
- [ ] Data flow verified end-to-end.
