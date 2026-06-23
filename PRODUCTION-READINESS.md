# Waybill Tracking — Production Readiness Checklist

> **Generated:** 2026-06-23
> **Scope:** `/home/teccjm/Desktop/waybill-tracking/frontend/dashboard`

---

## Critical (Blocks production deployment)

1. **Separate mock data from service layer** — `src/services/api.ts` has an axios interceptor that overrides ALL API calls with mock data. Move mock interceptors to `src/services/mock-api.ts` that only activates in dev mode. The core `api.ts` should be a clean axios instance.

2. **Add missing backend `/auth/me` route** — `store/auth.ts` calls `/auth/me` but no backend route exists. The frontend cannot function in production without this — user profile/auth system is non-functional.

3. **Remove duplicated `api.ts` files** — Root `/api.ts` (real service, 189 lines, unused) vs `src/services/api.ts` (mock service, 1066 lines, only one used). Consolidate into a single clean architecture.

4. **Remove duplicated `waybill.ts`** — Root `/waybill.ts` (partial types) vs `src/types/waybill.ts` (full comprehensive types). Root file lacks `ErpIntegration`, `DriverAssignment`, customs types, and many others.

---

## High (Major gaps — must fix before production)

5. **Add form validation** — `react-hook-form` (v7.52.0) and `zod` (v3.23.8) are installed but never imported. `WaybillNewPage.tsx` uses manual state with only HTML5 `required` attributes. No field-level error messages, no schema validation, no debounced async validation.

6. **Add toast/notification system** — No toast library is installed. Users get no success/error feedback after mutations (creating waybills, deleting records, etc.). Actions silently succeed or fail with no visible feedback.

7. **Implement pagination** — `WaybillListPage.tsx` loads ALL waybills at once via `useQuery`. CSS pagination styles are defined in `components.module.css` but no page implements pagination. No page size selector, no "Load More", no infinite scroll.

8. **Replace native `confirm()` with custom modal** — 7 locations use native browser `confirm()` dialogs for destructive actions:
   - `WaybillDetailPage.tsx:264` — Delete attachment
   - `UsersPage.tsx:104` — Delete user
   - `SettingsPage.tsx:211` — Delete team
   - `SettingsPage.tsx:278` — Delete escalation rule
   - `CarriersPage.tsx:104` — Delete carrier
   - `WebhooksPage.tsx:138` — Delete webhook
   - `AggregatedTrackingPage.tsx:139` — Remove carrier from waybill

9. **Increase test coverage** — Only 4 test files exist (16 tests total) covering only 2 of 42 pages. No tests for mutations, stores, components, or integration flows. No e2e tests (Playwright/Cypress).

10. **Add CI/CD pipeline** — No `.github/`, `.gitlab-ci.yml`, `Jenkinsfile`, or any CI configuration. No pre-commit hooks (husky, lint-staged). No automated lint/test/build pipeline.

11. **Create `.env` configuration** — No `.env` files exist anywhere. No `.env.example`. Environment variables `VITE_API_URL` and `VITE_WS_URL` are referenced but undocumented. No build-time environment validation.

12. **Add error monitoring** — `ErrorBoundary.tsx` only `console.error`s — no Sentry or error reporting service integration. Errors in production are invisible.

13. **Refactor inline styles to CSS modules** — 90%+ of component styles are inline `style={{}}` objects. Massive bundle size, no CSS caching, poor maintainability. CSS module `components.module.css` (527 lines) is barely used — only `WaybillNewPage.tsx` consistently uses it.

14. **Implement internal notes/comments** — PRODUCTION.md #23 — missing feature. `WaybillDetailPage.tsx` has no section for adding operational notes or case comments to a waybill.

15. **Implement route deviation alerts** — ROADMAP.md — missing entirely. No UI component, no backend logic for detecting or displaying route deviations.

16. **Improve auth token security** — JWT stored in `localStorage` via `store/auth.ts` — accessible to any JS on the same origin (XSS vulnerable). No refresh token mechanism. No token expiry check before API calls.

17. **Add missing loading skeletons** — Many list pages lack skeleton loaders (`CarriersPage`, `WebhooksPage`, `BatchStatusPage`, etc.). `DashboardPage.tsx` shows `—` placeholders instead of a skeleton/spinner while data loads.

18. **Standardize empty states** — No reusable `<EmptyState>` component. Some pages show raw "No data" text without contextual messaging. Some pages have no empty state at all (`AuditLogPage`, `CarriersPage`, `BatchStatusPage`).

19. **Fill `src/utils/` directory** — Directory exists but is empty. `formatDateGroup` and `formatFileSize` functions are duplicated inline across pages. Extract date formatting, file size formatting, debounce, and API error handling into utilities.

20. **Add nginx SPA config** — `Dockerfile` copies `dist/` to nginx but has no `try_files` fallback for client-side routing — page refresh on any route returns 404.

21. **Add `.dockerignore`** — No `.dockerignore` file means `node_modules` and other unnecessary files are sent to the Docker build context.

22. **Add Helmet and compression** — Missing `helmet` for HTTP security headers (CSP, HSTS, XSS) and `compression` for gzip/brotli response compression.

---

## Medium (Should fix for production readiness)

23. **Add webhook dispatcher backend** — ENHANCEMENTS.md #23 — Webhook UI exists (`WebhooksPage.tsx`) but backend never actually sends webhooks. `backend/main.py` has no webhook dispatcher.

24. **Add API versioning** — All routes use `/api/` with no version prefix. Should be `/api/v1/` for future backward compatibility.

25. **Add feature flags** — ENHANCEMENTS.md #37 — `useFeatures` hook calls `/features` endpoint that doesn't exist on backend. No feature flag system implemented.

26. **Add log aggregation** — ENHANCEMENTS.md #36 — No ELK/loki/fluentd integration. Production errors have no centralized logging.

27. **Add Redis error handling** — ENHANCEMENTS.md #16 — No Redis connection error handling. Backend `redis_client.py` has no fallback if Redis is down.

28. **Remove hardcoded mock credentials** — `LoginPage.tsx:45` shows "Email: Admin / Password: admin" hint. `src/services/api.ts:4-5` hardcodes `MOCK_USER` and `MOCK_TOKEN`. These should be stripped or hidden behind a dev flag.

29. **Add role-based route protection** — `ProtectedRoute.tsx` only checks token existence. No role-based routing (role check only happens in sidebar UI). No 403 page or unauthorized state.

30. **Implement cold chain/temperature monitoring** — ROADMAP.md — Missing dedicated UI. IoT sensor page (`IotSensorPage.tsx`) partially covers temperature readings but no dedicated cold-chain dashboard exists.

31. **Add request rate limiting** — ENHANCEMENTS.md #12 — No rate-limiting middleware on the backend. Login page has no CAPTCHA, no exponential backoff, no rate-limit feedback.

32. **Add health check endpoint** — ENHANCEMENTS.md #18 — No health check for backend dependencies (Redis, database, Kafka). No `/health` endpoint.

33. **Add request ID/logging middleware** — ENHANCEMENTS.md #19 — No request correlation ID or structured logging middleware on the backend.

34. **Fix CORS configuration** — ENHANCEMENTS.md #11 — Backend allows `*` origin in `main.go` and `main.py`. Should be locked to specific origins in production.

35. **Add pagination on backend list endpoints** — ENHANCEMENTS.md #14 — Backend `waybill_repo.go:23` hardcodes `LIMIT 100` with no cursor/offset support.

36. **Replace empty catch blocks** — `WaybillDetailPage.tsx:130` (file upload) and `WaybillNewPage.tsx:52` have empty `catch` blocks that silently swallow errors.

---

## Low (Nice to have / future improvements)

37. **Add e2e tests** — ENHANCEMENTS.md #40 — No Playwright/Cypress configuration for end-to-end testing.

38. **Add load tests** — No k6/artillery/Locust scripts for performance and load testing.

39. **Add Terraform state backend** — ENHANCEMENTS.md #31 — Terraform config exists but no remote state backend configured.

40. **Add database migration tool** — ENHANCEMENTS.md #32 — No Alembic or similar migration tool for the database schema.

41. **Add Prometheus alerting rules** — ENHANCEMENTS.md #33 — `prometheus/` directory exists but `alerts.yml` is missing.

42. **Add API documentation** — ENHANCEMENTS.md #24 — No custom API docs beyond OpenAPI defaults. No Postman collection or developer portal.

43. **Implement analytics ML models** — ENHANCEMENTS.md #39 — `scikit-learn` is in backend dependencies but no ML models are implemented for demand forecasting or anomaly detection.

44. **Add dynamic page titles** — `index.html:8` hardcodes the title. No `react-helmet-async` for per-page titles and SEO metadata.

45. **Add responsive design** — No `useMediaQuery`, no mobile-responsive layouts. Application is desktop-only.

46. **Add keyboard accessibility** — No focus trapping, no aria labels, no skip-to-content links. Not screen-reader friendly.

47. **Add noopener/noreferrer on external links** — Several pages link to external URLs without `rel="noopener noreferrer"` (security best practice).

48. **Add favicon and PWA support** — `index.html` has no favicon. No service worker or manifest for PWA support.

49. **Add input sanitization** — File uploads accept any file type without validation. Search input is passed directly to API without sanitization.

50. **Add K8s secret management** — ENHANCEMENTS.md #30 — Kubernetes secrets are placeholder values. No HashiCorp Vault or SealedSecrets integration.
