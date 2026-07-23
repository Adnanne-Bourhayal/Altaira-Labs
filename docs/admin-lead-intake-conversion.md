# Admin Lead Intake and Conversion

## Purpose

The admin lead area separates commercial qualification from client creation:

1. A public request or admin intake creates a lead.
2. The admin reviews or completes one structured assessment.
3. The system calculates a deterministic service recommendation.
4. The admin chooses the services and explicitly confirms conversion.
5. The backend creates or reuses the client, service assignments, private workspace,
   onboarding tasks and one project track per selected service.

Repeated conversion is idempotent. It reuses existing records rather than creating
another client, assignment, workspace or project track.

## Intake Forms

- `general`: broad diagnostic, with a maximum of two recommended launch services.
- `web_seo`: professional website and SEO requirements.
- `booking`: booking rules, capacity and appointment context.
- `crm`: lead sources, pipeline and existing contact records.
- `automation`: repetitive work, triggers, channels and desired outcomes.
- `dashboard`: KPIs, data sources, users and reporting needs.

Assessments store structured responses and recommendation metadata. They do not
store credentials, passwords or API secrets.

## Lead Statuses

- `new`
- `contacted`
- `qualified`
- `converted`
- `lost`
- `closed` (legacy archive status)

## Safety Boundary

Conversion does not send an invitation, create Jira work, configure external tools
or deploy a client system. Those actions remain separate and require a later,
explicit workflow.

## Database

Apply `backend/database/lead-intake-conversion-migration.sql` before using assessment
or conversion endpoints against a database where Hibernate schema creation is
disabled. The migration is additive and must still be reviewed before applying it
to Neon.

No new environment variables are required.

## Manual Demo

1. Open `/leads/new` and choose an intake type.
2. Enter the real lead contact and questionnaire answers.
3. Open the created lead.
4. Review the recommendation and mark the assessment reviewed.
5. Select the approved services and confirm conversion.
6. Open the resulting client and verify its private workspace and service tracks.
