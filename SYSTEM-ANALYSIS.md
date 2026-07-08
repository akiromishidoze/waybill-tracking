# Waybill Tracking System — Analysis & Fix List

> Generated: 2026-07-08  
> Scope: Full-stack review of `backend/core-api` (Go/Gin) and `frontend/dashboard` (React/TypeScript)

---

## Phase 1 — Critical / Security

1. **Default admin password shipped in config**  
   `config/config.go` defaults `ADMIN_PASSWORD` to `"teccadmin00"`. If `ADMIN_PASSWORD` is not set in the environment, the seeded admin account uses a publicly-known password. Apply the same `os.Exit(1)` guard used for `JWT_SECRET` — refuse to start in release mode with the default password.

2. **JWT token not rotated on role change**  
   `auth_handler.go → UpdateUserRoleHandler` updates the DB role but does not revoke existing JWT tokens. A user whose role is downgraded continues to have elevated access until the 24-hour token expires. Revoke all active JTIs for the affected user via the Redis blocklist on every role update.

3. **Rate limiter silently passes on Redis error**  
   `middleware/ratelimit.go:18–20` — if `rdb.Incr` fails (Redis unreachable) the middleware calls `c.Next()` and skips limiting entirely. Under a Redis outage, the login and registration endpoints become unthrottled. At minimum log a warning and enforce a conservative in-process fallback.

4. **Raw SQL strings built with `fmt.Sprintf` for `LIMIT`/`OFFSET`**  
   `repository/waybill_repo.go:48–56` and `repository/audit_log_repo.go:55–57` embed `limit` and `offset` directly into query strings via `fmt.Sprintf` instead of using parameterised placeholders. Although both values are parsed integers, this is a code-smell that bypasses the driver's prepared-statement path. Use `$N` parameters for all dynamic values.

5. **POD endpoint is outside the auth middleware group**  
   `cmd/server/main.go:75` — `GET /api/waybills/:id/pod` is registered before the `protected` group and relies on its own inline JWT check (`h.authFromRequest`). If the route is accidentally moved or duplicated, the inline check can be missed. Move it inside the `protected` group and remove the inline check.

6. **`attachment_handler.go` queries the DB directly without a repository**  
   `handlers/attachment_handler.go` holds a raw `*pgxpool.Pool` and issues SQL inline, bypassing the repository pattern used everywhere else. This makes it untestable with mock repos and means attachment logic is siloed from the rest of the data layer.

---

## Phase 2 — Data Correctness / Backend Logic

7. **`avgTransitTime` is a hardcoded constant**  
   `analytics_handler.go:57` returns `"avgTransitTime": 26.8` regardless of actual data. The same issue exists in `RegionPerformance` (`AvgTransitHours = 28.0`, line 183). Compute these from `actual_delivery - created_at` on delivered waybills, same pattern already used in `PredictETA`.

8. **`CostPerShipment`, `DemandForecast`, `CarbonFootprint` return fabricated numbers**  
   These three analytics endpoints multiply shipment counts by hardcoded unit rates (`3950.0`, `1.12`, `2.4`, etc.) and return empty arrays for breakdowns (`byCarrier`, `byRegion`, etc.). Either wire them to real data or mark them clearly as estimates in the response payload.

9. **`confidence` is hardcoded in ETA prediction fallback**  
   `analytics_handler.go:232` returns `confidence := 78.5` when the ML service is unavailable. This is surfaced directly to the UI as a real score. Return `null` or add a `"source": "historical-average"` flag so the frontend can suppress the confidence display.

10. **`BatchUpdateStatus` issues N individual DB writes in a loop**  
    `waybill_handler.go:584–611` — each waybill in the batch is fetched and updated one at a time inside a for-loop. For large batches this is N×2 round-trips. Use a single transaction with bulk `UPDATE … WHERE id = ANY($1)` and reduce to 2 round-trips.

11. **No pagination on high-cardinality list endpoints**  
    `carrier_handler.go`, `escalation_handler.go`, `team_handler.go`, `webhook_handler.go`, `return_handler.go`, `driver_handler.go` (ListAssignments/ListScans), `geofence_event_handler.go` all return unbounded result sets. Add `page`/`limit` params and `total` in the response consistently.

12. **Duplicate route registration**  
    `cmd/server/main.go:434–435` registers all routes twice — once under `/api` and once under `/api/v1`. Every request is handled by two separate router groups, doubling the middleware stack. Remove the `/api` group and standardise on `/api/v1`.

13. **Migration file naming conflict**  
    `migrations/` has two files named `002_*` (`002_exception_codes.sql` and `002_webhooks.sql`). The migrator runs files in lexicographic order; both will execute at the same sequence slot or one will be skipped depending on the migrator's deduplication logic. Rename one to `002b_webhooks.sql` or renumber sequentially.

14. **`AnalyticsHandler.Stats` uses 6 separate `QueryRow` calls**  
    `analytics_handler.go:30–35` — six independent DB round-trips for counts that could be done in a single query using conditional aggregates (`SUM(CASE WHEN …)`). This is N×6 load on every dashboard refresh.

15. **`settings_handler.go` bypasses the repository layer**  
    Like the attachment handler, `SettingsHandler` holds a raw `*pgxpool.Pool` and queries the DB directly. Extract into a `SettingsRepository` for testability and consistency.

---

## Phase 3 — Frontend Correctness

16. **`WaybillListPage` mixes array and paginated response shapes**  
    `WaybillListPage.tsx:48–56` uses `useMemo` with dual-path logic (`Array.isArray(rawData) ? rawData : rawData.data`) to handle two different response shapes. The backend consistently returns `{ data, meta }` — remove the array fallback path to eliminate the ambiguity.

17. **JWT stored in `localStorage` (XSS risk)**  
    `store/auth.ts:17` and `services/api.ts:14` read the token from `localStorage`. This exposes the token to any XSS attack. Prefer `httpOnly` cookies managed by the backend, or at minimum document this as a known risk and add a `Content-Security-Policy` header.

18. **`window.location.href = '/login'` inside an Axios interceptor**  
    `services/api.ts:24, 47` — hard navigation inside an interceptor bypasses React Router's history and drops any pending query cache. Use React Router's `navigate` or emit an event the app can handle cleanly.

19. **`App.tsx` mixes lazy and eager imports inconsistently**  
    Heavy pages like `DriverAppPage` (25 KB), `ECommerceIntegrationsPage` (22 KB), `CustomsCompliancePage` (20 KB), `SettingsPage` (28 KB) are lazy-loaded correctly. But equally large pages — `CarriersPage` (21 KB), `WaybillDetailPage` (18 KB), `AutoCommunicationsPage` (19 KB) — are eagerly imported, inflating the initial bundle. Apply `lazy()` consistently to all route-level pages above ~10 KB.

20. **`DashboardPage` persists refresh interval in `localStorage` but resets on logout**  
    The interval preference (`dashboard_refresh_interval_ms`) is never cleared on logout. On shared machines, one user's preference persists for the next. Clear all preference keys in the `logout` action of `authStore`.

21. **No global error boundary for async data failures**  
    `App.tsx` wraps the tree in `<ErrorBoundary>` but the boundary only catches render errors. Async query errors from `useQuery` render nothing or `undefined` in many pages (no `isError` guard). Standardise an `isError` + error message pattern across all data-fetching pages, similar to what was done in `WaybillNewPage`.

22. **`DriverAppPage` filter is client-side only**  
    `DriverAppPage.tsx:44–46` fetches all driver assignments with `driverService.listAssignments()` and filters by `selectedDriver` in the browser. With many drivers this transfers unnecessary data. Add a `?driverId=` filter param to the backend endpoint.

---

## Phase 4 — Code Quality / Maintainability

23. **Many handlers have no nil-repo guard**  
    `carrier_handler.go`, `webhook_handler.go`, `erp_handler.go`, `return_handler.go`, `escalation_handler.go`, `team_handler.go` and others do not check `h.repo == nil` before use. When instantiated without a real DB (e.g. in tests), they panic. Add nil guards consistent with `waybill_handler.go` and `audit_log_handler.go`.

24. **Test coverage is sparse**  
    Only `waybill_handler`, `auth_handler`, `audit_log_handler`, `carrier_rate_handler`, `pod_handler`, `attachment_handler`, and middleware have test files. All other handlers — `analytics`, `escalation`, `erp`, `driver`, `carrier`, `settings`, `webhooks`, `returns`, `customs`, `cod`, `bi_integration` — have zero test coverage.

25. **`analytics_handler.go` and `settings_handler.go` do not use `c.Request.Context()`**  
    Both create their own `context.Background()` instead of using the request context. This breaks request cancellation — a client disconnect does not cancel the DB query, wasting DB connections.

26. **`ExportExcel` builds a CSV by manual string concatenation**  
    `analytics_handler.go:339–348` builds CSV rows with `+=` string concatenation instead of `encoding/csv`. Values containing commas or quotes will produce malformed CSV. Use the `csv.Writer` already used in `audit_log_handler.go`.

27. **`generateTrackingNumber` uses only 9 chars of a UUID**  
    `waybill_handler.go:640` — `uuid.New().String()[:9]` gives ~36^9 ≈ 101 billion combinations but the UUID hex is `[0-9a-f]` only (16 chars), so the real entropy is 16^9 ≈ 68 billion. With high import volume this can collide. Add a DB `UNIQUE` constraint on `tracking_number` and handle the `23505` conflict error with a retry.

28. **No integration or e2e tests**  
    The `tests/` directory at the repo root is empty. There are no integration tests that exercise the full HTTP stack against a test database. Add at minimum a smoke test that covers login → create waybill → update status → get waybill.

29. **`mock-api.ts` seed data is disconnected from the real DB schema**  
    Fields like `slaBreached`, `estimatedDelivery`, `teamName` exist in the seed data but must be manually kept in sync with any DB schema changes. Consider generating seed data from a shared schema fixture or running the mock only when explicitly opted in via an env flag.

30. **`TECHNICAL-DEBT.md` items P4 L1–L4 are done but not marked complete**  
    The completed items (handler tests, `RateCompare` error UI, `mock-api.ts` types, `AuditLogPage` server-side search) should be checked off to keep the debt register accurate.
