# Environment Variables

This document explains where each environment value goes, where it comes from, and what must stay secret.

Do not commit real `.env`, `.env.local`, `.secrets`, passwords, API tokens, or full database connection strings.

## Local Files

| File | Purpose | Git status |
|---|---|---|
| `.env.local.example` | Safe template for local Next.js/frontend env. | Tracked |
| `.env.local` | Real local frontend/admin/API-proxy env. | Ignored |
| `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env.example` | Safe template for Neon/Render backend secrets. | Outside repo |
| `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env` | Real local Neon/Render/backend secrets. | Outside repo |

## Frontend / Next.js Variables

These belong in `.env.local` for local development and in Vercel environment variables for deployment.

| Variable | Where it goes | Source | Secret? | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `.env.local`, Vercel | Local frontend URL or deployed frontend URL | No | Browser-visible. Local value is usually `http://localhost:3000`. |
| `NEXT_PUBLIC_API_URL` | `.env.local`, Vercel | Local backend URL or Render backend URL | No | Browser-visible. Local value is usually `http://localhost:8080`; deployed value should be the Render backend URL. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `.env.local`, Vercel | Google Cloud OAuth web client ID | No | Browser-visible by design. Enables the Client Area Google button. Must match backend `GOOGLE_CLIENT_ID`. |
| `INTERNAL_API_TOKEN` | `.env.local`, Vercel | Same shared token as backend | Yes | Must match backend `INTERNAL_API_TOKEN`. Never prefix with `NEXT_PUBLIC_`. |

Admin credentials are validated by Spring Boot against `app_users`, not by Vercel/Next environment variables.

## Backend / Spring Boot Variables

These belong in `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env` for local backend runs and in Render environment variables for deployment.

| Variable | Where it goes | Source | Secret? | Notes |
|---|---|---|---|---|
| `RENDER_BACKEND_URL` | Local secrets helper file | Render service dashboard | No | Used by local validation scripts/docs. |
| `SPRING_DATASOURCE_URL` | Local secrets helper file, Render | Neon Console JDBC URL | Sensitive if complete | Use JDBC format. Do not include the password in this value. |
| `SPRING_DATASOURCE_USERNAME` | Local secrets helper file, Render | Neon Console role/user | Low sensitivity | Current validated user is stored in the local secrets file. |
| `SPRING_DATASOURCE_PASSWORD` | Local secrets helper file, Render | Neon Console role password | Yes | Rotate in Neon if exposed. Update Render and local secrets after rotation. |
| `PORT` | Render | Render web service runtime | No | Render normally injects `10000`. The backend uses `server.port=${PORT:8080}`. Local runs can leave it unset. |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Local backend env, Render | Deployment policy | No | Use `none` on Render once Neon schema exists. Use `update` only for controlled local/dev schema expansion. |
| `SPRING_JPA_SHOW_SQL` | Local backend env, Render | Deployment policy | No | Use `false` on Render to reduce startup/log noise. |
| `SPRING_JPA_FORMAT_SQL` | Local backend env, Render | Deployment policy | No | Use `false` on Render to reduce SQL formatting overhead/log noise. |
| `INTERNAL_API_TOKEN` | Local secrets helper file, Render | Same shared token as frontend server | Yes | Must match Vercel and `.env.local`. |
| `ALTAIRA_AUTH_SESSION_HOURS` | Local backend env, Render | Chosen session duration | No | Default/recommended demo value: `8`. |
| `ALTAIRA_DEMO_ADMIN_ENABLED` | Local backend env, Render | Demo/TFG auth setup | No | Defaults to `false`. Use `true` only for a controlled demo with private credentials. |
| `ALTAIRA_DEMO_ADMIN_USERNAME` | Local backend env, Render | Demo/TFG auth setup | Yes when enabled | Runtime default is blank. Use a private username in any deployed environment. |
| `ALTAIRA_DEMO_ADMIN_PASSWORD` | Local backend env, Render | Demo/TFG auth setup | Yes when enabled | Runtime default is blank. Use a private strong password. An enabled seeder reconciles password changes on restart. |
| `ALTAIRA_DEMO_ADMIN_ROLE` | Local backend env, Render | Demo/TFG auth setup | No | Current demo value: `admin`. |
| `GOOGLE_CLIENT_ID` | Local backend env, Render | Google Cloud OAuth web client ID | No | Required for Client Area Google login. Must match frontend `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. |
| `GOOGLE_TOKEN_INFO_URL` | Local backend env, Render | Google Identity tokeninfo endpoint | No | Optional. Leave unset/default for production. Used only for tests/custom verification endpoints. |
| `ALTAIRA_CLIENT_INVITATION_ACTIVATE_URL` | Local backend env, Render | Frontend activation route | No | Required on Render for usable invitation emails. Production value: `https://<frontend-domain>/client/activate`. Without it, links default to localhost. |
| `ALTAIRA_CLIENT_INVITATION_EXPIRES_DAYS` | Local backend env, Render | Chosen invitation policy | No | Optional; default and recommended value is `7`. |
| `ONBOARDING_EMAIL_ENABLED` | Local backend env, Render | Chosen notification policy | No | Optional explicit override. Falls back to `CONTACT_EMAIL_ENABLED`. |
| `ONBOARDING_NOTIFICATION_FROM` | Local backend env, Render | Verified Resend sender | Low sensitivity | Optional explicit override. Falls back to `CONTACT_NOTIFICATION_FROM`. |
| `ONBOARDING_NOTIFICATION_ADMIN_TO` | Local backend env, Render | Altaira operations inbox | No | Optional explicit override. Falls back to `CONTACT_NOTIFICATION_TO`. |
| `ONBOARDING_CONTRACT_PDF_PATH` | Local backend env, Render | Private PDF template path | Sensitive path | Optional. Leave unset to use the generated fallback PDF. A local Render path is not durable across redeploys. |
| `ALTAIRA_ONBOARDING_STORAGE_DIR` | Local backend env, Render | Private local storage directory | Sensitive path | Optional local/TFG fallback. Render filesystem persistence is not guaranteed; do not treat this as production document storage. |
| `ALTAIRA_ONBOARDING_MAX_FILE_SIZE_BYTES` | Local backend env, Render | Upload policy | No | Optional; default `15728640` (15 MiB). |
| `ONBOARDING_MULTIPART_MAX_FILE_SIZE` | Local backend env, Render | Upload policy | No | Optional; default `20MB`. |
| `ONBOARDING_MULTIPART_MAX_REQUEST_SIZE` | Local backend env, Render | Upload policy | No | Optional; default `50MB`. |
| `CLIENT_CRM_WEBHOOK_PUBLIC_URL` | Local backend env, Render | Render public backend URL plus `/api/v1/client-crm/webhooks/leads` | No | Optional. Used only so the admin UI/API response can show the full CRM webhook endpoint. Raw per-client webhook API keys are generated by the backend and stored only as hashes. |
| `CLIENT_CRM_ALERTS_ENABLED` | Local backend env, Render | Chosen client CRM alert policy | No | Use `true` to send email alerts to the client owner when a webhook lead arrives with `priority=urgent`. |
| `CLIENT_CRM_ALERTS_FROM` | Local backend env, Render | Verified sender | Low sensitivity | Sender for client CRM urgent lead alerts. Can reuse `onboarding@resend.dev` until an Altaira domain is verified. |
| `CLIENT_CRM_DASHBOARD_URL` | Local backend env, Render | Frontend client dashboard URL | No | Optional. Adds a CTA in urgent lead alerts. Supports `{leadId}` and `{clientId}`. |
| `CLIENT_CRM_ALERTS_TIMEOUT_MS` | Local backend env, Render | Chosen backend timeout policy | No | Recommended: `6000` to avoid blocking public webhook intake for too long. |
| `CONTACT_EMAIL_ENABLED` | Local backend env, Render | Chosen email notification setting | No | Use `true` to send contact notifications. |
| `CONTACT_EMAIL_PROVIDER` | Local backend env, Render | Chosen email provider | No | Use `resend` on Render Free. Default fallback is `smtp`. |
| `CONTACT_NOTIFICATION_TO` | Local backend env, Render | Business inbox | No | Current target: `altairalabs@gmail.com`. |
| `CONTACT_NOTIFICATION_FROM` | Local backend env, Render | Verified sender | Low sensitivity | Current Resend starter value: `onboarding@resend.dev`. Later replace it with a verified Altaira Labs domain sender. |
| `CONTACT_EMAIL_TIMEOUT_MS` | Local backend env, Render | Chosen backend timeout policy | No | Recommended for Resend: `30000`; SMTP fallback can stay lower if needed. |
| `RESEND_API_KEY` | Local backend env, Render | Resend dashboard | Yes | Required when `CONTACT_EMAIL_PROVIDER=resend`. Prefer a sending-only API key. |
| `RESEND_API_URL` | Local backend env, Render | Resend API endpoint | No | Optional. Default is `https://api.resend.com/emails`. |
| `CONTACT_ADMIN_DASHBOARD_URL` | Local backend env, Render | Frontend/admin URL | No | Optional. Used only to add an admin dashboard link in contact notification emails. Supports `{leadId}`. |
| `CONTACT_BRAND_LOGO_URL` | Local backend env, Render | Public frontend asset URL | No | Optional. Public HTTPS logo URL for the contact notification email. Relative/local paths are ignored by the backend. |
| `CONTACT_BRAND_HEADER_IMAGE_URL` | Local backend env, Render | Public frontend asset URL | No | Optional. Public HTTPS hero/header image URL for the contact notification email. Relative/local paths are ignored by the backend. |
| `SPRING_MAIL_HOST` | Local backend env, Render | SMTP provider | No | Example shape: `smtp.gmail.com`, SendGrid, Brevo, Mailgun, etc. |
| `SPRING_MAIL_PORT` | Local backend env, Render | SMTP provider | No | Usually `587` for STARTTLS. |
| `SPRING_MAIL_USERNAME` | Local backend env, Render | SMTP provider | Yes | SMTP username or email address. |
| `SPRING_MAIL_PASSWORD` | Local backend env, Render | SMTP provider | Yes | SMTP password, API key, or Gmail app password. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH` | Local backend env, Render | SMTP provider | No | Usually `true`. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE` | Local backend env, Render | SMTP provider | No | Usually `true` for port `587`. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_REQUIRED` | Local backend env, Render | SMTP provider | No | Recommended: `true` for Gmail on port `587`. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_CONNECTIONTIMEOUT` | Local backend env, Render | Chosen timeout policy | No | Recommended: `5000` so a broken SMTP connection does not block the contact form. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_TIMEOUT` | Local backend env, Render | Chosen timeout policy | No | Recommended: `5000` so SMTP reads cannot hang the request. |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_WRITETIMEOUT` | Local backend env, Render | Chosen timeout policy | No | Recommended: `5000` so SMTP writes cannot hang the request. |

## Optional AWS S3 Preparation

These variables belong only in the local backend secrets file or Render. They are not needed for the current TFG demo and must not be added to Vercel.

| Variable | Required now? | Secret? | Effect if absent |
|---|---:|---:|---|
| `AWS_S3_ENABLED` | No | No | Defaults to `false`; the presigned-upload endpoint returns `501`. |
| `AWS_ACCESS_KEY_ID` | Only when S3 is enabled | Yes | AWS SDK cannot sign uploads. |
| `AWS_SECRET_ACCESS_KEY` | Only when S3 is enabled | Yes | AWS SDK cannot sign uploads. |
| `AWS_REGION` | Only when S3 is enabled | No | Presigned URLs cannot be generated. |
| `AWS_S3_PRIVATE_BUCKET` | Only when S3 is enabled | Sensitive | Private legal/document uploads cannot be targeted. |
| `AWS_S3_PUBLIC_BUCKET` | No | Sensitive | Branding/multimedia falls back to the private bucket. |
| `AWS_S3_PUBLIC_BASE_URL` | No | No | No public/CDN URL is returned for branding/multimedia. |
| `AWS_S3_PRESIGN_TTL_SECONDS` | No | No | Defaults to `900`, constrained to 60-3600 seconds. |

The current portal UI still stores multipart onboarding/project files through the private local storage service. S3 variables only enable the prepared presigned-URL endpoint; they do not yet make those existing uploads durable. Keep `AWS_S3_ENABLED=false` until the upload-completion and metadata flow is implemented and tested.

## Email Provider Recommendation

Render Free blocks outbound SMTP ports such as `25`, `465` and `587`, so Gmail SMTP can time out even when the Gmail App Password is correct.

For the deployed backend, use Resend over HTTPS:

```text
CONTACT_EMAIL_ENABLED=true
CONTACT_EMAIL_PROVIDER=resend
CONTACT_NOTIFICATION_TO=altairalabs@gmail.com
CONTACT_NOTIFICATION_FROM=onboarding@resend.dev
CONTACT_EMAIL_TIMEOUT_MS=30000
RESEND_API_KEY=<Resend sending API key>
CONTACT_ADMIN_DASHBOARD_URL=https://<frontend-domain>/leads/{leadId}
CONTACT_BRAND_LOGO_URL=https://<frontend-domain>/brand/logo-white.png
CONTACT_BRAND_HEADER_IMAGE_URL=https://<frontend-domain>/brand/header_background.png
CLIENT_CRM_ALERTS_ENABLED=true
CLIENT_CRM_ALERTS_FROM=onboarding@resend.dev
CLIENT_CRM_DASHBOARD_URL=https://<frontend-domain>/client/dashboard
CLIENT_CRM_ALERTS_TIMEOUT_MS=6000
```

SMTP variables can remain documented as a fallback for local development or paid hosting, but they are not the recommended Render Free production path.

Client CRM urgent lead alerts reuse `RESEND_API_KEY` and `RESEND_API_URL`. They are separate from the public Altaira contact inbox: the recipient is the client owner email stored in `clients.email`, and the alert only fires for client CRM webhook leads whose priority is `urgent`.

## Correct Database URL Shapes

For Spring Boot:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-user>
SPRING_DATASOURCE_PASSWORD=<neon-password>
```

For visual database tools such as DBeaver, pgAdmin, or TablePlus:

```text
Host: <neon-host>
Port: 5432
Database: <database>
User: <neon-user>
Password: <neon-password>
SSL: require
```

Do not use phpMyAdmin. This project uses PostgreSQL, not MySQL.

## Where Passwords Come From

| Password/token | Provider/source | Put it here |
|---|---|---|
| Neon database password | Neon Console -> role/user password or connection details | Render `SPRING_DATASOURCE_PASSWORD`; local `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env`; visual DB client password field |
| Demo/admin password | Backend auth seed or Render `ALTAIRA_DEMO_ADMIN_PASSWORD` | Stored in DB only as BCrypt `app_users.password_hash`; use private credentials outside local demonstration |
| Internal API token | You choose/generate one shared token | Render `INTERNAL_API_TOKEN`; Vercel `INTERNAL_API_TOKEN`; local `.env.local`; local `.secrets/neon-render.env` |
| Google OAuth web client ID | Google Cloud Console -> APIs & Services -> Credentials | Vercel `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; Render/local backend `GOOGLE_CLIENT_ID` |
| Resend API key | Resend dashboard -> API Keys | Render `RESEND_API_KEY`; local backend secrets file if testing email locally |
| Client CRM webhook API key | Generated once from `/clients/{clientId}` in the admin UI | Copy into the specific client website/widget integration; backend stores only SHA-256 hash |
| SMTP password/API key | Email provider dashboard or Gmail app password flow | Render `SPRING_MAIL_PASSWORD`; local backend secrets file only if using SMTP fallback |

## Rotation Checklist

If any password/token is exposed:

1. Rotate the value in the provider dashboard first.
2. Update Render environment variables.
3. Update Vercel environment variables if relevant.
4. Update `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env`.
5. Update local `.env.local` if the internal API token changed.
6. Restart local backend/frontend and redeploy affected services.
7. Rerun the health and lead-flow smoke checks.
