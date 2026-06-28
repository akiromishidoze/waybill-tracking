# Production Readiness Tasks — Waybill Tracking

This document lists essential missing tasks that must be completed before the waybill tracking application can be safely pushed to production. Tasks are grouped by priority, with each group numbered independently starting from 1.

---

## Critical Phase (Must Fix Before Production)

1. **Secure the Analytics API**
   - The `analytics-api` has a complete auth module (`app/core/auth.py`) but none of the analytics or report endpoints use it. `GET /api/v1/analytics/stats`, `GET /api/v1/reports/export`, and all other analytics routes are publicly accessible without authentication.
   - Add `Depends(get_current_user)` to all analytics routes and protect sensitive routes with `require_role`.

2. **Wire Notification Triggers to Real Delivery**
   - The `NOTIFICATIONS` feature flag is disabled by default. The Go core-api never calls the Celery tasks (`send_email_notification`, `send_sms_notification`) when a delivery event occurs.
   - Enable the flag, add a notification dispatcher in the waybill status flow that enqueues Celery tasks, and make the sender email/phone number configurable.

3. **Replace Default and Weak Secrets in Runtime Config**
   - `docker-compose.yml` uses `JWT_SECRET: "${JWT_SECRET:-change-me-in-production}"`. If the environment variable is missing, the app launches with a known default secret.
   - Fail startup if `JWT_SECRET` is not set or is the placeholder value. Use sealed-secrets or an external secrets operator for Kubernetes deployments.

4. **Fix Kafka Inter-Service Networking**
   - `KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092` advertises `localhost` to Docker containers, which breaks producers and consumers running inside other containers.
   - Use separate internal and external listeners (e.g., `PLAINTEXT://kafka:29092` for Docker, `PLAINTEXT://localhost:9092` for host access).

5. **Add Real Carrier API Integration**
   - The `carriers` table and management UI exist, but there is no code that polls carrier tracking APIs or normalizes their scan events into the system.
   - Build a carrier adapter worker that polls carrier APIs (J&T, LBC, etc.) and creates `scan_events` automatically.

6. **Implement an E-Commerce Sync Worker**
   - `POST /ecommerce/webhook/:platformId` exists, but there is no scheduled or background worker that pulls orders from Shopify/Lazada/Shopee APIs.
   - Add a Celery beat task that periodically syncs orders from connected platforms and creates corresponding waybills.

7. **Add a New Waybill Page**
   - The route `/waybills/new` is referenced in documentation but is not present in `App.tsx`. Operators cannot create a waybill through the dashboard UI.
   - Add a `WaybillNewPage` component, register it in the router, and link it from the waybill list page.

---

## High Priority Phase (Required for Reliable Operations)

1. **Rate-Limit Public and Analytics Endpoints**
   - Only `/auth/login` and `/auth/register` have rate limiting. Public `/track/:trackingNumber` and all analytics endpoints are unprotected.
   - Add Redis-backed rate limiting to `/track`, analytics routes, and export endpoints to prevent scraping and overload.

2. **Strengthen Password and Account Security**
   - Password minimum is only 5 characters. There is no password reset email flow, no failed-login lockout, and no audit log for failed login attempts.
   - Enforce stronger password rules, add a password reset token email flow, and log failed login attempts to the audit log.

3. **Add Graceful Shutdown and Signal Handling**
   - `main.go` does not trap `SIGTERM` or `SIGINT`. In-flight database, Kafka, and WebSocket operations may be aborted during deploys or restarts.
   - Use `signal.NotifyContext` and shut down the HTTP server, database pool, Redis client, and Kafka writer cleanly.

4. **Add a Database Backup and Restore Strategy**
   - Docker volumes are used, but there is no backup job, retention policy, or restore documentation.
   - Add a scheduled pg_dump job or use a managed database service, and document restore procedures.

5. **Fix Scan Event Timestamps**
   - During end-to-end testing, the API returned `"timestamp":"0001-01-01T00:00:00Z"` for newly created scan events.
   - Ensure `ScanEvent.Timestamp` is set to `NOW()` on insert if the client does not provide a timestamp.

6. **Enable and Validate Real ETA Prediction**
   - The `ETA_PREDICTION` feature flag is off. The analytics service appears to use a simple historical average rather than a trained ML model.
   - Train and persist a model, expose it behind the feature flag, and validate predictions against real data.

7. **Add API Documentation for the Core API**
   - The analytics API has auto-generated OpenAPI docs, but the core-api only has a Postman collection and no generated documentation.
   - Adopt OpenAPI generation (e.g., `swaggo`) or manually annotate routes.

---

## Medium Priority Phase (Production Hardening)

1. **Add End-to-End and Load Tests**
   - The frontend has only two page tests (`DashboardPage`, `LoginPage`). There are no Playwright end-to-end specs or k6/Locust load tests.
   - Add Playwright tests for the critical path (login, create waybill, add scan, track) and load tests for `/track` and `/api/v1/waybills`.

2. **Expand Frontend Test Coverage**
   - Most pages and components have no unit tests.
   - Add unit tests for key components including the waybill list, map view, settings panel, and analytics charts.

3. **Add Prometheus Alerting Rules**
   - `prometheus.yml` is present but `alerts.yml` is missing.
   - Create alert rules for API error rate, database connectivity, and Kafka consumer lag.

4. **Implement Terraform Remote State**
   - Terraform state is stored locally.
   - Configure an S3 or GCS backend with state locking so the team can collaborate and CI/CD can deploy safely.

5. **Add Request Tracing and Structured Logging**
   - Logs are plain `log.Printf` messages with no request IDs, correlation IDs, or structured fields.
   - Adopt a structured logger such as `uber-go/zap` or `slog`, and attach request IDs to every request.

6. **Review Production CORS and Security Headers**
   - CORS is configurable via `ALLOWED_ORIGINS`, but the default `http://localhost:3010` is easy to leave in production.
   - Validate `ALLOWED_ORIGINS` in production and reject wildcard origins before deployment.

7. **Implement Webhook Retry and Dead-Letter Queue**
   - Webhooks are dispatched, but retry logic and dead-letter tracking are not visible to operators.
   - Add exponential backoff retry and a failed-webhook admin UI so external partners do not miss events.

8. **Add a Public White-Label Portal**
   - White-label configuration is stored, but no public-facing route serves a branded tracking page.
   - Build a public `/portal/:slug` or `/track/:trackingNumber` branded page for customers.

---

## Low Priority Phase (Future Roadmap)

1. **Driver Mobile App Workflow**
   - The `/driver-app` dashboard page exists, but there is no dedicated courier mobile API workflow for last-mile delivery.

2. **Return / Reverse Logistics Lifecycle**
   - The `/returns` page exists, but the backend return lifecycle is minimal and not fully integrated with status tracking.

3. **Cost-Per-Shipment and Carbon Footprint Analytics**
   - Dashboard pages exist, but the underlying data and calculations are likely stubbed or incomplete.

4. **Route Deviation and Dynamic Re-Routing**
   - UI pages exist, but there is no routing engine integration to detect deviations or suggest reroutes.

5. **Customs Compliance and COD Reconciliation**
   - UI placeholders exist, but full workflows for customs documentation and cash-on-delivery reconciliation are not implemented.

---

## Immediate Action Summary

If pushing to production soon, complete these five items first:

1. Authenticate the analytics API endpoints.
2. Wire real email/SMS notifications to delivery events.
3. Enforce strong JWT secrets and replace Kubernetes secret placeholders.
4. Fix Kafka inter-service networking.
5. Integrate real carrier APIs for tracking data.
