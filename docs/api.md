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

Success response: `201 Created`

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

If the Spring Boot lead service is unavailable, the proxy returns:

```json
{
  "error": "Lead service unavailable",
  "message": "The lead service could not be reached. Please try again in a moment."
}
```

Validation errors are passed through from the backend:

```json
{
  "error": "Validation failed",
  "message": "Failed to submit form",
  "fields": {
    "fullName": "Full name is required",
    "email": "Email must be valid"
  }
}
```

Malformed JSON returns `400`:

```json
{
  "error": "Invalid request body",
  "message": "Lead submission must be valid JSON."
}
```

## Admin Frontend API

These routes require the `altaira_admin_session` HTTP-only cookie.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "username": "admin123",
  "password": "admin123"
}
```

Success:

```json
{
  "success": true,
  "user": {
    "username": "admin123",
    "role": "admin"
  }
}
```

Malformed JSON or a non-object request body returns `400`.

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
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Returns leads ordered by newest first.

Unauthenticated response:

```json
{ "error": "Unauthorized" }
```

### Get Lead Detail

```http
GET /api/internal/leads/{id}
Cookie: altaira_admin_session=<http-only-session-cookie>
```

### Update Lead Status

```http
PATCH /api/internal/leads/{id}/status
Cookie: altaira_admin_session=<http-only-session-cookie>
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

### Create Client From Lead

```http
POST /api/internal/clients/from-lead/{leadId}
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Creates a client from an existing lead. The operation is idempotent: if the lead already has a client, the existing client is returned.

### List/Create Clients

```http
GET /api/internal/clients
POST /api/internal/clients
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Client creation body:

```json
{
  "name": "Marta Ruiz",
  "company": "Ruiz Dental Studio",
  "email": "marta@example.com",
  "phone": "+32 ..."
}
```

### Client Detail

```http
GET /api/internal/clients/{id}
Cookie: altaira_admin_session=<http-only-session-cookie>
```

### Services Catalogue

```http
GET /api/internal/services
POST /api/internal/services
Cookie: altaira_admin_session=<http-only-session-cookie>
```

### Assign Service To Client

```http
GET /api/internal/clients/{clientId}/services
POST /api/internal/clients/{clientId}/services
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Assignment body:

```json
{
  "serviceId": "uuid",
  "notes": "Start with booking flow."
}
```

### Update Client Service Status

```http
PATCH /api/internal/client-services/{id}/status
Cookie: altaira_admin_session=<http-only-session-cookie>
Content-Type: application/json
```

Allowed statuses:

- `planned`
- `in_progress`
- `review`
- `delivered`
- `cancelled`

### Internal Notes

```http
GET /api/internal/leads/{id}/notes
POST /api/internal/leads/{id}/notes
GET /api/internal/clients/{id}/notes
POST /api/internal/clients/{id}/notes
Cookie: altaira_admin_session=<http-only-session-cookie>
```

Note body:

```json
{
  "content": "Follow up tomorrow."
}
```

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

Success response: `201 Created`.

This endpoint is rate limited by IP. Required fields are `fullName`, `businessName`, and `email`.
The backend trims name/business/email input, lowercases email, stores new leads with status `new`, and rejects invalid email or missing required values.

Validation rules:

- `fullName`: required, 2-100 characters.
- `businessName`: required, 2-120 characters.
- `email`: required, valid email format.
- `industry`: optional, max 50 characters.
- `goals`: optional, max 1000 characters.

### List Leads

Protected endpoint:

```http
GET /api/v1/leads
X-Internal-API-Token: <same-token-as-frontend>
```

Without a valid token, response is `401`.

Returns leads ordered by newest first.

### Get Lead by ID

Protected endpoint:

```http
GET /api/v1/leads/{id}
X-Internal-API-Token: <same-token-as-frontend>
```

### Update Lead Status

Protected endpoint:

```http
PATCH /api/v1/leads/{id}/status
X-Internal-API-Token: <same-token-as-frontend>
Content-Type: application/json
```

Body:

```json
{ "status": "closed" }
```

Allowed statuses are exactly:

- `new`
- `contacted`
- `closed`

Status input is trimmed and normalized to lowercase. Invalid or missing status returns `400`.
Malformed JSON through the frontend proxy also returns `400`.

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
