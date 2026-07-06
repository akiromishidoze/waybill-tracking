# Technical Debt & Recommendations

Priority tiers: **P1 Critical** → **P2 High** → **P3 Medium** → **P4 Low**
Status legend: `[ ]` open · `[x]` done

---

## P1 — Critical (correctness / data integrity)

- [ ] [1] **`CreateWaybillRequest` missing `carrier_name` from rate comparison**
  - `WaybillNewPage.tsx:149` passes `carrierId` to `waybillService.create()` but
    `CreateWaybillRequest` in `models/waybill.go:105` has no such field — only
    `carrier_name` / `carrier_tracking_number` as free-text strings.
  - The selected carrier name from `RateQuote.carrierName` should be mapped to
    `carrierName` in the request body, or a `carrier_id` FK column added to the
    `waybills` table with a new migration.

- [x] [2] **`go.mod` declares non-existent Go version `1.25`**
  - `go.mod:3` — Go 1.25 does not exist. Every IDE language server and standard
    CI runner rejects this. Downgrade to `go 1.23` (current stable) or whichever
    version is actually installed (`1.26.4` locally).

- [ ] [3] **`auditLogService.export` silently writes error JSON into the CSV**
  - `api.ts:164` uses `responseType: 'blob'`. If the server responds with a
    non-2xx status (e.g. 403 Forbidden), axios resolves the blob containing
    `{"error":"..."}` and the download produces a corrupt CSV file with no
    visible error to the user. Needs a response status check before creating
    the blob URL.

---

## P2 — High (stability / UX breakage)

- [ ] [1] **No global React Error Boundary**
  - Zero `ErrorBoundary` components anywhere in the app (`App.tsx`, `main.tsx`).
    A single unhandled render error crashes the entire shell. Wrap the router
    outlet in a boundary so failures are contained per-page.

- [ ] [2] **Hard-capped `LIMIT` with no pagination on high-volume list endpoints**
  - `audit_log_repo.go:34` — `LIMIT 200`, no page/cursor support.
  - `driver_repo.go:152` — `LIMIT 200`, no page/cursor support.
  - `waybill_repo.go` already has page/limit params; apply the same pattern to
    these two. Both tables are append-only event logs that will grow unbounded
    in production.

- [ ] [3] **i18n infrastructure exists but zero strings are actually translated**
  - `react-i18next` is initialised in `i18n/index.ts` and imported in `main.tsx`,
    but `useTranslation` / `t()` are not called anywhere in the app (0 matches
    across all TSX files). The localisation layer is completely inert.
  - Either wire up `useTranslation` across pages or remove the unused dependency
    to avoid confusion. (Roadmap item P5 F1.)

- [ ] [4] **`carrier_rates` compare has no wildcard/fallback zone matching**
  - If no rate card matches the exact `origin_zone` / `destination_zone`, the
    compare endpoint returns an empty array and the UI shows "No carrier rates
    found" — identical to a legitimate empty state. Add a wildcard zone value
    (e.g. `*`) so broad rate cards match any route.

---

## P3 — Medium (performance / type safety)

- [ ] [1] **No `staleTime` on `QueryClient` — every navigation triggers a refetch**
  - `main.tsx:14` — `new QueryClient()` has no `defaultOptions`. All queries
    have a `staleTime` of `0`, so every component re-mount (page navigation)
    fires a background refetch unnecessarily.
  - Suggested default: `staleTime: 30_000` (30 s). Polling pages already set
    their own `refetchInterval` so they are unaffected.

- [ ] [2] **Widespread `any` type usage (128 matches across 31 files)**
  - Worst offenders: `api.ts` (15), `SettingsPage.tsx` (14), `UsersPage.tsx` (11).
  - Most of these can be replaced with interfaces already defined in
    `types/waybill.ts`. Reduces silent runtime bugs and improves IDE
    autocomplete.

- [ ] [3] **No structured API error type — raw DB errors leak to clients**
  - Every handler returns `gin.H{"error": err.Error()}` which can expose
    internal PostgreSQL error messages (table names, constraint names) to
    end users. Introduce a small `apiError{Code, Message}` wrapper that maps
    known errors to safe messages and logs the raw error server-side only.

- [ ] [4] **`driver_scan_events` missing index on `scan_type`**
  - `migrations/013_driver_assignments.sql` — indexes exist on `driver_id` and
    `waybill_id` but not `scan_type`. The POD handler (`pod_handler.go:62`)
    queries `WHERE waybill_id = $1 AND scan_type = 'DELIVERED'`; without a
    composite index on `(waybill_id, scan_type)` this degrades to a full index
    scan on the waybill_id index then a filter pass.
  - Add migration: `CREATE INDEX idx_driver_scan_events_waybill_scan ON driver_scan_events(waybill_id, scan_type);`

---

## P4 — Low (quality / maintainability)

- [ ] [1] **No tests for new P5 handler code**
  - `pod_handler.go`, `carrier_rate_handler.go`, `audit_log_handler.Export` —
    all added in P5 — have no test files. Existing test pattern is established
    in `waybill_handler_test.go` and `auth_handler_test.go`.

- [ ] [2] **`WaybillNewPage` rate step shows "No carrier rates found" on API error**
  - `WaybillNewPage.tsx` — the `isError` branch in `RateCompare` is
    indistinguishable from a legitimate empty result. Show a distinct
    "Failed to load rates — retry" message with a refetch trigger.

- [ ] [3] **`mock-api.ts` has 26 `any` usages and may still be imported in tests**
  - `services/mock-api.ts` — verify this file is test-only and not accidentally
    bundled in production builds. If unused, consider deleting it.

- [ ] [4] **`AuditLogPage` filters only the in-memory 200-row cap, not the full DB**
  - The search box in `AuditLogPage.tsx` filters the already-truncated 200-row
    response client-side. When more than 200 logs exist, search results will be
    incomplete. Move filtering to the backend `List` query (add a `?search=`
    param) once pagination is added (see P2 above).

---

## Quick-win checklist (each ≤ 15 min)

| # | Change | File |
|---|--------|------|
| 1 | Fix `go.mod` `go 1.25` → `go 1.23` | `go.mod:3` |
| 2 | Add `staleTime: 30_000` to `new QueryClient()` | `main.tsx:14` |
| 3 | Add composite index `(waybill_id, scan_type)` on `driver_scan_events` | new migration `036_…` |
| 4 | Map `carrierId → carrierName` in waybill create payload | `WaybillNewPage.tsx:149` |
| 5 | Add blob status check in `auditLogService.export` | `api.ts:160-165` |
| 6 | Wrap router in a single `<ErrorBoundary>` | `App.tsx` |
