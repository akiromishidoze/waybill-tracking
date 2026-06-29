# Load Tests

This directory contains k6 load tests for the Waybill Tracking API.

## Prerequisites

Install [k6](https://k6.io/docs/get-started/installation/):

```bash
# macOS
brew install k6

# Docker
docker pull grafana/k6
```

## Running Tests

```bash
# Run with defaults (requires core-api on http://localhost:8080)
k6 run load-tests/k6/critical-path.js

# Override configuration
k6 run -e BASE_URL=http://localhost:8080 -e TRACKING_NUMBER=WBT-1407a843 -e ADMIN_EMAIL=admin@waybilltrack.com -e ADMIN_PASSWORD=teccadmin00 load-tests/k6/critical-path.js
```

## Test Coverage

- `GET /track/:trackingNumber` — public tracking endpoint
- `GET /api/v1/waybills` — authenticated waybill list endpoint

The default scenario ramps up to 50 concurrent virtual users over 2 minutes and asserts that 95% of requests complete in under 500ms and the error rate stays below 5%.
