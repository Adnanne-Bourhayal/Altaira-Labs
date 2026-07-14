# Public Site Structure

This document describes the current public website structure after separating the calculator, service pages, sector pages and contact page.

## Public Routes

| Route | Purpose |
|---|---|
| `/` | Public homepage with hero, about section, business sectors, interactive service preview, blog preview and contact tray. |
| `/calculator` | Operational savings calculator with conversion, saved weekly time, recovered lead estimate and contact form. |
| `/contact` | Minimal contact page using the header background image and a focused contact tray. |
| `/blog` | Blog index with SEO-oriented article cards. |
| `/blog/[slug]` | Static article pages. |
| `/business/[slug]` | Sector-specific pages for Clinics, Car Dealers, Restaurants and Specialty by Sector. |
| `/services/[slug]` | Public service pages for each offer. |

## Existing Admin Route Kept

`/services` still exists as the authenticated/admin service catalogue page. Public navigation links directly to `/services/[slug]` pages.

Middleware protection keeps `/services` protected, while `/services/[slug]` remains public.

## Shared Data

Public site content is centralized in:

```text
lib/public-site-data.ts
```

It contains:

- public services
- business sectors
- blog post metadata

## About Section

`Sobre nosotros` is a homepage anchor at `/#about`, not a separate route. Public navigation and footer links should point to that anchor.

## Shared Contact Component

The reusable contact tray is:

```text
components/public/ContactTray.tsx
```

It supports:

- form submission through `/api/leads`
- lead persistence through the Spring Boot backend
- internal email notification through backend SMTP configuration
- optional phone and service/interest context in the saved lead and notification email
- prepared email link when explicitly enabled
- optional prepared WhatsApp link, hidden by default for a more professional public contact flow
- light and dark display modes

The public navbar Client Area button points to `/client-area`. This page is visual preparation only; invitation-based
client registration and private dashboards remain future work.

## Design Direction

- Public sections after the hero use a white page background by default.
- Dark modules are reserved for sector cards, service panels, blog cards and calculator result/contact panels.
- The services preview uses an interactive square-edged tabbed showcase.
- The calculator uses the Altaira blue/violet identity as a restrained Electric Indigo accent.
- The contact page uses the header background with a dark blur layer and a centered contact tray.
- Image areas remain as `IMG` placeholders until real visual assets are available.
