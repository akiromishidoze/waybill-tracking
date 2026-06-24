# Waybill Tracking API Documentation

This directory contains API documentation and collection files for the Waybill Tracking platform.

## Available Documentation

- **Postman Collection**: `backend/core-api/Waybill Tracking API.postman_collection.json`
- **Analytics OpenAPI**: `backend/analytics-api` serves interactive docs at `/docs` when running (FastAPI).
- **Core API**: Swagger/OpenAPI specs are planned once the core-api adopts OpenAPI generation (currently manual).

## Postman Collection

The collection covers both the **core-api** (`:8080`) and the **analytics-api** (`:8000`) and includes:

- Authentication (login, register, refresh, me)
- Waybill CRUD and status updates
- Public tracking endpoint
- Attachments (list, upload, get, delete)
- Admin endpoints (users, roles, reset password, audit logs)
- Analytics (stats, SLA, anomalies, predictive ETA)
- Reports (Excel and CSV export)
- Health check

### How to use

1. Import `backend/core-api/Waybill Tracking API.postman_collection.json` into Postman.
2. Open the collection variables and update:
   - `baseUrl` — core-api base URL (e.g. `http://localhost:8080`)
   - `analyticsUrl` — analytics-api base URL (e.g. `http://localhost:8000`)
3. Run the **Login** request.
4. Copy the access token from the response and paste it into the `token` variable.
5. Run protected requests; `waybillId`, `trackingNumber`, `attachmentId`, and `userId` can be filled dynamically.

### Collection Variables

| Variable | Description | Example |
| --- | --- | --- |
| `baseUrl` | core-api base URL | `http://localhost:8080` |
| `analyticsUrl` | analytics-api base URL | `http://localhost:8000` |
| `token` | JWT access token from login | `eyJhbG...` |
| `refreshToken` | Refresh token from login | `eyJhbG...` |
| `waybillId` | UUID of a waybill | `550e8400-e29b-41d4-a716-446655440000` |
| `trackingNumber` | Human-readable tracking number | `WB123456789` |
| `attachmentId` | UUID of an attachment | `550e8400-e29b-41d4-a716-446655440001` |
| `userId` | UUID of a user | `550e8400-e29b-41d4-a716-446655440002` |

## Generating a New Collection Export

To regenerate the collection from the latest code, update the JSON file manually or use a tool such as `postmanerator` once the core-api exposes an OpenAPI schema.

## Analytics OpenAPI

The analytics-api is built with FastAPI and provides auto-generated OpenAPI docs at:

```bash
curl http://localhost:8000/docs
```

You can export the OpenAPI JSON from `/openapi.json` and import it into Postman or Swagger UI.
