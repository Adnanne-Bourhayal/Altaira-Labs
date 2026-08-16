"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDollarSign,
  FileClock,
  Layers3,
  Link2,
  RefreshCw,
  Route,
  ShieldAlert,
  Wrench,
  X,
} from "lucide-react"
import {
  provisioningRouteLabel,
  provisioningTrackLabel,
  requirementLabel,
  type ProvisioningDecisionTool,
  type ProvisioningPlan,
  type ProvisioningPlanStatus,
  type ProvisioningSharedResource,
  type ProvisioningTrackDecision,
} from "@/lib/provisioning-plan"
import { CommercialFlowPanel } from "@/components/admin/CommercialFlowPanel"

type Props = {
  leadId: string
  assessmentId?: string
  assessmentUpdatedAt?: string
  previewPlan?: ProvisioningPlan
}

const reviewStatuses: Array<{ value: ProvisioningPlanStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "awaiting_approval", label: "Awaiting approval" },
  { value: "approved", label: "Approved" },
]

export function ProvisioningPlanPanel({
  leadId,
  assessmentId,
  assessmentUpdatedAt,
  previewPlan,
}: Props) {
  const previewMode = Boolean(previewPlan)
  const [plan, setPlan] = useState<ProvisioningPlan | null>(previewPlan ?? null)
  const [loading, setLoading] = useState(!previewPlan)
  const [busy, setBusy] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [error, setError] = useState("")
  const [activeTrack, setActiveTrack] = useState<ProvisioningTrackDecision["track"] | null>(null)

  const load = useCallback(async () => {
    if (previewPlan) {
      setPlan(previewPlan)
      setLoading(false)
      setError("")
      return
    }
    if (!assessmentId) {
      setPlan(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/leads/${leadId}/provisioning-plans`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => [])
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load provisioning plans")
      }
      const plans = Array.isArray(data) ? data as ProvisioningPlan[] : []
      setPlan(plans.find((item) => item.assessmentId === assessmentId) || null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load provisioning plans")
    } finally {
      setLoading(false)
    }
  }, [assessmentId, leadId, previewPlan])

  useEffect(() => {
    void load()
  }, [assessmentUpdatedAt, load])

  const generate = async () => {
    if (previewMode || !assessmentId) return
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/leads/${leadId}/provisioning-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected provisioning response" }))
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not generate provisioning plan")
      }
      setPlan(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate provisioning plan")
    } finally {
      setBusy(false)
    }
  }

  const updateStatus = async (status: ProvisioningPlanStatus) => {
    if (previewMode || !plan) return
    setStatusBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/provisioning-plans/${plan.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected status response" }))
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update plan status")
      }
      setPlan(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update plan status")
    } finally {
      setStatusBusy(false)
    }
  }

  const activeRequirements = useMemo(
    () => Object.entries(plan?.normalizedRequirements || {})
      .filter(([, enabled]) => enabled)
      .map(([key]) => key),
    [plan]
  )
  const selectedTools = plan?.tools.filter((tool) => tool.selectionState === "selected") || []
  const excludedTools = plan?.tools.filter((tool) => tool.selectionState === "excluded") || []
  const tracks = useMemo(() => plan?.tracks || [], [plan?.tracks])
  const sharedResources = useMemo(() => plan?.sharedResources || [], [plan?.sharedResources])
  const sharedResourceKeys = useMemo(
    () => new Set(sharedResources.map((resource) => resource.key)),
    [sharedResources]
  )
  const selectedTrack = tracks.find((track) => track.track === activeTrack) || tracks[0]

  useEffect(() => {
    if (tracks.length > 0 && !tracks.some((track) => track.track === activeTrack)) {
      setActiveTrack(tracks[0].track)
    }
  }, [activeTrack, tracks])

  return (
    <section className="border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
      <header className="flex flex-col justify-between gap-4 border-b border-[#e0e0e0] p-6 dark:border-[#393939] sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">
              Provisioning engine
            </p>
            <span className="border border-[#0f62fe] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0f62fe]">
              Dry run
            </span>
            {previewMode && (
              <span className="border border-[#8a3ffc] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6929c4] dark:text-[#be95ff]">
                Local fixture
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold">Provisioning plan</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6f6f] dark:text-[#a8a8a8]">
            Explain the technical route before any client workspace or external resource is created.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={previewMode || !assessmentId || busy}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 bg-[#0f62fe] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#c6c6c6] disabled:text-[#6f6f6f]"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          {previewMode ? "Fixture preview" : plan ? "Refresh dry-run" : "Generate dry-run"}
        </button>
      </header>

      {loading ? (
        <div className="flex items-center gap-3 p-6 text-sm text-[#6f6f6f]">
          <RefreshCw className="h-4 w-4 animate-spin text-[#0f62fe]" />
          Loading plan
        </div>
      ) : !assessmentId ? (
        <EmptyPlan
          title="Assessment required"
          message="Save a structured assessment before generating a provisioning plan."
        />
      ) : !plan ? (
        <EmptyPlan
          title="No provisioning plan yet"
          message="Generate a dry-run to inspect the route, tools, exclusions and manual work."
        />
      ) : (
        <div>
          <div className="grid border-b border-[#e0e0e0] dark:border-[#393939] md:grid-cols-3">
            <PlanMetric
              icon={tracks.length > 0 ? <Layers3 className="h-4 w-4" /> : <Route className="h-4 w-4" />}
              label={tracks.length > 0 ? "Service tracks" : "Recommended route"}
              value={tracks.length > 0
                ? `${tracks.length} active track${tracks.length === 1 ? "" : "s"}`
                : provisioningRouteLabel(plan.route)}
              secondary={tracks.length > 0
                ? tracks.map((track) => provisioningTrackLabel(track.track)).join(" · ")
                : plan.route}
            />
            <PlanMetric
              icon={<Wrench className="h-4 w-4" />}
              label="Automation"
              value={`${plan.automationLevel} ${plan.automationScope}`}
              secondary="Planning only; provider execution disabled"
            />
            <label className="p-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">
                Review state
              </span>
              <select
                value={plan.status}
                disabled={previewMode || statusBusy}
                onChange={(event) => void updateStatus(event.target.value as ProvisioningPlanStatus)}
                className="mt-3 h-10 w-full border border-[#c6c6c6] bg-white px-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
              >
                {reviewStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="p-6">
            <div className="border-l-2 border-[#0f62fe] bg-[#edf5ff] px-4 py-3 dark:bg-[#001d3d]">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#0043ce] dark:text-[#78a9ff]">
                <ShieldAlert className="h-4 w-4" />
                Planning mode only
              </p>
              <p className="mt-1 text-xs leading-5 text-[#525252] dark:text-[#c6c6c6]">
                No external resources will be created until admin approval, payment confirmation and provider execution are enabled.
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#393939] dark:text-[#e0e0e0]">{plan.decisionReason}</p>

            <div className="mt-6">
              <PanelLabel>Required capabilities</PanelLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeRequirements.map((key) => (
                  <span key={key} className="border border-[#8d8d8d] px-3 py-2 text-xs font-medium dark:border-[#6f6f6f]">
                    {requirementLabel(key)}
                  </span>
                ))}
              </div>
            </div>

            {tracks.length > 0 ? (
              <div className="mt-7">
                <PanelLabel>Service tracks</PanelLabel>
                <div className="mt-3 flex flex-wrap border-b border-[#c6c6c6] dark:border-[#525252]">
                  {tracks.map((track) => {
                    const selected = selectedTrack?.track === track.track
                    return (
                      <button
                        key={track.track}
                        type="button"
                        onClick={() => setActiveTrack(track.track)}
                        className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${selected
                          ? "border-[#0f62fe] bg-[#edf5ff] text-[#0043ce] dark:bg-[#001d3d] dark:text-[#78a9ff]"
                          : "border-transparent text-[#525252] hover:bg-[#f4f4f4] dark:text-[#c6c6c6] dark:hover:bg-[#393939]"
                        }`}
                      >
                        {provisioningTrackLabel(track.track)}
                      </button>
                    )
                  })}
                </div>
                {selectedTrack && (
                  <TrackDecisionDetails
                    track={selectedTrack}
                    sharedResourceKeys={sharedResourceKeys}
                  />
                )}
              </div>
            ) : (
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <PanelLabel>Selected tools</PanelLabel>
                  <span className="text-xs text-[#6f6f6f] dark:text-[#a8a8a8]">Legacy v1 plan</span>
                </div>
                <div className="divide-y divide-[#e0e0e0] border-y border-[#e0e0e0] dark:divide-[#393939] dark:border-[#393939]">
                  {selectedTools.map((tool) => (
                    <div key={tool.id} className="grid gap-2 py-4 sm:grid-cols-[180px_64px_1fr] sm:items-start">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Check className="h-4 w-4 text-[#0f62fe]" />
                        {tool.displayName}
                      </span>
                      <span className="text-xs font-semibold text-[#0f62fe]">{tool.automationLevel}</span>
                      <span className="text-sm leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{tool.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tracks.length > 0 && (
              <SharedResources resources={sharedResources} />
            )}

            <div className="mt-7">
              <PanelLabel>Resources this plan would prepare</PanelLabel>
              <div className="mt-3 overflow-x-auto border border-[#e0e0e0] dark:border-[#393939]">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-[#090b16] text-white">
                    <tr>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Provider</th>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Resource</th>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Name</th>
                      <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
                    {plan.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 font-semibold">{item.providerKey}</td>
                        <td className="px-4 py-4 text-[#6f6f6f] dark:text-[#a8a8a8]">{item.resourceType}</td>
                        <td className="px-4 py-4">{item.resourceName}</td>
                        <td className="px-4 py-4 text-[#0f62fe]">{item.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-2">
              {tracks.length === 0 && (
                <>
              <DetailPanel
                icon={<FileClock className="h-4 w-4" />}
                title={`Manual steps (${plan.manualSteps.length})`}
              >
                <div className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
                  {plan.manualSteps.map((step) => (
                    <div key={step.id} className="py-3">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{step.reason}</p>
                    </div>
                  ))}
                </div>
              </DetailPanel>
              <DetailPanel
                icon={<AlertTriangle className="h-4 w-4" />}
                title={`Risks (${plan.risks.length})`}
              >
                <ul className="space-y-3 py-1">
                  {plan.risks.map((risk) => (
                    <li key={risk} className="text-sm leading-5 text-[#525252] dark:text-[#c6c6c6]">{risk}</li>
                  ))}
                </ul>
              </DetailPanel>
              <DetailPanel title={`Excluded tools (${excludedTools.length})`}>
                <div className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
                  {excludedTools.map((tool) => (
                    <div key={tool.id} className="py-3">
                      <p className="text-sm font-semibold">{tool.displayName}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{tool.reason}</p>
                    </div>
                  ))}
                </div>
              </DetailPanel>
                </>
              )}
              <DetailPanel
                icon={<CircleDollarSign className="h-4 w-4" />}
                title="Cost control"
              >
                <p className="py-1 text-sm leading-6 text-[#525252] dark:text-[#c6c6c6]">{plan.costEstimate}</p>
              </DetailPanel>
            </div>

            {previewMode ? (
              <div className="mt-7 border border-[#393939] bg-[#090b16] p-4 text-white">
                <p className="text-sm font-semibold">Commercial activation is unavailable in fixture preview</p>
                <p className="mt-1 text-xs leading-5 text-white/55">
                  {plan.externalResources.length} idempotent resource placeholders are stored; no API was called.
                </p>
              </div>
            ) : (
              <CommercialFlowPanel planId={plan.id} planApproved={plan.status === "approved" || plan.status === "provisioned" || plan.status === "partially_completed"} />
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="border-t border-red-300 bg-red-50 px-6 py-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/25 dark:text-red-200">
          {error}
        </div>
      )}
    </section>
  )
}

function TrackDecisionDetails({
  track,
  sharedResourceKeys,
}: {
  track: ProvisioningTrackDecision
  sharedResourceKeys: Set<string>
}) {
  const trackTools = track.tools.filter((tool) => !sharedResourceKeys.has(tool.key))
  const included = trackTools.filter((tool) => tool.selectionState === "selected")
  const excluded = trackTools.filter((tool) => tool.selectionState === "excluded")
  const confidence = Math.round(track.confidence * 100)

  return (
    <article className="border-x border-b border-[#c6c6c6] dark:border-[#525252]">
      <header className="grid gap-4 bg-[#090b16] p-5 text-white md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-[#78a9ff] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#78a9ff]">
              {provisioningTrackLabel(track.track)}
            </span>
            <span className="text-xs text-white/45">Rule {track.ruleId}</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold">{provisioningRouteLabel(track.route)}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">{track.reason}</p>
        </div>
        <div className="grid grid-cols-2 gap-px border border-white/15 bg-white/15 text-center">
          <TrackMetric label="Automation" value={track.automationLevel} />
          <TrackMetric label="Confidence" value={`${confidence}%`} />
        </div>
      </header>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {track.matchedSignals.map((signal) => (
            <span key={signal} className="border border-[#c6c6c6] px-2.5 py-1.5 text-xs text-[#525252] dark:border-[#525252] dark:text-[#c6c6c6]">
              {signal}
            </span>
          ))}
          {track.requiresManualDecision && (
            <span className="border border-[#8a3ffc] px-2.5 py-1.5 text-xs font-semibold text-[#6929c4] dark:text-[#be95ff]">
              Admin decision required
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TrackToolList title={`Included tools (${included.length})`} tools={included} included />
          <TrackToolList title={`Excluded tools (${excluded.length})`} tools={excluded} />
        </div>

        {sharedResourceKeys.size > 0 && (
          <p className="mt-4 flex items-center gap-2 text-xs text-[#6f6f6f] dark:text-[#a8a8a8]">
            <Link2 className="h-3.5 w-3.5" />
            Cross-track providers are listed once in Shared resources below.
          </p>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <DetailPanel
            icon={<FileClock className="h-4 w-4" />}
            title={`Manual steps (${track.manualSteps.length})`}
          >
            {track.manualSteps.length === 0 ? (
              <EmptyDetail>No manual steps for this track.</EmptyDetail>
            ) : (
              <div className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
                {track.manualSteps.map((step) => (
                  <div key={step.providerKey} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{step.title}</p>
                      {step.required && <span className="text-[10px] font-semibold uppercase text-[#da1e28]">Required</span>}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{step.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </DetailPanel>
          <DetailPanel
            icon={<AlertTriangle className="h-4 w-4" />}
            title={`Risks (${track.risks.length})`}
          >
            {track.risks.length === 0 ? (
              <EmptyDetail>No track-specific risks recorded.</EmptyDetail>
            ) : (
              <ul className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
                {track.risks.map((risk) => (
                  <li key={risk} className="py-3 text-sm leading-5 text-[#525252] dark:text-[#c6c6c6]">{risk}</li>
                ))}
              </ul>
            )}
          </DetailPanel>
        </div>
      </div>
    </article>
  )
}

function TrackMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 bg-[#090b16] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/40">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function TrackToolList({
  title,
  tools,
  included = false,
}: {
  title: string
  tools: ProvisioningDecisionTool[]
  included?: boolean
}) {
  return (
    <section>
      <PanelLabel>{title}</PanelLabel>
      {tools.length === 0 ? (
        <p className="mt-3 border-y border-[#e0e0e0] py-4 text-sm text-[#6f6f6f] dark:border-[#393939] dark:text-[#a8a8a8]">None</p>
      ) : (
        <div className="mt-3 divide-y divide-[#e0e0e0] border-y border-[#e0e0e0] dark:divide-[#393939] dark:border-[#393939]">
          {tools.map((tool) => (
            <div key={tool.key} className="grid grid-cols-[20px_1fr_auto] gap-2 py-3">
              {included
                ? <Check className="mt-0.5 h-4 w-4 text-[#0f62fe]" />
                : <X className="mt-0.5 h-4 w-4 text-[#6f6f6f]" />}
              <div>
                <p className="text-sm font-semibold">{tool.displayName}</p>
                <p className="mt-1 text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{tool.reason}</p>
              </div>
              <span className="text-xs font-semibold text-[#0f62fe]">{tool.automationLevel}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SharedResources({ resources }: { resources: ProvisioningSharedResource[] }) {
  return (
    <section className="mt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <PanelLabel>Shared resources</PanelLabel>
          <p className="mt-2 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
            One decision per resource, reused across every applicable track.
          </p>
        </div>
        <Link2 className="h-5 w-5 text-[#0f62fe]" />
      </div>
      {resources.length === 0 ? (
        <p className="mt-3 border border-[#c6c6c6] p-4 text-sm text-[#6f6f6f] dark:border-[#525252] dark:text-[#a8a8a8]">
          This plan does not require a shared resource.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto border border-[#c6c6c6] dark:border-[#525252]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#090b16] text-white">
              <tr>
                <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Resource</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Decision</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Level</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Used by tracks</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-[0.1em]">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
              {resources.map((resource) => (
                <tr key={resource.key}>
                  <td className="px-4 py-4 font-semibold">{resource.displayName}</td>
                  <td className="px-4 py-4">
                    <span className={resource.selectionState === "selected" ? "text-[#0f62fe]" : "text-[#6f6f6f]"}>
                      {resource.selectionState === "selected" ? "Included" : "Excluded"}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{resource.automationLevel}</td>
                  <td className="px-4 py-4 text-[#525252] dark:text-[#c6c6c6]">
                    {resource.usedByTracks.length > 0
                      ? resource.usedByTracks.map(provisioningTrackLabel).join(", ")
                      : "None"}
                  </td>
                  <td className="max-w-sm px-4 py-4 text-[#6f6f6f] dark:text-[#a8a8a8]">{resource.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function EmptyDetail({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">{children}</p>
}

function EmptyPlan({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-6">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6f6f6f] dark:text-[#a8a8a8]">{message}</p>
    </div>
  )
}

function PlanMetric({
  icon,
  label,
  value,
  secondary,
}: {
  icon: React.ReactNode
  label: string
  value: string
  secondary: string
}) {
  return (
    <div className="border-b border-[#e0e0e0] p-5 dark:border-[#393939] md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 text-[#0f62fe]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[#6f6f6f] dark:text-[#a8a8a8]">{secondary}</p>
    </div>
  )
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f] dark:text-[#a8a8a8]">
      {children}
    </p>
  )
}

function DetailPanel({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <details className="group border border-[#c6c6c6] dark:border-[#525252]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#e0e0e0] px-4 py-3 dark:border-[#393939]">{children}</div>
    </details>
  )
}
