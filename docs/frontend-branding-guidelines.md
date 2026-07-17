# Frontend Branding Guidelines

Altaira Labs should feel like a real technology consultancy for SMEs: professional, concrete and useful, not like a generic AI landing page.

## Positioning

- Brand: Altaira Labs.
- Category: technology consultancy for SMEs.
- Base promise: helping small businesses replace manual work with clear digital systems.
- Main value proposition: practical technology systems for SMEs that want more control, less manual work and a clearer way to manage clients, services and daily operations.
- Launch services: Professional Websites, Booking Systems, Workflow Automation, Management Dashboards and CRM / Lead Management Systems.
- Future expansion only: advanced AI automation, full client portal, large ERP integrations, advanced BI, mobile app, advanced multi-user RBAC and full Google/WhatsApp automation.
- Geographic signal: focused on Belgium and the Benelux, with Spain as a secondary market.

## Visual Direction

The current direction combines:

- Mobio-style hero impact: dark professional first viewport, strong title and clear CTA.
- TecnoCim / Advanto clarity: white content sections, practical copy, visible calculator and direct SME language.
- Singular Consulting structure: orderly navigation, service taxonomy, sector section and serious footer.

## Design Structure Rules

- Page background after the hero must be white by default.
- Dark navy / black modules are reserved for highlighted cards, service panels, blog article panels and calculator result panels.
- The main accent gradient is **Electric Indigo**: blue `#2563eb` moving into violet `#7c3aed`. Use it for active states, small rules, CTA emphasis and key values.
- Main content width uses `max-w-7xl` with horizontal padding `px-5 sm:px-6 lg:px-8`.
- Section vertical rhythm uses `py-24` for main public sections and `py-20` only for secondary blocks.
- Public cards and controls should use square edges. Avoid pill/circular UI unless there is a strong functional reason.
- Repeated card grids use consistent gaps: `gap-5` for sector cards, `gap-6` for editorial rows, `gap-10` for split service panels.
- Brand color is an accent, not a full-page wash: use blue/violet for CTAs, active tabs, small top lines, hover states and key numbers.
- Use real, relevant visuals when available. Do not use them as proof of completed client work unless the proof is real.
- Metrics must be explainable: use operational labels and estimates, not fake client proof or invented success numbers.

## Public Website Rules

- Do not use fake testimonials, fake client logos or invented case metrics.
- Do not use stock or AI visuals as proof of completed client work.
- Do not claim guaranteed savings. The calculator must remain a planning estimate.
- Keep copy specific: lost leads, repeated admin work, messy Excel files, disconnected tools, weak follow-up and poor visibility.
- Do not promise "50+ clients", "guaranteed 40% growth", "AI-powered everything", "enterprise-grade platform", "official partner" or case studies without real evidence.
- Keep `/admin/login` available by direct URL but out of the public navigation.
- Keep `/login` only as a legacy redirect to `/admin/login`.
- Keep the visible Client Area CTA pointed at `/client/login`.
- Keep the public form connected to the real lead flow.

## Current Public Sections

- Navbar: Services, Business, About, Calculator, Blog, language selector, Contact CTA and Client Area button.
- Hero: "From the revolution to the future" with subtitle "Save your money, save your business."
- Businesses: Clinics, Car Dealers, Restaurants and Specialty by Sector.
- Priority clinic types: dental clinics, aesthetic clinics, physiotherapy and psychology practices.
- Services: Professional Websites, Booking Systems, Workflow Automation, Management Dashboards and CRM / Lead Management Systems.
- Calculator: manual hours, hourly cost, lost leads, average client value, improvement percentage, annual estimate and consultation form.
- Contact: Name, Business, Email, Industry, Goals/message, honeypot, timeout and clear success/error states.
- Footer: brand, free consultation email field, Company, Services, Sectors, Legal and LinkedIn placeholder.

## Asset Structure

Final brand assets are stored in `public/brand/`:

- `logo-white.png`
- `logo-blue.png`
- `favicon.png`
- `header_background.png`

The original source files are stored at the Altaira Labs root. The web-ready logo and favicon files are transparent PNG derivatives prepared from those source assets.

Additional public visuals are stored in `public/site-images/`. They are representative website assets, not proof of delivered client work. Name each image by page or section context, for example `service-crm-lead-management-workspace.jpg` or `blog-manual-admin-work.jpg`, and avoid reusing the same photo across unrelated contexts.

## Future Content Gate

Before adding new public content, confirm:

- It answers a real SME customer question.
- The claim can be defended in the TFG/demo.
- Any proof is real or clearly marked as placeholder.
- It does not imply integrations, automation or delivery capacity that does not exist yet.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` pass after changes.
