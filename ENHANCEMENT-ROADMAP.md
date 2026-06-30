# Waybill Tracking — Enhancement & Upgrade Roadmap

Full-stack analysis of the current state (frontend → backend → infrastructure) with gaps, deficiencies, and required improvements organized by priority phase.

---

## Phase 1 — Critical (Must Fix Before Any Production Use)

1. **BI Integrations backend is completely missing**
   - `BiIntegrationsPage.tsx` fetches `GET /bi-integrations` and calls `POST/PATCH/DELETE /bi-integrations/:id` and `POST /bi-integrations/:id/sync`, but no handler, repository, model, migration, or route exists for this resource in `core-api`.
   - Create `bi_integrations` migration, Go model, `BiIntegrationRepository`, `BiIntegrationHandler`, and register all 5 routes.

2. **Demand Forecasting endpoint not backed by real data**
   - `DemandForecastingPage.tsx` calls `GET /analytics/demand-forecast`. The handler exists in `analytics_handler.go` and proxies to the analytics-api, but the analytics-api has no `/demand-forecast` route — only `/stats`, `/sla`, `/anomalies`, `/predict-eta`, `/cost-per-shipment`, and `/carbon-footprint`.
   - Implement `GET /analytics/demand-forecast` in `analytics-api` with real SQL aggregations by lane, region, and month.

3. **analytics-api `JWT_SECRET` defaults to a known weak value**
   - `app/core/config.py` defaults `JWT_SECRET` to `"change-me-in-production"` and only raises a `ValueError` at startup. The `docker-compose.yml` injects the real secret from the host env, but if the service is run directly (e.g., during local dev or CI), the validator is bypassed unless the env var is explicitly set.
   - The validator is already written; ensure it is enforced in all run configurations, and add the same `?:` injection guard used in `docker-compose.yml` for the analytics-api service.

4. **No Playwright / end-to-end test coverage**
   - The `tests/load/` directory only has k6 load scripts. There are zero Playwright specs for the critical path: login → create waybill → scan → track → return. Regressions across 48 pages go undetected.
   - Add a `tests/e2e/` Playwright suite covering at minimum: login, waybill CRUD, public tracking, and driver scan flow.

5. **Roadmap placeholder pages serve no content**
   - `RoadmapTrackingPage`, `RoadmapOperationsPage`, `RoadmapAnalyticsPage`, and `RoadmapIntegrationsPage` all render only `"Content is being updated..."` — they are live, authenticated routes that provide no value.
   - Either fill them with real roadmap content or remove the routes from `App.tsx` and the navigation to avoid confusing operators.

---

## Phase 2 — High Priority (Required for Reliable Operations)

1. **Real carrier API polling worker does not exist**
   - The `carriers` table and management UI are in place, but there is no background job that polls carrier APIs (J&T, LBC, 2GO, etc.) and ingests scan events. All scan data is entered manually.
   - Build a Celery beat task (or Go worker goroutine) per carrier that polls the carrier tracking API and inserts `scan_events`, updating waybill status automatically.

2. **E-Commerce sync worker is missing**
   - `POST /ecommerce/webhook/:platformId` receives inbound orders, but there is no scheduled pull-based sync. Platforms like Shopify/Lazada/Shopee push inconsistently; a polling worker is required as a fallback.
   - Add a Celery beat task that iterates connected `ecommerce_platforms` and pulls new orders on a configurable interval.

3. **COD payments and customs shipments are not auto-populated**
   - `cod_payments` and `customs_shipments` tables were just created but contain no seed or trigger logic. When a waybill is created or its status changes to `DELIVERED`, there is no automatic COD record creation. The pages will show empty tables for all real waybills.
   - Add a PostgreSQL trigger or application-layer hook in the waybill status update flow that auto-creates a `cod_payments` row when `isCOD = true` and a `customs_shipments` row for cross-border waybills.

4. **No real-time scan event notification beyond WebSocket**
   - The notification `Dispatcher` only triggers on waybill status changes via `UpdateStatus`. Scan events (`POST /waybills/:id/scans`) do not dispatch notifications to shippers or recipients. This means missed pickup, delivery attempt, and exception notifications.
   - Call `DispatchDeliveryNotification` (or a more specific notification type) after every significant scan event type (`DELIVERY`, `ATTEMPT`, `RETURN`).

5. **Password policy not enforced on the frontend**
   - Backend `utils/password.go` enforces 8+ chars, mixed case, and a digit. The frontend `WaybillNewPage`, `SettingsPage` (change password), and registration form have no client-side validation — users see a raw API error string on failure.
   - Add inline password strength feedback in all forms that trigger a password change, matching the backend rules.

6. **Waybill list pagination is not reflected in the URL**
   - `WaybillListPage.tsx` manages page/limit state locally. Refreshing or sharing a URL always resets to page 1. This breaks deep linking for operations teams.
   - Sync `page`, `limit`, and `search` query parameters to the URL using `useSearchParams`.

7. **`courier_handler.go` is a duplicate stub**
   - `internal/handlers/courier_handler.go` exists alongside `driver_handler.go` but appears to be an older stub that is not wired to any route. It creates confusion about the canonical handler for driver/courier operations.
   - Delete or merge `courier_handler.go` and its test file if it is genuinely unused.

---

## Phase 3 — Medium Priority (Production Hardening)

1. **Customs document upload is UI-only with no backend storage**
   - `CustomsCompliancePage.tsx` renders an "Upload Document" button for shipments in `DOCUMENTS_PENDING` or `DOCUMENTS_SUBMITTED` status, but clicking it does nothing — no `POST /customs-documents` endpoint exists, and there is no file storage integration (S3, GCS, or local).
   - Implement a `POST /customs-documents` multipart upload endpoint that stores files and creates a `customs_documents` row.

2. **Auto-communications only stores records — no actual sending**
   - `AutoCommunicationsPage.tsx` creates communication rules, but the `auto_communications` table stores rules without a worker that evaluates them and dispatches messages when conditions (e.g., status change, dwell time exceeded) are met.
   - Add a Celery beat task that evaluates active auto-communication rules and enqueues `send_email_notification` / `send_sms_notification` tasks accordingly.

3. **IoT sensor readings have no alerting or threshold monitoring**
   - `IotSensorPage.tsx` displays sensor readings (temperature, humidity, shock), but there is no threshold alert logic. A shipment requiring cold-chain storage that exceeds a temperature limit generates no alert.
   - Add a threshold model per sensor and a background worker that checks readings against thresholds and creates escalations or notifications.

4. **Geofence events are write-only — no inbound geofence triggers**
   - `GeofenceEventsPage.tsx` lists geofence events, but there is no mechanism to actually define geofence zones or detect when a GPS location enters/exits a zone. Events can only be created manually via the GPS simulator.
   - Implement zone definitions (polygon or radius) and a GPS ingestion hook that evaluates each new GPS ping against active zones.

5. **Elasticsearch is wired but not used for waybill search**
   - `es.Client` is initialized and passed to `WaybillHandler`, but the `List` handler queries PostgreSQL directly — Elasticsearch is never used for search. The full-text search potential is wasted.
   - Index waybills to Elasticsearch on create/update, and route search queries with a `search` parameter to Elasticsearch instead of `ILIKE`.

6. **`registerCoreAPIRoutes` function signature is unmaintainable**
   - The function now accepts 27 parameters. Adding any new handler requires editing 3 locations. This is a significant maintenance and readability burden.
   - Refactor to a `Dependencies` struct that groups all handlers and is passed as a single argument.

7. **No database migration rollback mechanism**
   - The `migrator` runs migrations forward only. There is no `down` migration support. A bad migration in production requires manual SQL intervention.
   - Add a `down` migration file per migration and expose a `--rollback` flag to the migrator.

8. **Frontend has no global error boundary**
   - Any unhandled React render error will crash the entire dashboard with a blank white screen. There is no `ErrorBoundary` component wrapping routes.
   - Add a top-level `ErrorBoundary` in `App.tsx` that shows a user-friendly error page instead of a blank screen.

9. **`xpack.security.enabled=false` on Elasticsearch**
   - `docker-compose.yml` disables Elasticsearch security entirely. Any container on the same Docker network can read or modify all indexed waybill data without authentication.
   - Enable X-Pack security, set a superuser password, and pass credentials to `core-api` via environment variables.

---

## Phase 4 — Low Priority (UX & Developer Experience)

1. **No dark mode persistence across sessions**
   - `ThemeContext.tsx` manages dark mode in React state, but the preference is not persisted to `localStorage` or the backend `app_settings`. Refreshing the page always resets to the default theme.
   - Persist the theme preference to `localStorage` on toggle and read it on initial load.

2. **WaybillDetailPage is 40 KB — should be split into tabs/components**
   - `WaybillDetailPage.tsx` is 40,283 bytes — by far the largest file in the frontend. It renders scan events, GPS history, attachments, returns, customs info, escalations, and more in a single component.
   - Decompose into tab-based sub-components (`ScanTimeline`, `AttachmentsTab`, `ReturnTab`, `CustomsTab`) to improve maintainability and initial render performance.

3. **SettingsPage is 27 KB with no code splitting**
   - `SettingsPage.tsx` is 27,268 bytes and is loaded eagerly on every route visit. It likely contains many rarely-used sections (SMTP, Twilio, feature flags, etc.).
   - Apply `React.lazy` and `Suspense` to lazily load `SettingsPage` and other large pages.

4. **No loading/skeleton states on several pages**
   - `BiIntegrationsPage`, `DemandForecastingPage`, `RoadmapTrackingPage`, and several others lack skeleton loaders during data fetch, resulting in content jumping or layout shift (CLS).
   - Add `SkeletonBlock` loading states consistently across all data-fetching pages.

5. **Public tracking page has no SEO metadata**
   - `TrackingPage.tsx` is publicly accessible at `/track/:trackingNumber` but has no `<title>`, `<meta description>`, or Open Graph tags. Sharing a tracking link gives a blank preview.
   - Add dynamic `<title>` and meta tags via a `Helmet`-style solution (e.g., `react-helmet-async`).

6. **GPS simulator is exposed to all authenticated users**
   - `GPSSimulatorPage.tsx` is not guarded by `RoleMiddleware`. Any logged-in user (including `SHIPPER` role) can inject fake GPS coordinates for any waybill.
   - Restrict `/gps-simulator` to `OPS` and `ADMIN` roles both in the frontend route guard and backend GPS write endpoints.

7. **No `404` catch-all route in `App.tsx`**
   - Navigating to any undefined path (e.g., `/admin`, `/typo`) silently redirects to `/dashboard` via the `Navigate` default or renders nothing. There is no explicit `404` page.
   - Add a `<Route path="*" element={<NotFoundPage />} />` catch-all.

8. **Terraform infrastructure is partially defined**
   - The `infrastructure/k8s/` directory has Kubernetes manifests but no Terraform code. The `PRODUCTION-TASKS.md` mentions remote state, but no `.tf` files exist at all.
   - Either add Terraform modules for the cloud infrastructure or document that Kubernetes manifests are the single source of truth and remove the Terraform references.

---

## Phase 5 — Future / Nice-to-Have

1. **Multi-language / i18n support**
   - All UI strings are hardcoded in English. The system is used in the Philippines where Filipino or localized English variants may be needed by some operators.
   - Integrate `react-i18next` and externalize all UI strings to translation JSON files.

2. **Driver mobile app (PWA or React Native)**
   - The `DriverAppPage` provides a desktop management view, but drivers in the field need a mobile-optimized experience for scanning, capturing signatures, and updating delivery status offline.
   - Build a Progressive Web App (PWA) view for the driver workflow, or a React Native companion app.

3. **Real-time dashboard auto-refresh**
   - `DashboardPage.tsx` fetches stats once on mount with no polling or WebSocket subscription. Live operations desks need data that refreshes automatically.
   - Add `refetchInterval` to the dashboard query or subscribe to a WebSocket channel for live KPI updates.

4. **Carrier rate comparison engine**
   - The `carriers` table stores carrier info but not rate cards or per-route pricing. There is no way to compare costs across carriers when creating a waybill.
   - Add a `carrier_rates` table and a rate-comparison UI step in the waybill creation flow.

5. **Waybill proof-of-delivery (POD) document generation**
   - Drivers can mark deliveries as `DELIVERED` and optionally capture a signature (`DriverScanEvent.signature`), but there is no PDF generation for an official Proof of Delivery document.
   - Add a `GET /waybills/:id/pod` endpoint that renders a PDF POD using the waybill, recipient, delivery scan, and signature data.

6. **Audit log export**
   - `AuditLogPage.tsx` displays audit logs but there is no export button. Compliance teams often need audit exports for a specific date range.
   - Add `GET /audit-logs/export` (CSV/Excel) protected by `ADMIN` role, matching the pattern already used in the reports export endpoints.

---

## Summary Table

| Phase | Items | Impact |
|-------|-------|--------|
| 1 — Critical | 5 | Broken features in production |
| 2 — High Priority | 7 | Missing automation and data integrity |
| 3 — Medium Priority | 9 | Production hardening and reliability |
| 4 — Low Priority | 8 | UX, developer experience |
| 5 — Future | 6 | Product growth |
