# Client Workspace, Documents and Signature Strategy

## Workspace Architecture

Altaira uses one workspace per client:

```text
Client Workspace
├── Resumen
├── Mi empresa
├── Mis servicios
│   ├── Web & SEO
│   ├── Booking
│   ├── CRM
│   ├── Automation
│   └── Dashboard
├── Onboarding
└── Documentos
```

Only contracted services are active. Each active service has its own project track, onboarding requirements, resources and review cycle.

The frontend uses one shell for admin and client. Backend authorization remains the security boundary:

- client API resolves the client from its session and never accepts another client ID;
- admin API requires an authenticated admin session and an explicit client ID;
- preview mode is a read-only rendering of client visibility, not impersonation;
- admin-only notes and technical configuration are never included in client responses.

## Document Model

The current MVP reuses onboarding files and project assets. The UI normalizes their existing state into a document list and exposes actions by role.

Future additive document metadata should support:

- `draft`
- `review`
- `sent`
- `viewed`
- `accepted`
- `pending_signature`
- `signed`
- `rejected`
- `expired`
- `replaced`

Recommended future fields:

- workspace, client and optional service/project IDs;
- title, type, version and visibility;
- provider and external document ID;
- external signing/view URL;
- current status and expiry;
- replacement document ID;
- created, sent, viewed, accepted and signed timestamps;
- audit events without secrets.

Altaira should not implement its own legal-signature engine.

## Signature Provider Decision

### MVP: Dropbox Sign, manual workflow

Use Dropbox Sign manually first:

1. Admin prepares the final PDF outside Altaira.
2. Admin sends it through Dropbox Sign.
3. Altaira stores the external reference/link and `pending_signature` state.
4. Admin updates the status after confirmation and uploads or links the signed PDF.
5. The client sees only the safe document status and permitted action.

Dropbox states that its free plan includes unlimited self-signing and three outgoing signature requests per month. Its paid Essentials plan is currently listed from USD 15/month, and paid plans include reusable templates and audit trails. Verify the current account limit before relying on it operationally:

- [Dropbox Sign product](https://sign.dropbox.com/products/dropbox-sign)
- [Dropbox Sign pricing](https://sign.dropbox.com/en-GB/products/dropbox-sign/pricing)
- [Dropbox Sign free-plan explanation](https://sign.dropbox.com/dropbox-sign-rebrand-faqs)

This is enough for a low-volume TFG/MVP and avoids handling signature credentials in Altaira.

### Later: provider API

Only add an API when volume justifies it. Required controls:

- provider token stored only in the backend secret manager;
- minimum scopes and separate test/production credentials;
- idempotency key per signature request;
- signed webhook verification;
- provider document ID and status-event audit;
- retry without duplicate requests;
- manual fallback.

Dropbox Sign API has separate plans and should not be assumed to be included in the free web-app workflow.

## Alternatives

- **PandaDoc:** current official pricing advertises a free plan with a limited yearly document allowance and paid API/automation capabilities depending on plan. Suitable when proposals, document editing and signing need one commercial workflow. [Official pricing](https://www.pandadoc.com/pricing/)
- **SignRequest:** offers a free allowance and low-cost paid plans; API access has separate conditions and usage pricing. Suitable for simpler signature workflows. [Official pricing](https://signrequest.com/en/plans)
- **Yousign:** EU-oriented signature provider worth evaluating when European identity and compliance requirements become more important. [Official pricing](https://yousign.com/pricing-application)
- **Adobe Acrobat Sign:** suitable for organizations already standardized on Adobe/Microsoft enterprise workflows; evaluate through the official commercial plan before integration.

## Legal Boundary

eIDAS distinguishes simple, advanced and qualified electronic signatures. A qualified signature has the legal effect of a handwritten signature across EU Member States; not every business agreement necessarily requires that level. The required signature level must be decided per contract and jurisdiction, with legal advice when risk is material:

- [European Commission eIDAS overview](https://digital-strategy.ec.europa.eu/en/policies/discover-eidas)
- [European Commission eSignature FAQ](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/880312429/eSignature%2BFAQ)

Altaira records workflow status and evidence references. The external provider remains responsible for the signature ceremony and provider audit trail.

## Migration Boundary

No migration is required for the initial workspace consolidation. A later migration is needed only when Altaira must manage document versions, expiry, replacement chains and provider webhook state as first-class records.

## MVP Implementation Status

The workspace consolidation is implemented without a schema migration:

- `/workspace/[workspaceId]` is the canonical destination for admin and client access;
- role-aware controls are rendered from one shared workspace shell;
- client ownership is enforced by backend session context;
- secure download endpoints validate ownership before returning onboarding files or project assets;
- current document rows are normalized from existing project assets and onboarding agreements;
- only contracted service tracks are shown;
- onboarding progress comes from persisted required-task states;
- admin preview is read-only and never changes the authenticated admin role.

The Stripe test checkout, Resend delivery and existing commercial activation flow remain separate and unchanged by this workspace block.
