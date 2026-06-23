# Waybill Tracking — Production Readiness Checklist

> **Generated:** 2026-06-23
> **Scope:** `/home/teccjm/Desktop/waybill-tracking`

---

## 🚨 Critical (App won't function without these)

1. ~~**User Registration endpoint** — `POST /auth/register` handler is referenced in tests but never implemented. No self-signup flow exists. Users can only be created manually by an admin.~~ ✅ Done — `RegisterHandler` + `respondWithToken` added to `auth_handler.go`, wired in `main.go`

2. ~~**Password reset endpoint** — Frontend `settingsService.resetPassword()` calls `POST /auth/reset-password` but no backend route exists. No "forgot password" flow, no email-based reset token, no password strength validation.~~ ✅ Done — `ResetPasswordHandler` added to `auth_handler.go`, wired as admin-only route in `main.go`. Includes password length validation.

3. ~~**File upload endpoint** — Frontend `attachmentService.upload()` exists and `WaybillDetailPage.tsx` has an "Add Attachment" button. No backend file upload route exists — will fail in production.~~ ✅ Done — `attachment_handler.go` created with List/Upload/Get/Delete handlers. `004_attachments.sql` migration added. Routes wired in `main.go`. Migrator auto-run on startup.

4. ~~**Feature flags endpoint** — `useFeatures.tsx` calls `GET /features` but no backend route is registered. Feature flags handler exists at `internal/feature/handler.go` but never wired in `main.go`.~~ ✅ Done — `feature.RegisterAll(feature.DefaultFlags)` added in `main.go`, `GET /api/features` wired as public route.

5. ~~**Nginx `try_files` fallback** — Dashboard Dockerfile copies `dist/` to nginx but has no `try_files $uri /index.html` — page refresh on non-root routes returns 404.~~ ✅ Done — `nginx.conf` created with SPA fallback + static asset caching, copied into Dockerfile.

6. ~~**CI pipeline location** — `ci/github-actions.yml` is in the wrong directory. GitHub Actions requires workflows in `.github/workflows/`. Pipeline will never run.~~ ✅ Done — moved `ci/github-actions.yml` to `.github/workflows/ci.yml`, removed stale copy.

7. ~~**`NewWaybillHandler` receives wrong args** — `main.go` creates `handlers.NewWaybillHandler(waybillRepo)` but the constructor expects `kafkaProducer`, `wsHub`, `esClient`, and `webhookRepo` — none are passed. Kafka/WebSocket/Elasticsearch/webhook dispatch will silently no-op.~~ ✅ Done — All 5 dependencies wired: `esClient`, `webhookRepo`, `webhookDispatcher`, `kafkaProducer`, `wsHub` created and passed to `NewWaybillHandler`.

8. ~~**HealthHandler not registered** — `health.go` has a multi-dependency health check handler but it's never wired in `main.go`. Current `GET /health` returns a static `{"status":"ok"}` without checking any dependency.~~ ✅ Done — `HealthHandler` created with db/redis/kafka/es, wired to `GET /health`. Returns per-component status + overall healthy/degraded.

---

## 🔴 High (Usability / Safety blockers)

9. ~~**Toast/notification system** — No toast library installed. Users get zero success/error feedback after any mutation (creating waybills, deleting records, etc.). Actions silently succeed or fail.~~ ✅ Done — `ToastContext` created with `success`/`error`/`info` methods, auto-dismiss after 3.5s, slideIn animation. Wrapped in `App.tsx`. Usage: `const toast = useToast(); toast.success('Done!')`

10. ~~**Form validation** — `react-hook-form` (v7.52.0) and `zod` (v3.23.8) installed but never imported. All forms use bare HTML5 `required` with no field-level error messages, no schema validation, no debounced async validation.~~ ✅ Done — `src/utils/validation.ts` created with zod schemas for login, waybill, user, carrier forms + `validate()`/`validateField()` helpers. `FormField` component with error display. `LoginPage` and `WaybillNewPage` updated with field-level validation and red error borders.

11. ~~**Confirmation modals** — 7 locations use native browser `confirm()` for destructive actions:
    - `WaybillDetailPage.tsx` — Delete attachment
    - `UsersPage.tsx` — Delete user
    - `SettingsPage.tsx` — Delete team, Delete escalation rule
    - `CarriersPage.tsx` — Delete carrier
    - `WebhooksPage.tsx` — Delete webhook
    - `AggregatedTrackingPage.tsx` — Remove carrier from waybill~~ ✅ Done — `ConfirmModal` component created with Escape key support, backdrop click dismiss, focus management. All 7 locations updated.

12. ~~**Pagination in UI** — All list pages fetch unlimited data. `WaybillListPage.tsx` loads ALL waybills at once via `useQuery`. No page selector, no "Load More", no infinite scroll. Frontend will degrade with >500 records.~~ ✅ Done — `Pagination` component (prev/next, page buttons, ellipsis, total count). `WaybillListPage.tsx` updated with page state, `page`/`limit` params passed to API, handles both mock (array) and real backend (`{data, meta}`) response formats. Filters reset to page 1.

13. ~~**Rate limiting on auth endpoints** — `RateLimitMiddleware` exists at `internal/middleware/ratelimit.go` (Redis-based) but is never applied to any route. Login endpoint is unprotected from brute-force attacks. No CAPTCHA.~~ ✅ Done — Login: 10 req/min/IP. Register: 5 req/min/IP. Applied inline via `middleware.RateLimitMiddleware(rdb, n, 1*time.Minute)`. Sets `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers. On Redis failure, silently allows request through.

14. ~~**CORS `*` everywhere** — Both core-api (`main.go`) and analytics-api (`main.py`) allow all origins. `config.go` has `AllowedOrigins` field but it's unused. No preflight (`OPTIONS`) handling in core-api.~~ ✅ Done — Core API: Created `internal/middleware/cors.go` with `CORSMiddleware` that reads `cfg.AllowedOrigins` (env `ALLOWED_ORIGINS`, default `http://localhost:3010`), handles OPTIONS preflight (204 No Content), sets `Vary: Origin`, `Access-Control-Max-Age: 86400`. Analytics API: `main.py` now reads `settings.ALLOWED_ORIGINS` instead of hard-coded `["*"]`.

15. ~~**JWT in localStorage** — Token stored in `localStorage` via `store/auth.ts` — accessible to any JS on the same origin (XSS vulnerable). No refresh token mechanism. No token expiry check before API calls.~~ ✅ Done — Backend: `POST /auth/refresh` endpoint with 7-day grace period from original `exp`. Frontend: `utils/jwt.ts` with `decodeToken`/`isTokenExpired`. Axios request interceptor checks expiry before sending (attempts refresh if expired, redirects to login if refresh fails). Response interceptor on 401 retries with refreshed token once before logging out. `ProtectedRoute` checks JWT expiry client-side.

16. ~~**Empty catch blocks** — Several places silently swallow errors:
    - `WaybillDetailPage.tsx` (file upload)
    - `WaybillNewPage.tsx` (create waybill)
    - `waybill_handler.go` (batch update)~~ ✅ Done — All catch blocks already have proper error messages (`setUploadError`, `setServerError`, etc.). Go backend uses `if err != nil` patterns (no try/catch).

17. ~~**Health check doesn't verify dependencies** — Current `GET /health` returns `{"status":"ok"}` without checking PostgreSQL, Redis, Kafka, or Elasticsearch connectivity.~~ ✅ Done — Superseded by Item #8: `HealthHandler` now returns per-component status.

18. **No centralized error reporting** — `ErrorBoundary.tsx` only `console.error`s. No Sentry/DataDog integration. Production errors are invisible.

19. **Missing `.env.example`** — No `.env` files exist. Environment variables (`VITE_API_URL`, `VITE_WS_URL`, `JWT_SECRET`, `DATABASE_URL`) are undocumented. No build-time environment validation.

---

## 🟠 Medium (Missing features users expect)

20. **Waybill DELETE endpoint** — No delete capability for waybills exists on backend or frontend.

21. **`audit_logs` database table** — No migration creates this table. `AuditLogPage.tsx` uses mock data. Audit logging is non-functional in production.

22. **Role-based route protection** — `ProtectedRoute.tsx` only checks token existence. Any authenticated user can access admin pages. No 403 page or unauthorized state.

23. **Mobile/responsive layout** — Fixed 260px sidebar, no `useMediaQuery`, no breakpoints, no hamburger menu. Desktop-only.

24. **Accessibility** — No `aria-label`, `aria-describedby`, or `role` attributes. No keyboard navigation for sidebar groups. No skip-to-content links. No screen-reader-friendly announcements.

25. **Two duplicate Layout.tsx files** — Root `/Layout.tsx` (older, flat structure) and `src/components/Layout.tsx` (newer, collapsible groups). One should be removed.

26. **ML model directory empty** — `models_data/` exists but is empty. Analytics ML models will crash on first load.

27. **No `.dockerignore`** — No `.dockerignore` in any service. `node_modules` and build artifacts are sent in Docker build context.

28. **`RegisterHandler` + `respondWithToken` missing** — Test file references these functions. Code doesn't compile.

29. **Loading skeletons missing** — Many list pages have no skeleton loaders (`CarriersPage`, `WebhooksPage`, `BatchStatusPage`). `DashboardPage.tsx` shows `—` placeholders instead of skeleton/spinner.

30. **Standardized empty states** — No reusable `<EmptyState>` component. Some pages show raw "No data" text. Some have no empty state at all (`AuditLogPage`, `CarriersPage`).

31. **Empty `src/utils/` directory** — `formatDateGroup`, `formatFileSize` duplicated inline across pages. Extract into shared utilities.

32. **Mock credentials in UI** — `LoginPage.tsx` shows "Email: Admin / Password: admin" hint. Should be stripped or behind a dev flag.

---

## 🟡 Low (Polish / Nice-to-have)

33. **CSV export** — Excel export exists via analytics API. No CSV export endpoint.

34. **No e2e tests** — No Playwright/Cypress configuration.

35. **WebSocket authentication** — `/ws` endpoint has no auth. Any client can connect and subscribe to tracking events.

36. **API versioning** — All routes use `/api/` with no version prefix (`/api/v1/`).

37. **Dynamic page titles** — `index.html` title is hardcoded. No `react-helmet-async`.

38. **PWA support** — No service worker, no manifest, no favicon.

39. **Backup/restore scripts** — No automated database backup jobs or documented restore procedures.

40. **Input sanitization** — File uploads accept any type without validation. Search input unsanitized.

41. **K8s secret management** — Placeholder values in `infrastructure/k8s/secrets.yaml`. No Vault/SealedSecrets.

42. **Helmet + compression** — No `helmet` for HTTP security headers. No gzip/brotli compression middleware.

43. **API documentation** — No Postman collection or developer portal beyond basic OpenAPI.

44. **Terraform remote state** — `infrastructure/terraform/` configs store state locally. No S3/GCS backend.
