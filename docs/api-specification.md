# RESTful API Specification & Design Standard

This document defines the architectural conventions, response envelopes, error structures, and endpoint signatures for the REST API under `/api/v1`.

---

## 1. Global Conventions

- **Base URL**: `/api/v1`
- **Content Type**: `application/json`
- **Authentication**: Bearer Token in `Authorization: Bearer <JWT_ACCESS_TOKEN>` header.
- **Tenant Context**: Automatically resolved from authenticated user's active membership or override header `X-Organization-Id` (verified against user's memberships).
- **Date Format**: ISO-8601 UTC strings (e.g. `2026-10-21T11:30:00.000Z`).

---

## 2. Standard Response Envelopes

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-21T11:30:00.000Z",
    "requestId": "req-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

### Paginated Collection Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 25,
      "totalItems": 142,
      "totalPages": 6,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "timestamp": "2026-10-21T11:30:00.000Z"
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed for one or more fields",
  "errors": [
    {
      "field": "email",
      "constraints": ["email must be an email address"]
    }
  ],
  "meta": {
    "timestamp": "2026-10-21T11:30:00.000Z",
    "path": "/api/v1/leads"
  }
}
```

---

## 3. Core Resource Endpoints

| Method | Endpoint | Description | Role / Permission |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user & create initial organization | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user, receive JWT & refresh token | Public |
| `POST` | `/api/v1/auth/refresh` | Rotate access token with refresh token | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile & memberships | Authenticated |
| `GET` | `/api/v1/organizations` | List user's organizations | Authenticated |
| `GET` | `/api/v1/leads` | List leads (paginated, filtered, sorted) | `leads:read` |
| `POST` | `/api/v1/leads` | Create a new lead | `leads:write` |
| `GET` | `/api/v1/leads/:id` | Retrieve lead details and timeline | `leads:read` |
| `PATCH` | `/api/v1/leads/:id` | Update lead fields or status | `leads:write` |
| `POST` | `/api/v1/leads/:id/convert` | Convert lead to Contact, Company, and Deal | `leads:write` |
| `DELETE` | `/api/v1/leads/:id` | Archive or delete lead record | `leads:delete` |
| `POST` | `/api/v1/leads/import/csv` | Batch import leads via CSV file | `leads:import` |
| `GET` | `/api/v1/leads/export` | Export filtered leads to CSV stream | `leads:export` |
| `GET` | `/api/v1/deals` | List deals with pipeline and stage associations | `deals:read` |
| `PATCH` | `/api/v1/deals/:id/stage` | Update deal stage (Kanban drag-and-drop) | `deals:write` |
| `GET` | `/api/v1/reports/dashboard` | Aggregated analytics figures for dashboard | `reports:read` |
| `GET` | `/api/v1/activities` | List tasks, calls, meetings, notes | `activities:read` |
| `POST` | `/api/v1/activities` | Create activity linked to any CRM entity | `activities:write` |
