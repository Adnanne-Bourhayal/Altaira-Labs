# API Reference

Base URLs:

```text
Frontend local: http://localhost:3000
Backend local:  http://localhost:8080
```

## Public Frontend API

### Create Lead Through Proxy

```http
POST /api/leads
Content-Type: application/json
```

Body:

```json
{
  "fullName": "Test Lead",
  "businessName": "Altaira QA",
  "email": "qa@example.com",
  "industry": "Testing",
  "goals": "Verify lead capture"
}
```

Response:

```json
{
  "id": "uuid",
  "fullName": "Test Lead",
  "businessName": "Altaira QA",
  "email": "qa@example.com",
  "industry": "Testing",
  "goals": "Verify lead capture",
  "status": "new",
  "createdAt": "2026-07-02T12:31:20.338299Z"
}
```

## Admin Frontend API

These routes require the `altaira_admin_auth` cookie.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@altaira.local",
  "password": "altaira_admin_dev_password"
}
```

Success:

```json
{ "success": true }
```

### Logout

```http
POST /api/auth/logout
```

Success:

```json
{ "success": true }
```

### List Leads

```http
GET /api/internal/leads
Cookie: altaira_admin_auth=true
```

Unauthenticated response:

```json
{ "error": "Unauthorized" }
```

### Get Lead Detail

```http
GET /api/internal/leads/{id}
Cookie: altaira_admin_auth=true
```

### Update Lead Status

```http
PATCH /api/internal/leads/{id}/status
Cookie: altaira_admin_auth=true
Content-Type: application/json
```

Body:

```json
{ "status": "contacted" }
```

Allowed statuses:

- `new`
- `contacted`
- `closed`

## Backend API

### Health

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok",
  "service": "altaira-os-backend",
  "timestamp": "2026-07-02T12:30:20.440256Z"
}
```

### Actuator Health

```http
GET /actuator/health
```

### Create Lead

Public endpoint:

```http
POST /api/v1/leads
Content-Type: application/json
```

This endpoint is rate limited by IP.

### List Leads

Protected endpoint:

```http
GET /api/v1/leads
X-Internal-API-Token: dev-internal-token
```

Without a valid token, response is `401`.

### Get Lead by ID

Protected endpoint:

```http
GET /api/v1/leads/{id}
X-Internal-API-Token: dev-internal-token
```

### Update Lead Status

Protected endpoint:

```http
PATCH /api/v1/leads/{id}/status
X-Internal-API-Token: dev-internal-token
Content-Type: application/json
```

Body:

```json
{ "status": "closed" }
```

Invalid status returns `400`.

## Error Shapes

Validation error:

```json
{
  "timestamp": "2026-07-02T12:00:00Z",
  "status": 400,
  "error": "Validation failed",
  "fields": {
    "email": "Email must be valid"
  }
}
```

Unauthorized:

```json
{
  "timestamp": "2026-07-02T12:00:00Z",
  "status": 401,
  "error": "Invalid internal API token"
}
```
