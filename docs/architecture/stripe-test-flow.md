# Stripe test flow

## Modes

`STRIPE_CHECKOUT_MODE=mock` creates an internal checkout session without contacting Stripe. It returns no checkout URL and cannot activate a client unless `STRIPE_MOCK_CONFIRMATION_ENABLED=true` is also set.

`STRIPE_CHECKOUT_MODE=test` uses Stripe Checkout through the official Java SDK. Only keys starting with `sk_test_` are accepted. Keys starting with `sk_live_` are rejected during configuration validation.

## Backend variables

Configure these on the backend/Render service only:

| Variable | Required | Recommended test value/purpose |
| --- | --- | --- |
| `STRIPE_CHECKOUT_ENABLED` | Yes for Stripe API | `true` |
| `STRIPE_CHECKOUT_MODE` | Yes | `test` |
| `STRIPE_SECRET_KEY` | Yes for test mode | Stripe restricted/test secret key; never expose it to Vercel |
| `STRIPE_WEBHOOK_SECRET` | Yes | Signing secret for the exact backend webhook endpoint |
| `STRIPE_SUCCESS_URL` | Yes | `https://<frontend>/payment/success` |
| `STRIPE_CANCEL_URL` | Yes | `https://<frontend>/payment/cancel` |
| `STRIPE_MOCK_CONFIRMATION_ENABLED` | No | Keep `false` outside controlled local tests |
| `ALTAIRA_LEGACY_DIRECT_CONVERSION_ENABLED` | No | Keep `false` |

Commercial Resend variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `COMMERCIAL_EMAIL_ENABLED` | No | Enable commercial emails when sender and key are ready |
| `COMMERCIAL_NOTIFICATION_FROM` | Yes when enabled | Verified Resend sender |
| `COMMERCIAL_EMAIL_TIMEOUT_MS` | No | HTTP timeout; default 6000 ms |
| `RESEND_API_KEY` | Yes when enabled | Existing backend-only Resend key |
| `RESEND_API_URL` | No | Defaults to `https://api.resend.com/emails` |

No Stripe secret belongs in Vercel. The frontend uses same-origin Next proxy routes and never receives the secret key or webhook secret.

## Controlled test sequence

1. Create or load a lead assessment and v2 provisioning plan.
2. Approve the plan in admin.
3. Create a payment request in the Commercial activation panel.
4. Open the returned Stripe test Checkout URL.
5. Complete payment with a Stripe test card.
6. Stripe sends `checkout.session.completed` to `/api/v1/payments/stripe/webhook`.
7. The backend verifies the signature and event ID.
8. Only a paid session activates the client, workspace, invitation and dry-run provisioning.
9. Refresh the panel to inspect all persisted states and steps.

Asynchronous methods remain pending until `checkout.session.async_payment_succeeded`. Failed and expired events map to failed/cancelled payment states.

## Failure and retry behavior

- Duplicate checkout requests with the same plan, amount and currency reuse an active or confirmed session.
- A failed or expired/cancelled session is terminal. Admin may create a new payment request; its retry key is derived from the terminal session so repeated clicks still remain idempotent.
- Duplicate webhook event IDs do nothing.
- Invalid signatures are rejected.
- Email failure does not invalidate payment.
- Commercial email logs are visible in the admin audit panel.
- Failed or previously skipped emails can be retried after Resend is configured; successful deliveries are never sent twice by that action.
- Post-payment activation failure is retained and can be retried from admin without creating another payment.
- Provider dry-run blockage marks the plan partially completed, not falsely provisioned.

## Current deployment state

The Stripe integration and admin UI are implemented and locally tested with H2/mock
webhook data. The end-to-end acceptance test covers intake, approved plan, mock
checkout, payment confirmation, activation, workspace, invitation and dry-run
provisioning. The complete backend suite passes `143` tests.

The additive commercial database migration was applied to production on `2026-07-23`
after a verified recovery point and passed its read-only postcheck. The six commercial
tables are present and empty; no checkout or provider resource was created by the
migration.

Application deployment and Stripe test configuration remain separate gates. Until the
reviewed application commit is deployed and Render has an `sk_test_` key plus the
matching webhook secret, production must remain in mock/disabled mode. Live Stripe
keys remain rejected by application startup.
