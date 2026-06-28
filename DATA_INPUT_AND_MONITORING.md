# Real-World Data Input & Real-Time Monitoring — Step-by-Step Task List

Use this list to add real-world data into WaybillTrack and monitor it live. Check items off as you complete them. Each section is ordered so you can do the tasks one-by-one.

**Legend:** ✅ = implemented / ready, ⚠️ = partially implemented or needs wiring, ❌ = not yet implemented.

---

## Phase 1: Foundation — Make the Backend Ready

Do these first. Nothing else works reliably until the backend is running and the database is migrated.

### Start Infrastructure
- [x] Start PostgreSQL, Redis, Kafka, Elasticsearch, and Celery workers. ✅ Done (Docker: postgres, redis, kafka, zookeeper up; Elasticsearch skipped due to network)
- [x] Confirm the backend can connect: `curl http://localhost:8080/health`. ✅ Done — health endpoint returns `database: up`, `redis: up`, `kafka: up` (Elasticsearch down, non-critical).

### Apply Database Migrations
- [x] Run `backend/core-api/scripts/migrate-up.sh`. ✅ Done — migrations applied automatically when the backend started.
- [x] Verify these tables exist: `users`, `waybills`, `scan_events`, `teams`, `attachments`, `gps_locations`, `ecommerce_platforms`, `white_label_config`, `audit_logs`, `webhooks`. ✅ Done.

### Create the First Admin User
- [x] Register via API:
  ```bash
  curl -X POST http://localhost:8080/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"SecurePassword123","name":"Admin","role":"ADMIN"}'
  ```
  ✅ Done — admin user created with ID `b26ef41b-daa2-4fc9-9edf-15ab0a0392e1`.
- [x] Log in through the dashboard at `/login` and confirm the JWT is stored. ✅ Done — use `admin@waybilltrack.com` / `admin`.

---

## Phase 2: Input Real-World Data

Complete these in order. Each method is independent once Phase 1 is done.

### Manual Dashboard Forms
- [x] **Create a waybill** — go to `/waybills/new` and fill in shipper, recipient, origin, destination, and carrier. ✅ Backend verified (`POST /api/v1/waybills` returns real waybill with tracking number). Frontend now passes through to real backend.
- [2] **Update a waybill** — open `/waybills/:id` and edit details or status.✅
- [3] **Batch update status** — use `/waybills/batch-status` to change multiple waybills at once. ✅
- [4] **Record a scan event** — use `/driver-app` or the waybill detail page to log `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, etc. ✅
- [5] **Assign a driver** — in `/driver-app` or the waybill detail page, assign a courier to a waybill. ✅
- [6] **Create teams / users / carriers** — go to `/teams`, `/users`, `/carriers`. ✅
- [7] **Configure integrations** — set up e-commerce, webhooks, ERP, and white-label portal in `/integrations/*`.
- [8] **Update app settings** — go to `/settings` for notifications, branding, and thresholds. ✅
- **Status:** Frontend ✅ / Backend ✅

### Bulk CSV Import
- [9] Download the template from `/waybills/import`. ✅
- [10] Fill in required columns: `recipientName`, `recipientAddress`, `recipientPhone`, `origin`, `destination`. ✅
- [11] Add optional columns: `trackingNumber`, `recipientEmail`, `weight`, `dimensions`, `serviceType`, `carrierName`, `referenceNumber`, `teamId`. ✅
- [12] Upload the CSV and verify the result shows `created` and `failed` counts. ✅
- [13] Check `/waybills` to confirm the imported rows appear. ✅
- **Status:** Frontend ✅ / Backend ✅

### Driver / Courier Mobile Workflow
- [14] Open `/driver-app` and log in as a courier.
- [15] Pick an active delivery and update its status.
- [16] Record a scan event with location and optional photo/signature.
- [17] Mark a delivery as `DELIVERED` or `FAILED_DELIVERY`.
- **Status:** Frontend ✅ / Backend ⚠️ (some endpoints exist; verify full flow)

### REST API (External Systems, Scripts, IoT)
- [18] Create a waybill via `POST /api/v1/waybills`. ✅
- [19] Add a scan event via `POST /api/v1/waybills/:id/scans`. ✅ 
- [20] Submit a GPS location via `POST /api/v1/gps/location`. ✅
- [21] Upload an attachment via `POST /api/v1/waybills/:waybillId/attachments`.✅
- [22] Bulk import via `POST /api/v1/waybills/import`. ✅
- **Status:** Backend ✅

### E-Commerce Platform Connectors
- [23] Go to `/integrations/ecommerce` and click **Add Platform**. ✅
- [24] Enter platform name, store name, store URL, and webhook URL. ✅
- [25] Save the platform. ✅
- [26] Send a test order webhook to the configured URL and verify a waybill is created. ✅
- **Status:** Frontend ✅ / Backend ⚠️ (sync worker needed)

### External Webhooks (Outbound)
- [27] Go to `/integrations/webhooks` and click **Add Webhook**.
- [28] Choose events: `waybill.created`, `scan.updated`, `waybill.delivered`.
- [29] Trigger a waybill event and confirm the external endpoint receives the payload.
- **Status:** Frontend ✅ / Backend ✅

### ERP / WMS Integration
- [30] Go to `/integrations/erp` and add an ERP connection.
- [31] Test the connection.
- [32] Sync waybills from the ERP into the dashboard.
- **Status:** Frontend ✅ / Backend ⚠️ (connector not yet implemented)

### White-Label Public Portal
- [33] Go to `/integrations/white-label` and configure brand name, color, support contacts, and portal URL.
- [34] Enable the portal.
- [35] Open the public tracking URL and look up a real tracking number.
- **Status:** Frontend ✅ / Backend ⚠️ (public portal route not exposed yet)

---

## Phase 3: Monitor Data in Real-Time

Use these screens and tools to watch the data you entered in Phase 2.

### Live GPS Map
- [1] Open `/map` and confirm active shipments appear as markers.
- [2] Use `/gps-simulator` to send a new coordinate for a waybill.
- [3] Return to `/map` and confirm the marker moves within 15 seconds.
- [4] (With backend running) confirm WebSocket live updates instead of polling.
- **Status:** Frontend ✅ / Backend ✅

### Real-Time Dashboard
- [5] Open `/dashboard` and confirm stats reflect real waybill counts.
- [6] Check SLA cards and recent activity feed.
- [7] Refresh the page after creating a waybill and confirm the numbers update.
- **Status:** Frontend ✅ / Backend ⚠️ (analytics still uses sample data)

### Tracking & Aggregated Views
- [8] Open `/tracking` and search for a real tracking number.
- [9] Open `/aggregated-tracking` and confirm the waybill appears in the list.
- **Status:** Frontend ✅ / Backend ⚠️

### Analytics & Reporting
- [10] Open `/analytics` and verify charts load.
- [11] Check `/analytics/carrier-performance`, `/analytics/sla`, `/analytics/cost`, and `/analytics/demand-forecasting`.
- [12] Schedule a report in `/analytics/scheduled-reports` and confirm delivery.
- **Status:** Frontend ✅ / Backend ⚠️ (most endpoints return sample data)

### Alerts, Exceptions & Geofencing
- [13] Open `/operations/dwell-alerts` and confirm alerts are generated for stalled shipments.
- [14] Open `/escalations` and verify exception handling workflow.
- [15] Open `/geofence-events` and confirm geofence entries/exits are recorded.
- [16] Open `/auto-communications` and verify triggers are firing.
- **Status:** Frontend ✅ / Backend ⚠️

### Audit Logs
- [17] Open `/audit-logs` and confirm every create/update action is logged.
- [18] Verify user, role, action type, and timestamp are recorded.
- **Status:** Frontend ✅ / Backend ✅

### IoT Sensor Monitoring
- [19] Open `/iot-sensors` and verify the dashboard loads.
- [20] Submit a sensor reading via API or integration and confirm it appears.
- **Status:** Frontend ✅ / Backend ⚠️

### Backend Event Pipeline Monitoring
- [21] Confirm Kafka is publishing `waybill.created`, `scan.updated`, and `gps.location` events.
- [22] Confirm Elasticsearch indexes new waybills for search.
- [23] Confirm Redis invalidates cache on updates.
- [24] Confirm webhooks are dispatched to configured URLs.
- **Status:** Backend ✅

### Email / SMS Notifications
- [25] Open `/settings` and configure notification triggers.
- [26] Trigger a delivery event and confirm the email/SMS is sent.
- [27] Verify Celery workers are processing the queue.
- **Status:** Frontend ✅ / Backend ⚠️

---

## Phase 4: End-to-End Verification

After completing the phases above, verify the full flow.

- [1] Create a waybill → see it in `/waybills` and `/dashboard`.
- [2] Add a scan event → status updates in `/waybills/:id` and `/track/<trackingNumber>`.
- [3] Submit GPS location → marker moves on `/map`.
- [4] Upload attachment → appears in `/waybills/:id` attachments tab.
- [5] Trigger webhook → external endpoint receives the payload.
- [6] Check `/audit-logs` → every action is recorded.
- [7] Check `/analytics` → data reflects real activity.

---

## Current Blockers

- [1] **PostgreSQL password authentication** — backend cannot start until the correct `postgres` password is found.
- [2] **E-commerce sync worker** — backend worker that reads orders from platform APIs is not yet implemented.
- [3] **Real GPS hardware / courier integration** — frontend is ready, but needs real devices or carrier APIs pushing to `POST /api/v1/gps/location`.

Once the backend is running and migrations are applied, most of Phase 2 and Phase 3 can be used immediately.
