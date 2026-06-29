package openapi

// SpecJSON contains the OpenAPI 3.0 spec for the core API.
const SpecJSON = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Waybill Core API",
    "description": "Core API for waybill tracking, authentication, waybill management, analytics, and integrations. This spec is served manually and covers the main public endpoints. Protected endpoints require a Bearer token from /auth/login.",
    "version": "1.0.0",
    "contact": {
      "name": "WaybillTrack Support",
      "email": "support@waybilltrack.com"
    }
  },
  "servers": [
    {
      "url": "http://localhost:8080/api/v1",
      "description": "Local development"
    }
  ],
  "tags": [
    { "name": "Authentication", "description": "Register, login, and token management" },
    { "name": "Waybills", "description": "Create, update, and track waybills" },
    { "name": "Analytics", "description": "Dashboard statistics and predictions" },
    { "name": "System", "description": "Health and feature flags" }
  ],
  "paths": {
    "/auth/register": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Register a new user",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password", "name", "role"],
                "properties": {
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string", "minLength": 8, "description": "Minimum 8 characters with uppercase, lowercase, and digit" },
                  "name": { "type": "string" },
                  "role": { "type": "string", "enum": ["SHIPPER", "OPS", "ADMIN", "COURIER"] },
                  "company": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "User registered successfully" },
          "400": { "description": "Invalid request or weak password" },
          "429": { "description": "Rate limit exceeded" }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Authenticate and obtain a JWT",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Login successful, returns access token" },
          "401": { "description": "Invalid credentials" },
          "429": { "description": "Account locked or rate limit exceeded" }
        }
      }
    },
    "/auth/forgot-password": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Request a password reset email",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email"],
                "properties": {
                  "email": { "type": "string", "format": "email" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Reset email queued if account exists" }
        }
      }
    },
    "/auth/reset-password-with-token": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Reset password using a token from the reset email",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["token", "newPassword"],
                "properties": {
                  "token": { "type": "string" },
                  "newPassword": { "type": "string", "minLength": 8 }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Password updated" },
          "400": { "description": "Invalid or expired token" }
        }
      }
    },
    "/waybills": {
      "get": {
        "tags": ["Waybills"],
        "summary": "List waybills",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } },
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "status", "in": "query", "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "Paginated list of waybills" },
          "401": { "description": "Unauthorized" },
          "429": { "description": "Rate limit exceeded" }
        }
      },
      "post": {
        "tags": ["Waybills"],
        "summary": "Create a waybill",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["recipientName", "recipientAddress", "recipientPhone", "origin", "destination", "weight"],
                "properties": {
                  "trackingNumber": { "type": "string" },
                  "recipientName": { "type": "string" },
                  "recipientAddress": { "type": "string" },
                  "recipientPhone": { "type": "string" },
                  "origin": { "type": "string" },
                  "destination": { "type": "string" },
                  "serviceType": { "type": "string", "enum": ["STANDARD", "EXPRESS", "SAME_DAY"] },
                  "weight": { "type": "number" },
                  "dimensions": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Waybill created" },
          "400": { "description": "Invalid input" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/waybills/{id}/scans": {
      "post": {
        "tags": ["Waybills"],
        "summary": "Create a scan event for a waybill",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["status"],
                "properties": {
                  "status": { "type": "string", "enum": ["PICKED_UP", "IN_TRANSIT", "AT_SORTING_CENTER", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "CANCELLED", "RETURNED"] },
                  "location": { "type": "string" },
                  "remark": { "type": "string" },
                  "exceptionCode": { "type": "string" },
                  "exceptionDetail": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Scan event created" },
          "400": { "description": "Invalid status transition" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/track/{trackingNumber}": {
      "get": {
        "tags": ["Waybills"],
        "summary": "Public tracking endpoint for a waybill",
        "parameters": [
          { "name": "trackingNumber", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "Tracking information" },
          "404": { "description": "Waybill not found" },
          "429": { "description": "Rate limit exceeded" }
        }
      }
    },
    "/analytics/predict-eta/{waybillId}": {
      "get": {
        "tags": ["Analytics"],
        "summary": "Predict delivery ETA using a trained ML model",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "waybillId", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "ETA prediction" },
          "401": { "description": "Unauthorized" },
          "404": { "description": "Waybill not found" },
          "429": { "description": "Rate limit exceeded" }
        }
      }
    },
    "/analytics/stats": {
      "get": {
        "tags": ["Analytics"],
        "summary": "Dashboard statistics",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Dashboard statistics" },
          "401": { "description": "Unauthorized" },
          "429": { "description": "Rate limit exceeded" }
        }
      }
    },
    "/features": {
      "get": {
        "tags": ["System"],
        "summary": "List feature flags",
        "responses": {
          "200": { "description": "Feature flag map" }
        }
      }
    },
    "/health": {
      "get": {
        "tags": ["System"],
        "summary": "Health check",
        "responses": {
          "200": { "description": "Service is healthy" }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}`

// SpecYAML contains the same OpenAPI spec in YAML format.
const SpecYAML = `openapi: 3.0.3
info:
  title: Waybill Core API
  description: Core API for waybill tracking, authentication, waybill management, analytics, and integrations. This spec is served manually and covers the main public endpoints. Protected endpoints require a Bearer token from /auth/login.
  version: 1.0.0
  contact:
    name: WaybillTrack Support
    email: support@waybilltrack.com
servers:
  - url: http://localhost:8080/api/v1
    description: Local development
tags:
  - name: Authentication
    description: Register, login, and token management
  - name: Waybills
    description: Create, update, and track waybills
  - name: Analytics
    description: Dashboard statistics and predictions
  - name: System
    description: Health and feature flags
paths:
  /auth/register:
    post:
      tags: [Authentication]
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name, role]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8, description: "Minimum 8 characters with uppercase, lowercase, and digit" }
                name: { type: string }
                role: { type: string, enum: [SHIPPER, OPS, ADMIN, COURIER] }
                company: { type: string }
      responses:
        201: { description: User registered successfully }
        400: { description: Invalid request or weak password }
        429: { description: Rate limit exceeded }
  /auth/login:
    post:
      tags: [Authentication]
      summary: Authenticate and obtain a JWT
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        200: { description: Login successful, returns access token }
        401: { description: Invalid credentials }
        429: { description: Account locked or rate limit exceeded }
  /auth/forgot-password:
    post:
      tags: [Authentication]
      summary: Request a password reset email
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email: { type: string, format: email }
      responses:
        200: { description: Reset email queued if account exists }
  /auth/reset-password-with-token:
    post:
      tags: [Authentication]
      summary: Reset password using a token from the reset email
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token, newPassword]
              properties:
                token: { type: string }
                newPassword: { type: string, minLength: 8 }
      responses:
        200: { description: Password updated }
        400: { description: Invalid or expired token }
  /waybills:
    get:
      tags: [Waybills]
      summary: List waybills
      security: [{ bearerAuth: [] }]
      parameters:
        - { name: limit, in: query, schema: { type: integer, default: 20 } }
        - { name: page, in: query, schema: { type: integer, default: 1 } }
        - { name: status, in: query, schema: { type: string } }
      responses:
        200: { description: Paginated list of waybills }
        401: { description: Unauthorized }
        429: { description: Rate limit exceeded }
    post:
      tags: [Waybills]
      summary: Create a waybill
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [recipientName, recipientAddress, recipientPhone, origin, destination, weight]
              properties:
                trackingNumber: { type: string }
                recipientName: { type: string }
                recipientAddress: { type: string }
                recipientPhone: { type: string }
                origin: { type: string }
                destination: { type: string }
                serviceType: { type: string, enum: [STANDARD, EXPRESS, SAME_DAY] }
                weight: { type: number }
                dimensions: { type: string }
      responses:
        201: { description: Waybill created }
        400: { description: Invalid input }
        401: { description: Unauthorized }
  /waybills/{id}/scans:
    post:
      tags: [Waybills]
      summary: Create a scan event for a waybill
      security: [{ bearerAuth: [] }]
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status: { type: string, enum: [PICKED_UP, IN_TRANSIT, AT_SORTING_CENTER, OUT_FOR_DELIVERY, DELIVERED, FAILED_DELIVERY, CANCELLED, RETURNED] }
                location: { type: string }
                remark: { type: string }
                exceptionCode: { type: string }
                exceptionDetail: { type: string }
      responses:
        201: { description: Scan event created }
        400: { description: Invalid status transition }
        401: { description: Unauthorized }
  /track/{trackingNumber}:
    get:
      tags: [Waybills]
      summary: Public tracking endpoint for a waybill
      parameters:
        - { name: trackingNumber, in: path, required: true, schema: { type: string } }
      responses:
        200: { description: Tracking information }
        404: { description: Waybill not found }
        429: { description: Rate limit exceeded }
  /analytics/predict-eta/{waybillId}:
    get:
      tags: [Analytics]
      summary: Predict delivery ETA using a trained ML model
      security: [{ bearerAuth: [] }]
      parameters:
        - { name: waybillId, in: path, required: true, schema: { type: string } }
      responses:
        200: { description: ETA prediction }
        401: { description: Unauthorized }
        404: { description: Waybill not found }
        429: { description: Rate limit exceeded }
  /analytics/stats:
    get:
      tags: [Analytics]
      summary: Dashboard statistics
      security: [{ bearerAuth: [] }]
      responses:
        200: { description: Dashboard statistics }
        401: { description: Unauthorized }
        429: { description: Rate limit exceeded }
  /features:
    get:
      tags: [System]
      summary: List feature flags
      responses:
        200: { description: Feature flag map }
  /health:
    get:
      tags: [System]
      summary: Health check
      responses:
        200: { description: Service is healthy }
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`
