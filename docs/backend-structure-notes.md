# Backend Structure Notes

The backend is a Spring Boot API supporting the Altaira Workspace MVP: public lead capture, admin review, client creation, service assignment and internal notes.

## Reviewed Areas

- `controller`: auth, health, leads, clients, client-services, services and internal notes.
- `dto`: request and response objects, grouped by domain.
- `entity`: JPA entities for persisted tables.
- `repository`: Spring Data repositories.
- `service`: business workflow logic and seeders.
- `security`: admin access, internal API token and rate limiting.
- `config`: Spring security configuration.
- `exception`: centralized error responses and domain exceptions.
- `backend/database`: SQL schema, migrations and seed scripts.
- `backend/src/test`: current Spring Boot test coverage.

## Current Package Shape

```text
com.altaira.backend
  config
  controller
  dto
  entity
  exception
  model
  repository
  security
  service
```

This is simple enough for the current MVP and matches the requested structure.

## Cleanup Applied

Removed `backend/src/main/java/com/altaira/backend/model/Lead.java`.

Reason:

- It was an unused duplicate POJO.
- The real persisted lead model is `entity/LeadEntity`.
- Lead statuses remain correctly represented by `model/LeadStatus`.
- Removing it reduces confusion without changing API behavior or schema.

## Findings

- Controllers are separated by workflow area.
- DTOs are grouped by domain and keep request/response shapes out of entities.
- Entities map the real database tables.
- Repositories are straightforward Spring Data interfaces.
- Services own the main business logic.
- Security/auth code is isolated from controllers.
- No destructive database changes were needed for this review.

## Recommended Discipline

- Keep one persisted JPA entity per table.
- Keep DTOs separate from entities.
- Keep workflow rules in services.
- Keep admin protection in the existing security layer.
- Add packages only when a domain area becomes genuinely large.
- Avoid duplicate models with names close to entities.

## Current Validation Scope

The backend cleanup is intentionally small. It should be validated by:

- `cd backend && ./mvnw test`
- `cd backend && ./mvnw package -DskipTests`

No Neon schema change is part of this branding/backend-structure pass.
