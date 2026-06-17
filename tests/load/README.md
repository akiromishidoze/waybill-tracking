# Load Tests

k6 scripts for performance and smoke testing.

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) installed
- Waybill Tracking stack running (`docker compose up -d`)

## Smoke Test (quick verification)

```bash
k6 run tests/load/smoke.js
```

Sets CORE_API / ANALYTICS_API / DASHBOARD_URL via env if non-default:

```bash
CORE_API=http://localhost:8080 ANALYTICS_API=http://localhost:8000 k6 run tests/load/smoke.js
```

## Load Test — Core API

```bash
k6 run tests/load/core-api.js
```

Ramps: 10 → 50 → 100 concurrent users over 3 minutes.
Tests: `/waybills` list, search, create, `/auth/me`, `/features`.

Thresholds:
- Error rate < 5%
- P95 latency < 2s (general), < 3s (login)

## Load Test — Analytics API

```bash
k6 run tests/load/analytics-api.js
```

Ramps: 5 → 20 VUs over 70s.
Tests: `/analytics/stats`, `/sla`, `/anomalies`, `/predict-eta`.

## Override Credentials

```bash
EMAIL=ops@waybill.com PASSWORD=ops123 k6 run tests/load/core-api.js
```

## Interpreting Results

Exit code 0 = all thresholds met. Non-zero = threshold breach.
Watch `http_req_duration` and custom metrics (`errors`, `login_duration`, etc.).
