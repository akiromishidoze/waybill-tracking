# Waybill Tracking — Enhancement Roadmap

Prioritized list of improvements needed to bring the application to production readiness.

---

## CRITICAL (Blocks app from functioning)

| # | Item | File(s) | Issue |
|---|------|---------|-------|
| 1 | **Kafka producer never called** | `waybill_handler.go:102` | `UpdateStatus` saves to DB + Redis but never calls `kafkaProducer.PublishScanEvent` or `PublishStatusChange`. Kafka topic gets zero events. |
| 2 | **WebSocket broadcast never triggered** | `main.go:35-39`, `ws_handler.go` | Hub is created but `BroadcastWaybillUpdate` is never invoked. Status updates don't push to connected clients. |
| 3 | **No courier endpoints** | `main.go:49-63` | Mobile app's `courier/assignments` and `courier/scan` routes don't exist. |
| 4 | **No registration / user creation** | `auth_handler.go` | Only login exists. No POST `/auth/register`, no user invite flow, no password reset. |
| 5 | **Missing auth/me endpoint** | `main.go`, `frontend` | Frontend `useAuth` calls `/auth/me` but it's not defined in backend routes. |

## HIGH (Major feature gaps)

| # | Item | File(s) | Issue |
|---|------|---------|-------|
| 6 | **No tests anywhere** | `backend/*`, `frontend/*` | Zero unit/integration tests despite CI referencing test commands. |
| 7 | **Search endpoint not implemented** | `waybill_repo.go:23-51` | `List()` does a simple `LIMIT 100` with no WHERE clause. Frontend sends `?search=` param but it's ignored. |
| 8 | **Waybill create missing shipperName** | `waybill_handler.go:56-76` | `wb.ShipperName` is never set from the request or user context. The DB column is NOT NULL. |
| 9 | **Notification services are stubs** | `tasks.py:9-24` | `send_email_notification`, `send_sms_notification`, `generate_daily_report` all `raise NotImplementedError`. |
| 10 | **No Celery beat schedule** | `celery_app.py` | No periodic tasks configured (daily reports, anomaly scanning). |
| 11 | **CORS config too permissive** | `main.go:43-47`, `main.py:17-22` | Both APIs allow `*` origin — security risk. |
| 12 | **No rate limiting** | `middleware/auth.go` | No rate limiting on auth endpoints (login brute force). |
| 13 | **No input validation on status transitions** | `waybill_handler.go:79-107` | Any status can transition to any other — no state machine enforcement. |
| 14 | **No pagination on list endpoints** | `waybill_repo.go:23` | Waybill list hard-limited to 100 records with no cursor/offset. |
| 15 | **Dockerfiles may not build** | `Dockerfile` files | Go `go.sum` was manually assembled. Python pins exact versions that may conflict. |

## MEDIUM (Should have for production readiness)

| # | Item | File(s) | Issue |
|---|------|---------|-------|
| 16 | **No Redis connection error handling** | `main.go:28-30` | `redis.NewClient` doesn't check connectivity. |
| 17 | **Kafka producer missing topic config** | `producer.go:16-21` | Writer doesn't set `Topic` — uses empty topic. |
| 18 | **No health check for dependencies** | `health.go` | Only returns `{"status":"ok"}` without checking DB/Redis/Kafka. |
| 19 | **No request ID / logging middleware** | `main.go` | No structured logging, no request tracing. |
| 20 | **Missing Elasticsearch integration** | `core-api` | ES is in infra but never referenced in code. |
| 21 | **Auth uses raw JWT secret** | `config.go` | Hardcoded default `change-me-in-production`. No key rotation. |
| 22 | **Python FastAPI missing middleware** | `analytics-api` | No auth middleware on analytics endpoints. |
| 23 | **No webhook dispatcher** | `spec` | No webhook table, retry logic, or HTTP callout code. |
| 24 | **No API documentation beyond OpenAPI defaults** | `main.py` | No custom descriptions or response models annotated. |
| 25 | **Frontend lacks error boundaries** | `frontend` | No React error boundaries, empty `catch` blocks. |
| 26 | **Frontend missing loading skeletons** | `frontend/pages/*` | Only bare "Loading..." text. |
| 27 | **Frontend uses inline styles** | `frontend/**/*.tsx` | No CSS modules or Tailwind utility classes despite Tailwind being configured. |
| 28 | **No state management for user auth** | `frontend` | Token stored in localStorage manually, no zustand store. |
| 29 | **Missing waybill "new" page** | `App.tsx:21` | Route points to `/waybills/new` but no component exists. |
| 30 | **K8s secrets are placeholder** | `k8s/*/deployment.yaml` | Manifests reference `waybill-secrets` that doesn't exist. |

## LOW (Nice to have / future)

| # | Item | File(s) | Issue |
|---|------|---------|-------|
| 31 | **No Terraform state backend** | `terraform/*/main.tf` | State stored locally — no remote backend. |
| 32 | **No database migration tool** | `migrations/` | SQL file exists but no migration runner. |
| 33 | **Alerting rules missing** | `prometheus.yml:4` | References `alerts.yml` but file doesn't exist. |
| 34 | **Grafana dashboards empty** | `grafana/dashboards/` | Only datasource defined, zero dashboards. |
| 35 | **No SSL/TLS config** | `nginx.conf` | Only port 80. No SSL despite `443` in docker-compose. |
| 36 | **No log aggregation** | `infrastructure` | No ELK/loki/fluentd setup. |
| 37 | **No feature flags** | `entire project` | No mechanism to toggle features. |
| 38 | **No API versioning** | `main.go` | Routes use `/api/` with no version prefix. |
| 39 | **Analytics ML models absent** | `analytics-api` | `scikit-learn` in deps but no model pipeline. |
| 40 | **No e2e or load tests** | `entire project` | No k6/artillery/Locust scripts for performance testing. |
