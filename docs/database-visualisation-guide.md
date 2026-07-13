# Database Visualisation Guide

Use this guide to view the real PostgreSQL database visually without exposing secrets.

## Option 1: Neon Console SQL Editor

Open:

```text
https://console.neon.tech/
```

Use it for:

- Quick table inspection.
- Running safe read-only SQL.
- Checking rows created by the MVP lead flow.

Recommended safe queries:

```sql
select count(*) from public.leads;

select id, full_name, business_name, email, status, created_at
from public.leads
order by created_at desc
limit 20;
```

Do not run destructive SQL such as `drop`, `truncate`, or broad `delete` without a reviewed plan.

## Option 2: DBeaver

DBeaver is the recommended local visual client because it is stable, general-purpose, and works well with PostgreSQL.

Connection fields:

| Field | Value |
|---|---|
| Database type | PostgreSQL |
| Host | `ep-odd-surf-an6ije74.c-6.us-east-1.aws.neon.tech` |
| Port | `5432` |
| Database | `neondb` |
| Username | Check `SPRING_DATASOURCE_USERNAME` in `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env` |
| Password | Check `SPRING_DATASOURCE_PASSWORD` in `/Volumes/T7/Altaira_Labs/.secrets/neon-render.env` |
| SSL | Required |

In DBeaver, enable SSL for the connection. Use the default SSL mode if it supports required SSL, or set SSL mode to `require`.

## Option 3: pgAdmin

pgAdmin also works for PostgreSQL.

Create a new server:

| Field | Value |
|---|---|
| Host name/address | `ep-odd-surf-an6ije74.c-6.us-east-1.aws.neon.tech` |
| Port | `5432` |
| Maintenance database | `neondb` |
| Username | Check local secrets file |
| Password | Check local secrets file |
| SSL mode | `Require` |

## Option 4: TablePlus

TablePlus is a lightweight visual database client.

Create a PostgreSQL connection:

| Field | Value |
|---|---|
| Host | `ep-odd-surf-an6ije74.c-6.us-east-1.aws.neon.tech` |
| Port | `5432` |
| Database | `neondb` |
| User | Check local secrets file |
| Password | Check local secrets file |
| SSL | Enabled / required |

## What To Inspect

Primary MVP table:

```text
public.leads
```

Useful columns:

- `id`
- `full_name`
- `business_name`
- `email`
- `status`
- `created_at`

Status values expected by the backend:

- `new`
- `contacted`
- `closed`

## Important

Do not use phpMyAdmin. This project uses PostgreSQL, not MySQL.
