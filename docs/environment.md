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
| `ADMIN_EMAIL` | `.env.local`, Vercel | Chosen MVP admin email | Low sensitivity | Used by login route. |
| `ADMIN_PASSWORD` | `.env.local`, Vercel | Chosen MVP admin password | Yes | Do not reuse personal passwords. Rotate if exposed. |
| `INTERNAL_API_TOKEN` | `.env.local`, Vercel | Same shared token as backend | Yes | Must match backend `INTERNAL_API_TOKEN`. Never prefix with `NEXT_PUBLIC_`. |

## Backend / Spring Boot Variables

These belong in `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env` for local backend runs and in Render environment variables for deployment.

| Variable | Where it goes | Source | Secret? | Notes |
|---|---|---|---|---|
| `RENDER_BACKEND_URL` | Local secrets helper file | Render service dashboard | No | Used by local validation scripts/docs. |
| `SPRING_DATASOURCE_URL` | Local secrets helper file, Render | Neon Console JDBC URL | Sensitive if complete | Use JDBC format. Do not include the password in this value. |
| `SPRING_DATASOURCE_USERNAME` | Local secrets helper file, Render | Neon Console role/user | Low sensitivity | Current validated user is stored in the local secrets file. |
| `SPRING_DATASOURCE_PASSWORD` | Local secrets helper file, Render | Neon Console role password | Yes | Rotate in Neon if exposed. Update Render and local secrets after rotation. |
| `INTERNAL_API_TOKEN` | Local secrets helper file, Render | Same shared token as frontend server | Yes | Must match Vercel and `.env.local`. |

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
| Admin password | You choose it for the MVP admin login | Vercel `ADMIN_PASSWORD`; local `.env.local` |
| Internal API token | You choose/generate one shared token | Render `INTERNAL_API_TOKEN`; Vercel `INTERNAL_API_TOKEN`; local `.env.local`; local `.secrets/neon-render.env` |

## Rotation Checklist

If any password/token is exposed:

1. Rotate the value in the provider dashboard first.
2. Update Render environment variables.
3. Update Vercel environment variables if relevant.
4. Update `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env`.
5. Update local `.env.local` if the internal API token or admin password changed.
6. Restart local backend/frontend and redeploy affected services.
7. Rerun the health and lead-flow smoke checks.
