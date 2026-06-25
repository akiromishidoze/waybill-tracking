# Real-World Data Input & Real-Time Monitoring

This document lists every way to add real-world data into WaybillTrack and every screen or mechanism used to monitor that data in real time.

---

## Implementation Status: Frontend vs. Backend

| Feature | Frontend | Backend | Notes |
| --- | --- | --- | --- |
| Manual waybill forms | ✅ | ✅ | Pages and API endpoints ready. |
| Bulk CSV import | ✅ | ✅ | Mocked in dev; works for real once backend is running. |
| Driver / courier workflow | ✅ | ⚠️ | UI ready; some backend scan/assignment endpoints exist. |
| REST API input | N/A | ✅ | All core endpoints are implemented. |
| E-commerce connectors | ✅ | ⚠️ | UI ready; backend sync worker still needed. |
| External webhooks | ✅ | ✅ | Webhook dispatcher and UI implemented. |
| ERP / WMS integration | ✅ | ⚠️ | UI ready; no backend connector yet. |
| White-label portal | ✅ | ⚠️ | UI config page ready; public portal route not exposed yet. |
| Live GPS map | ✅ | ✅ | Map + GPS endpoints + migration ready. |
| Real-time dashboard | ✅ | ⚠️ | UI ready; analytics backend uses mock/sample data. |
| Tracking / aggregated views | ✅ | ⚠️ | UI ready; some backend endpoints exist. |
| Analytics & reporting | ✅ | ⚠️ | UI ready; most endpoints return sample data. |
| Alerts / exceptions / geofencing | ✅ | ⚠️ | UI ready; backend logic partially implemented. |
| Audit logs | ✅ | ✅ | Full UI and backend logging implemented. |
| IoT sensor monitoring | ✅ | ⚠️ | UI ready; backend sensor ingestion not fully wired. |
| Backend event pipeline | N/A | ✅ | Kafka, Redis, Elasticsearch, webhooks configured. |
| Email / SMS notifications | ✅ | ⚠️ | UI settings ready; Celery workers need to be running. |

**Legend:** ✅ = implemented / ready, ⚠️ = partially implemented or needs wiring, N/A = not a frontend feature.

---

## A. How to Input / Insert / Add Real-World Data

### 1. Manual Dashboard Forms (Operations / Admin)
- **New Waybill** — `/waybills/new` (`frontend/dashboard/src/pages/WaybillNewPage.tsx`)
- **Waybill Detail Updates** — `/waybills/:id` (`frontend/dashboard/src/pages/WaybillDetailPage.tsx`)
- **Batch Status Update** — `/waybills/batch-status` (`frontend/dashboard/src/pages/BatchStatusPage.tsx`)
- **Teams / Users / Carriers** — `/teams`, `/users`, `/carriers`

### 2. Bulk CSV Import
- **UI** — `/waybills/import` (`frontend/dashboard/src/pages/WaybillImportPage.tsx`)
- **Backend endpoint** — `POST /api/v1/waybills/import`
- **Status** — Backend parser and frontend page are implemented. Mocked in dev mode; works for real data once the backend is running.

### 3. Driver / Courier Mobile Workflow
- **Driver App** — `/driver-app` (`frontend/dashboard/src/pages/DriverAppPage.tsx`)
- Allows drivers to update status, record scan events, capture location, photo, signature, and mark delivery.

### 4. REST API (External Systems, Scripts, IoT)
- **Create waybill** — `POST /api/v1/waybills`
- **Add scan event** — `POST /api/v1/waybills/:id/scans`
- **Submit GPS location** — `POST /api/v1/gps/location`
- **Upload attachment** — `POST /api/v1/waybills/:waybillId/attachments`
- **Bulk import** — `POST /api/v1/waybills/import`

### 5. E-Commerce Platform Connectors
- **UI** — `/integrations/ecommerce` (`frontend/dashboard/src/pages/ECommerceIntegrationsPage.tsx`)
- Add platforms like Shopify, Shopee, Lazada.
- Receive real-time orders via webhook or scheduled sync.
- **Status** — UI is implemented; backend sync worker is the next step.

### 6. External Webhooks
- **UI** — `/integrations/webhooks` (`frontend/dashboard/src/pages/WebhooksPage.tsx`)
- Configure outbound webhooks for events like `waybill.created`, `scan.updated`.
- External systems can also POST inbound webhook events to create or update data.

### 7. ERP / WMS Integration
- **UI** — `/integrations/erp` (`frontend/dashboard/src/pages/ErpIntegrationsPage.tsx`)
- Push or pull waybill data from ERP/WMS systems via API.

### 8. White-Label Public Portal
- **UI** — `/integrations/white-label` (`frontend/dashboard/src/pages/WhiteLabelPortalPage.tsx`)
- Customers use a public tracking URL to look up waybills without logging in.

---

## B. How to Monitor Data in Real-Time

### 1. Live GPS Map
- **Map page** — `/map` (`frontend/dashboard/src/pages/MapViewPage.tsx`)
- Shows live shipment markers on a CartoDB map.
- Refreshes every 15 seconds and supports WebSocket live updates.

### 2. Real-Time Dashboard
- **Dashboard** — `/dashboard` (`frontend/dashboard/src/pages/DashboardPage.tsx`)
- Shows stats, SLA overview, recent activity, and key metrics.
- Auto-refreshes via React Query.

### 3. Tracking & Aggregated Views
- **Tracking** — `/tracking` (`frontend/dashboard/src/pages/TrackingPage.tsx`)
- **Aggregated tracking** — `/aggregated-tracking` (`frontend/dashboard/src/pages/AggregatedTrackingPage.tsx`)
- Search and monitor multiple waybills at once.

### 4. Analytics & Reporting
- **Analytics overview** — `/analytics` (`frontend/dashboard/src/pages/AnalyticsPage.tsx`)
- **Carrier performance** — `/analytics/carrier-performance`
- **SLA reports** — `/analytics/sla`
- **Cost analytics** — `/analytics/cost`
- **Demand forecasting** — `/analytics/demand-forecasting`
- **Scheduled reports** — `/analytics/scheduled-reports`

### 5. Alerts, Exceptions & Geofencing
- **Dwell alerts** — `/operations/dwell-alerts`
- **Escalations** — `/escalations`
- **Geofence events** — `/geofence-events`
- **Auto communications** — `/auto-communications`

### 6. Audit Logs
- **Audit log page** — `/audit-logs` (`frontend/dashboard/src/pages/AuditLogPage.tsx`)
- Tracks every create/update action, who performed it, and when.

### 7. IoT Sensor Monitoring
- **IoT sensors** — `/iot-sensors` (`frontend/dashboard/src/pages/IotSensorPage.tsx`)
- Monitor temperature, humidity, shock, and other sensor readings.

### 8. Backend Event Pipeline
- **Kafka** — publishes status changes and GPS updates.
- **Elasticsearch** — indexes waybills for fast search.
- **Redis** — caches lookups and invalidates on updates.
- **Webhooks** — dispatches events to external systems in real time.

### 9. Notifications
- **Email / SMS** — sent via Celery workers.
- Configurable in `/settings` for events like delivery, delay, and exception.

---

## Current Blockers for Real Data

- **PostgreSQL password authentication** — backend cannot start until the correct `postgres` password is found.
- **E-commerce sync worker** — not yet implemented.
- **Real GPS hardware / courier integration** — frontend is ready, but needs real devices or carrier APIs pushing to `POST /api/v1/gps/location`.

Once the backend is running and migrations are applied, every input method above except the e-commerce sync worker can be used immediately.
