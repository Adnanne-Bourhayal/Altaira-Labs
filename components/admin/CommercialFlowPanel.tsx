"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, CreditCard, ExternalLink, Mail, RefreshCw, ShieldCheck } from "lucide-react"
import { commercialStatusLabel, type CommercialFlow } from "@/lib/commercial-flow"

type Props = {
  planId: string
  planApproved: boolean
}

export function CommercialFlowPanel({ planId, planApproved }: Props) {
  const [flow, setFlow] = useState<CommercialFlow | null>(null)
  const [amount, setAmount] = useState("1500")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      const response = await fetch(`/api/internal/provisioning-plans/${planId}/commercial-flow`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not load commercial flow")
      setFlow(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load commercial flow")
    }
  }, [planId])

  useEffect(() => { void load() }, [load])

  const createCheckout = async () => {
    const amountMinor = Math.round(Number(amount) * 100)
    if (!Number.isFinite(amountMinor) || amountMinor < 100) {
      setError("Enter an amount of at least 1.00 EUR")
      return
    }
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/provisioning-plans/${planId}/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor, currency: "EUR", description: "Altaira Labs approved service plan" }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not create checkout")
      setFlow(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create checkout")
    } finally {
      setBusy(false)
    }
  }

  const confirmMock = async () => {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/provisioning-plans/${planId}/payments/mock-confirm`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || data?.error || "Mock confirmation failed")
      setFlow(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mock confirmation failed")
    } finally {
      setBusy(false)
    }
  }

  const retry = async () => {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/provisioning-plans/${planId}/commercial-flow/retry`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || data?.error || "Activation retry failed")
      setFlow(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Activation retry failed")
    } finally {
      setBusy(false)
    }
  }

  const retryNotifications = async () => {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/provisioning-plans/${planId}/commercial-flow/notifications/retry`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || data?.error || "Email retry failed")
      setFlow(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Email retry failed")
    } finally {
      setBusy(false)
    }
  }

  const emailDeliveries = flow?.emailDeliveries ?? []
  const canRetryEmail = emailDeliveries.some((delivery) =>
    delivery.status === "FAILED" ||
    (delivery.status === "SKIPPED" && (delivery.emailType !== "PAYMENT_REQUEST" || Boolean(flow?.paymentSession?.checkoutUrl)))
  )
  const canCreatePaymentRequest = !flow?.paymentSession ||
    flow.paymentStatus === "PAYMENT_FAILED" ||
    flow.paymentStatus === "PAYMENT_CANCELLED"

  return (
    <section className="mt-7 border border-[#393939] bg-[#090b16] text-white">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-[#78a9ff]">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Commercial activation</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold">Payment before workspace activation</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            The approved plan creates a payment request first. Client, workspace and invitation remain pending until payment is confirmed.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 border border-white/20 px-3 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      {!planApproved ? (
        <p className="p-5 text-sm text-white/60">Approve the provisioning plan before creating a payment request.</p>
      ) : (
        <div className="p-5">
          <div className="grid gap-px bg-white/10 sm:grid-cols-5">
            <Status label="Payment" value={flow?.paymentStatus || "PAYMENT_NOT_STARTED"} />
            <Status label="Client" value={flow?.clientStatus || "CLIENT_DRAFT"} />
            <Status label="Workspace" value={flow?.workspaceStatus || "WORKSPACE_PENDING"} />
            <Status label="Invitation" value={flow?.invitationStatus || "INVITATION_PENDING"} />
            <Status label="Provisioning" value={flow?.provisioningStatus || "PROVISIONING_PENDING"} />
          </div>

          {canCreatePaymentRequest ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block w-full sm:max-w-48">
                <span className="mb-2 block text-xs text-white/55">Approved amount (EUR)</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="h-11 w-full border border-white/20 bg-[#161616] px-3 text-sm outline-none focus:border-[#0f62fe]" />
              </label>
              <button type="button" disabled={busy} onClick={() => void createCheckout()} className="inline-flex h-11 items-center justify-center gap-2 bg-[#0f62fe] px-5 text-sm font-semibold disabled:opacity-50">
                <CreditCard className="h-4 w-4" /> {busy ? "Preparing..." : flow?.paymentSession ? "Create new payment request" : "Create payment request"}
              </button>
            </div>
          ) : flow?.paymentSession ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="border border-white/20 px-3 py-2 text-sm">
                {(flow.paymentSession.amountMinor / 100).toFixed(2)} {flow.paymentSession.currency} · {flow.paymentSession.providerMode}
              </span>
              {flow.paymentSession.checkoutUrl && (
                <a href={flow.paymentSession.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 bg-[#0f62fe] px-4 text-sm font-semibold">
                  Open Stripe Checkout <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {flow.mockMode && flow.mockConfirmationAllowed && flow.paymentStatus !== "PAYMENT_CONFIRMED" && (
                <button type="button" disabled={busy} onClick={() => void confirmMock()} className="h-10 border border-[#78a9ff] px-4 text-sm font-semibold text-[#78a9ff] disabled:opacity-50">
                  Confirm mock payment
                </button>
              )}
            </div>
          ) : null}

          {flow?.clientId && (
            <Link href={`/clients/${flow.clientId}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#78a9ff]">
              <CheckCircle2 className="h-4 w-4" /> Open activated client
            </Link>
          )}

          {flow?.provisioningRun && (
            <details className="mt-5 border border-white/15">
              <summary className="cursor-pointer p-4 text-sm font-semibold">
                Provisioning audit · {flow.provisioningRun.steps.length} steps · {flow.provisioningRun.status}
              </summary>
              <div className="max-h-72 divide-y divide-white/10 overflow-auto border-t border-white/10">
                {flow.provisioningRun.steps.map((step) => (
                  <div key={step.id} className="grid gap-1 px-4 py-3 text-xs sm:grid-cols-[130px_1fr_auto]">
                    <span className="font-semibold text-[#78a9ff]">{step.provider}</span>
                    <div>
                      <p className="text-white/70">{step.action}</p>
                      {provisioningTarget(step.inputSummary) && (
                        <p className="mt-1 text-[11px] text-white/35">{provisioningTarget(step.inputSummary)}</p>
                      )}
                    </div>
                    <span className={step.status === "BLOCKED" ? "text-[#ff8389]" : "text-white/45"}>{step.status}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {emailDeliveries.length > 0 && (
            <details className="mt-5 border border-white/15">
              <summary className="cursor-pointer p-4 text-sm font-semibold">
                Email delivery audit · {emailDeliveries.length} events
              </summary>
              <div className="divide-y divide-white/10 border-t border-white/10">
                {emailDeliveries.map((delivery) => (
                  <div key={delivery.id} className="grid gap-1 px-4 py-3 text-xs sm:grid-cols-[150px_1fr_auto]">
                    <span className="font-semibold text-[#78a9ff]">{commercialStatusLabel(delivery.emailType)}</span>
                    <div>
                      <p className="text-white/65">{delivery.recipient}</p>
                      {delivery.safeError && <p className="mt-1 text-[11px] text-white/35">{delivery.safeError}</p>}
                    </div>
                    <span className={delivery.status === "FAILED" ? "text-[#ff8389]" : "text-white/45"}>{delivery.status}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {canRetryEmail && (
            <button type="button" disabled={busy} onClick={() => void retryNotifications()} className="mt-5 inline-flex h-10 items-center gap-2 border border-[#78a9ff] px-4 text-sm font-semibold text-[#78a9ff] disabled:opacity-50">
              <Mail className="h-4 w-4" /> Retry failed emails
            </button>
          )}

          {flow?.paymentStatus === "PAYMENT_CONFIRMED" && (flow.provisioningStatus === "PROVISIONING_FAILED" || flow.invitationStatus === "INVITATION_FAILED") && (
            <button type="button" disabled={busy} onClick={() => void retry()} className="mt-5 h-10 border border-[#ff8389] px-4 text-sm font-semibold text-[#ff8389]">Retry activation</button>
          )}
          <p className="mt-4 text-xs leading-5 text-white/45">{flow?.safeMessage || "Loading commercial state..."}</p>
          {error && <p className="mt-4 border-l-2 border-[#ff8389] bg-[#2d0709] px-4 py-3 text-sm text-[#ffb3b8]">{error}</p>}
        </div>
      )}
    </section>
  )
}

function provisioningTarget(summary: Record<string, unknown>) {
  const candidates = [
    summary.summary,
    summary.folderName,
    summary.eventTitle,
    summary.resourceName,
    summary.tenancyStrategy,
    summary.deploymentPolicy,
  ]
  return candidates.find((value): value is string => typeof value === "string" && value.length > 0) || ""
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#090b16] p-3">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">{label}</p>
      <p className="mt-1 text-sm font-semibold">{commercialStatusLabel(value)}</p>
    </div>
  )
}
