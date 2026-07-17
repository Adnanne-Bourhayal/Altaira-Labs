"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, ExternalLink, FileText, ListTodo, MessageSquare, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav"

type Client = {
  id: string
  name: string
  company: string
  email: string
  status: string
}

type ClientService = {
  id: string
  service: {
    id: string
    name: string
    category: string
  }
  status: string
  notes?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type ClientInvitation = {
  id: string
  email: string
  status: string
  emailSent: boolean
  expiresAt: string
  acceptedAt?: string | null
  createdAt: string
  updatedAt: string
}

type ClientCrmWebhookToken = {
  id: string
  label: string
  active: boolean
  tokenPrefix: string
  lastUsedAt?: string | null
  createdAt: string
  updatedAt: string
}

type ClientCrmFollowUpAction = {
  id: string
  leadId?: string | null
  title: string
  description?: string | null
  status: "open" | "done" | "cancelled"
  visibleToClient?: boolean
  dueAt?: string | null
  completedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type ClientCrmLead = {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  source?: string | null
  status: string
  priority: string
  sectorType: string
  followUpActions?: ClientCrmFollowUpAction[]
  notes?: { id: string; content: string; visibleToClient?: boolean; createdAt?: string | null }[]
  events?: { id: string; eventType: string; summary?: string | null; createdAt?: string | null }[]
  createdAt?: string | null
  updatedAt?: string | null
}

type OnboardingTask = {
  id: string
  title: string
  status: "pending" | "submitted" | "approved" | "rejected"
  required: boolean
  critical: boolean
  submittedAt?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  completedAt?: string | null
}

type OnboardingDashboard = {
  onboardingCompleted: boolean
  contractSubmitted: boolean
  contractApproved: boolean
  totalRequiredTasks: number
  completedRequiredTasks: number
  submittedTasks: number
  rejectedTasks: number
  contractSubmittedAt?: string | null
  contractApprovedAt?: string | null
  tasks: OnboardingTask[]
}

type ClientProjectAsset = {
  id: string
  status: "uploaded" | "approved" | "rejected"
  originalFilename: string
  externalUrl?: string | null
  uploadedAt?: string | null
  reviewedAt?: string | null
}

type ClientProject = {
  id: string
  projectKey: string
  name: string
  currentPhase: "requirements" | "design" | "development" | "review" | "launch"
  stagingUrl?: string | null
  latestClientFeedback?: string | null
  revisionPendingAt?: string | null
  assets?: ClientProjectAsset[]
}

type ClientPortal = {
  contractApproved: boolean
  onboardingCompleted: boolean
  projects: ClientProject[]
}

type WorkspaceActivity = {
  id: string
  label: string
  detail: string
  href?: string
  timestamp?: string | null
  tone: "positive" | "warning" | "neutral"
}

function statusToneClass(tone: WorkspaceActivity["tone"]) {
  if (tone === "positive") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
  }

  if (tone === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200"
  }

  return "border-white/10 bg-white/[0.04] text-white/55"
}

function phaseToneClass(phase: ClientProject["currentPhase"]) {
  if (phase === "launch") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
  }

  if (phase === "review") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-200"
  }

  return "border-white/10 bg-white/[0.04] text-white/60"
}

function timestampMs(value?: string | null) {
  if (!value) {
    return 0
  }

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown time"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown time"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function serviceLabel(projectKey: string) {
  switch (projectKey) {
    case "web_seo":
      return "Web and SEO"
    case "crm":
      return "CRM"
    case "booking":
      return "Booking"
    case "automation":
      return "Automation"
    case "dashboard":
      return "Dashboard"
    default:
      return projectKey.replaceAll("_", " ")
  }
}

function buildActivities(
  clientId: string,
  services: ClientService[],
  invitations: ClientInvitation[],
  webhooks: ClientCrmWebhookToken[],
  crmLeads: ClientCrmLead[],
  onboarding: OnboardingDashboard | null,
  portal: ClientPortal | null
) {
  const serviceActivity = services.map((assignment) => ({
    id: `service:${assignment.id}`,
    label: "Service",
    detail: `${assignment.service.name} is ${assignment.status.replaceAll("_", " ")}`,
    href: `/clients/${clientId}`,
    timestamp: assignment.updatedAt || assignment.createdAt,
    tone: assignment.status === "delivered" ? "positive" as const : "neutral" as const,
  }))

  const invitationActivity = invitations.map((invitation) => ({
    id: `invite:${invitation.id}`,
    label: "Access",
    detail: `${invitation.email} invitation is ${invitation.status}`,
    href: `/clients/${clientId}`,
    timestamp: invitation.acceptedAt || invitation.updatedAt || invitation.createdAt,
    tone: invitation.status === "accepted" ? "positive" as const : "neutral" as const,
  }))

  const webhookActivity = webhooks.map((webhook) => ({
    id: `webhook:${webhook.id}`,
    label: "CRM intake",
    detail: `${webhook.label} is ${webhook.active ? "active" : "revoked"}`,
    href: `/clients/${clientId}`,
    timestamp: webhook.lastUsedAt || webhook.updatedAt || webhook.createdAt,
    tone: webhook.active ? "positive" as const : "warning" as const,
  }))

  const crmActivity = crmLeads.flatMap((lead) => {
    const latestAction = [...(lead.followUpActions || [])]
      .sort((first, second) => timestampMs(second.updatedAt || second.createdAt) - timestampMs(first.updatedAt || first.createdAt))[0]

    return [
      {
        id: `lead:${lead.id}`,
        label: "CRM lead",
        detail: `${lead.fullName} is ${lead.status.replaceAll("_", " ")}`,
        href: `/clients/${clientId}/crm?lead=${lead.id}`,
        timestamp: lead.updatedAt || lead.createdAt,
        tone: lead.priority === "urgent" ? "warning" as const : "neutral" as const,
      },
      latestAction ? {
        id: `action:${latestAction.id}`,
        label: "Follow-up",
        detail: `${latestAction.title} is ${latestAction.status}`,
        href: `/clients/${clientId}/crm?lead=${lead.id}`,
        timestamp: latestAction.updatedAt || latestAction.createdAt,
        tone: latestAction.status === "open" ? "warning" as const : "positive" as const,
      } : null,
    ].filter(Boolean) as WorkspaceActivity[]
  })

  const onboardingActivity = onboarding?.tasks
    ?.filter((task) => task.submittedAt || task.approvedAt || task.rejectedAt || task.completedAt)
    .map((task) => ({
      id: `task:${task.id}`,
      label: "Onboarding",
      detail: `${task.title} is ${task.status}`,
      href: `/admin/onboarding/${clientId}`,
      timestamp: task.rejectedAt || task.approvedAt || task.completedAt || task.submittedAt,
      tone: task.status === "rejected" ? "warning" as const : task.status === "approved" ? "positive" as const : "neutral" as const,
    })) ?? []

  const projectActivity = portal?.projects
    ?.filter((project) => project.revisionPendingAt || project.latestClientFeedback)
    .map((project) => ({
      id: `project:${project.id}`,
      label: "Project",
      detail: project.latestClientFeedback || `${project.name} needs review`,
      href: `/admin/onboarding/${clientId}`,
      timestamp: project.revisionPendingAt,
      tone: project.revisionPendingAt ? "warning" as const : "neutral" as const,
    })) ?? []

  return [...serviceActivity, ...invitationActivity, ...webhookActivity, ...crmActivity, ...onboardingActivity, ...projectActivity]
    .filter((activity) => Boolean(activity.timestamp))
    .sort((first, second) => timestampMs(second.timestamp) - timestampMs(first.timestamp))
    .slice(0, 12)
}

function ReadinessItem({ label, ready, href }: { label: string; ready: boolean; href?: string }) {
  const content = (
    <span className={`flex items-center justify-between gap-3 border px-4 py-3 text-sm ${ready ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-amber-500/20 bg-amber-500/10 text-amber-100"}`}>
      <span>{label}</span>
      <span className="font-semibold">{ready ? "Ready" : "Needs review"}</span>
    </span>
  )

  if (!href) {
    return content
  }

  return <Link href={href} className="block hover:opacity-90">{content}</Link>
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: number | string; tone?: "positive" | "warning" | "neutral" }) {
  return (
    <div className={`border px-4 py-3 ${statusToneClass(tone)}`}>
      <p className="text-xs uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

export default function AdminClientWorkspacePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [client, setClient] = useState<Client | null>(null)
  const [services, setServices] = useState<ClientService[]>([])
  const [invitations, setInvitations] = useState<ClientInvitation[]>([])
  const [webhooks, setWebhooks] = useState<ClientCrmWebhookToken[]>([])
  const [crmLeads, setCrmLeads] = useState<ClientCrmLead[]>([])
  const [onboarding, setOnboarding] = useState<OnboardingDashboard | null>(null)
  const [portal, setPortal] = useState<ClientPortal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [notice, setNotice] = useState("")
  const [actionId, setActionId] = useState("")

  const fetchWorkspace = useCallback(async (silent = false) => {
    if (!id) {
      return
    }

    try {
      if (!silent) {
        setLoading(true)
      }
      setError("")

      const [
        clientResponse,
        servicesResponse,
        invitationsResponse,
        webhooksResponse,
        crmResponse,
        onboardingResponse,
        portalResponse,
      ] = await Promise.all([
        fetch(`/api/internal/clients/${id}`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/services`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/invitations`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/crm-webhooks`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/crm-leads`, { cache: "no-store" }),
        fetch(`/api/internal/onboarding/${id}`, { cache: "no-store" }),
        fetch(`/api/internal/client-portal/${id}`, { cache: "no-store" }),
      ])

      if ([clientResponse, servicesResponse, invitationsResponse, webhooksResponse, crmResponse, onboardingResponse, portalResponse].some((response) => response.status === 401)) {
        router.replace("/admin/login")
        return
      }

      const clientData = await clientResponse.json().catch(() => ({ error: "Unexpected client response" }))
      const servicesData = await servicesResponse.json().catch(() => ({ error: "Unexpected services response" }))
      const invitationsData = await invitationsResponse.json().catch(() => ({ error: "Unexpected invitations response" }))
      const webhooksData = await webhooksResponse.json().catch(() => ({ error: "Unexpected webhooks response" }))
      const crmData = await crmResponse.json().catch(() => ({ error: "Unexpected CRM response" }))
      const onboardingData = await onboardingResponse.json().catch(() => null)
      const portalData = await portalResponse.json().catch(() => null)

      if (!clientResponse.ok) {
        throw new Error(clientData?.message || clientData?.error || "Could not load client.")
      }

      if (!servicesResponse.ok) {
        throw new Error(servicesData?.message || servicesData?.error || "Could not load client services.")
      }

      if (!invitationsResponse.ok) {
        throw new Error(invitationsData?.message || invitationsData?.error || "Could not load invitations.")
      }

      if (!webhooksResponse.ok) {
        throw new Error(webhooksData?.message || webhooksData?.error || "Could not load CRM webhooks.")
      }

      if (!crmResponse.ok) {
        throw new Error(crmData?.message || crmData?.error || "Could not load CRM leads.")
      }

      setClient(clientData as Client)
      setServices(Array.isArray(servicesData) ? servicesData as ClientService[] : [])
      setInvitations(Array.isArray(invitationsData) ? invitationsData as ClientInvitation[] : [])
      setWebhooks(Array.isArray(webhooksData) ? webhooksData as ClientCrmWebhookToken[] : [])
      setCrmLeads(Array.isArray(crmData) ? crmData as ClientCrmLead[] : [])
      setOnboarding(onboardingResponse.ok ? onboardingData as OnboardingDashboard : null)
      setPortal(portalResponse.ok ? portalData as ClientPortal : null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not load workspace.")
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [id, router])

  useEffect(() => {
    void fetchWorkspace()
  }, [fetchWorkspace])

  const activeTracks = portal?.projects?.length || services.filter((assignment) => assignment.status !== "cancelled").length
  const contractApproved = portal?.contractApproved ?? onboarding?.contractApproved ?? false
  const onboardingCompleted = portal?.onboardingCompleted ?? onboarding?.onboardingCompleted ?? false
  const acceptedInvitation = invitations.some((invitation) => invitation.status === "accepted")
  const activeWebhook = webhooks.some((webhook) => webhook.active)
  const openCrmLeads = crmLeads.filter((lead) => !["won", "lost"].includes(lead.status))
  const urgentCrmLeads = crmLeads.filter((lead) => lead.priority === "urgent")
  const openActions = crmLeads
    .flatMap((lead) => (lead.followUpActions || []).map((action) => ({ ...action, leadId: lead.id, leadName: lead.fullName })))
    .filter((action) => action.status === "open")
  const submittedTasks = onboarding?.tasks.filter((task) => task.status === "submitted") ?? []
  const rejectedTasks = onboarding?.tasks.filter((task) => task.status === "rejected") ?? []
  const pendingRequiredTasks = onboarding
    ? Math.max(onboarding.totalRequiredTasks - onboarding.completedRequiredTasks, 0)
    : 0
  const readinessItems = [
    contractApproved,
    onboardingCompleted,
    activeTracks > 0,
    acceptedInvitation,
    activeWebhook,
    openActions.length === 0,
    urgentCrmLeads.length === 0,
    rejectedTasks.length === 0,
  ]
  const readinessScore = Math.round((readinessItems.filter(Boolean).length / readinessItems.length) * 100)
  const activities = useMemo(
    () => buildActivities(id || "", services, invitations, webhooks, crmLeads, onboarding, portal),
    [crmLeads, id, invitations, onboarding, portal, services, webhooks]
  )

  async function refreshWorkspace() {
    try {
      setActionId("refresh")
      setActionError("")
      setNotice("")
      await fetchWorkspace(true)
      setNotice("Workspace refreshed.")
    } catch {
      setActionError("Could not refresh workspace.")
    } finally {
      setActionId("")
    }
  }

  async function generateOnboardingTasks() {
    if (!id) {
      return
    }

    try {
      setActionId("generate-onboarding")
      setActionError("")
      setNotice("")

      const response = await fetch(`/api/internal/onboarding/${id}`, {
        method: "POST",
      })
      const data = await response.json().catch(() => ({ error: "Unexpected onboarding generation response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not generate onboarding tasks.")
      }

      setOnboarding(data as OnboardingDashboard)
      await fetchWorkspace(true)
      setNotice("Onboarding tasks generated or reused.")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not generate onboarding tasks.")
    } finally {
      setActionId("")
    }
  }

  async function approveSubmittedTask(taskId: string) {
    try {
      setActionId(`approve:${taskId}`)
      setActionError("")
      setNotice("")

      const response = await fetch(`/api/internal/onboarding/tasks/${taskId}/approve`, {
        method: "PATCH",
      })
      const data = await response.json().catch(() => ({ error: "Unexpected approval response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not approve task.")
      }

      await fetchWorkspace(true)
      setNotice("Onboarding task approved.")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not approve task.")
    } finally {
      setActionId("")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 border border-white/10 bg-white/[0.03] p-6 text-white/60">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-300" />
          Loading client workspace command center...
        </div>
      </main>
    )
  }

  if (error || !client) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/clients" className="inline-flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to clients
          </Link>
          <div className="mt-6 flex gap-3 border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <h1 className="font-semibold">Could not load workspace</h1>
              <p className="mt-1 text-sm text-red-100/80">{error || "Client not found."}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <AdminWorkspaceNav active="workspace" clientId={client.id} className="mb-6" />

        <section className="border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">Admin command center</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{client.company || client.name}</h1>
              <p className="mt-3 text-white/45">{client.name} · {client.email} · {client.status}</p>
            </div>
            <div className="min-w-[240px] border border-white/10 bg-[#0b1220] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Readiness</p>
                <span className={readinessScore >= 80 ? "text-emerald-200" : readinessScore >= 55 ? "text-amber-200" : "text-red-200"}>
                  {readinessScore}%
                </span>
              </div>
              <div className="mt-4 h-2 bg-white/10">
                <div className="h-full bg-gradient-to-r from-blue-600 to-violet-600" style={{ width: `${readinessScore}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void refreshWorkspace()}
              disabled={actionId === "refresh"}
              className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/75 hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${actionId === "refresh" ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void generateOnboardingTasks()}
              disabled={actionId === "generate-onboarding"}
              className="inline-flex items-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${actionId === "generate-onboarding" ? "animate-spin" : ""}`} />
              Generate / reuse onboarding
            </button>
            <Link href={`/admin/onboarding/${client.id}`} className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:text-white">
              Open full onboarding
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {actionError && (
            <div className="mt-5 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {actionError}
            </div>
          )}

          {notice && (
            <div className="mt-5 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </div>
          )}

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <Metric label="Tracks" value={activeTracks} tone={activeTracks > 0 ? "positive" : "warning"} />
            <Metric label="Open leads" value={openCrmLeads.length} tone={openCrmLeads.length > 0 ? "neutral" : "positive"} />
            <Metric label="Open actions" value={openActions.length} tone={openActions.length > 0 ? "warning" : "positive"} />
            <Metric label="Tasks pending" value={pendingRequiredTasks} tone={pendingRequiredTasks > 0 ? "warning" : "positive"} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <section className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <h2 className="text-lg font-semibold">Readiness checklist</h2>
              </div>
              <div className="mt-4 space-y-3">
                <ReadinessItem label="Contract approved" ready={contractApproved} href={`/admin/onboarding/${client.id}`} />
                <ReadinessItem label="Onboarding completed" ready={onboardingCompleted} href={`/admin/onboarding/${client.id}`} />
                <ReadinessItem label="Service tracks exist" ready={activeTracks > 0} href={`/clients/${client.id}`} />
                <ReadinessItem label="Client access accepted" ready={acceptedInvitation} href={`/clients/${client.id}`} />
                <ReadinessItem label="CRM intake configured" ready={activeWebhook} href={`/clients/${client.id}`} />
                <ReadinessItem label="No open CRM actions" ready={openActions.length === 0} href={`/clients/${client.id}/crm`} />
                <ReadinessItem label="No urgent CRM leads" ready={urgentCrmLeads.length === 0} href={`/clients/${client.id}/crm`} />
                <ReadinessItem label="No rejected onboarding tasks" ready={rejectedTasks.length === 0} href={`/admin/onboarding/${client.id}`} />
              </div>
            </section>

            <section className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-blue-300" />
                <h2 className="text-lg font-semibold">Immediate admin queue</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {submittedTasks.length > 0 && (
                  <div className="border border-blue-500/20 bg-blue-500/10 p-4 text-blue-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {submittedTasks.length} submitted onboarding task{submittedTasks.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-xs text-blue-100/60">Approve simple submissions here, or open onboarding for full review and rejection feedback.</p>
                      </div>
                      <Link href={`/admin/onboarding/${client.id}`} className="shrink-0 text-xs font-semibold text-blue-100/80 hover:text-white">
                        Open
                      </Link>
                    </div>
                    <div className="mt-3 space-y-2">
                      {submittedTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between gap-3 border border-blue-300/15 bg-[#0b1220]/60 px-3 py-2">
                          <span className="line-clamp-1 text-xs text-blue-50">{task.title}</span>
                          <button
                            type="button"
                            onClick={() => void approveSubmittedTask(task.id)}
                            disabled={actionId === `approve:${task.id}`}
                            className="inline-flex shrink-0 items-center gap-1 border border-emerald-500/25 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {actionId === `approve:${task.id}` ? "Approving" : "Approve"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rejectedTasks.length > 0 && (
                  <Link href={`/admin/onboarding/${client.id}`} className="block border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-100 hover:text-white">
                    Check {rejectedTasks.length} rejected onboarding task{rejectedTasks.length === 1 ? "" : "s"}
                  </Link>
                )}
                {openActions.length > 0 && (
                  <Link href={`/clients/${client.id}/crm?lead=${openActions[0]?.leadId || ""}`} className="block border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100 hover:text-white">
                    Close {openActions.length} open CRM action{openActions.length === 1 ? "" : "s"}
                  </Link>
                )}
                {urgentCrmLeads.length > 0 && (
                  <Link href={`/clients/${client.id}/crm?lead=${urgentCrmLeads[0]?.id || ""}`} className="block border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-100 hover:text-white">
                    Handle {urgentCrmLeads.length} urgent CRM lead{urgentCrmLeads.length === 1 ? "" : "s"}
                  </Link>
                )}
                {submittedTasks.length === 0 && rejectedTasks.length === 0 && openActions.length === 0 && urgentCrmLeads.length === 0 && (
                  <p className="border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                    No immediate admin queue items.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-5 w-5 text-blue-300" />
                    <h2 className="text-lg font-semibold">Service project tracks</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Active operational tracks for this client. Open the onboarding workspace for materials and phase changes.
                  </p>
                </div>
                <Link href={`/admin/onboarding/${client.id}`} className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:text-white">
                  Manage tracks
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {portal?.projects?.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {portal.projects.map((project) => (
                    <div key={project.id} className="border border-white/10 bg-[#0b1220] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-blue-300">{serviceLabel(project.projectKey)}</p>
                          <h3 className="mt-2 font-semibold">{project.name}</h3>
                        </div>
                        <span className={`border px-2 py-1 text-xs ${phaseToneClass(project.currentPhase)}`}>
                          {project.currentPhase}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-white/45">
                        {(project.assets?.length ?? 0)} material item{(project.assets?.length ?? 0) === 1 ? "" : "s"}
                        {project.revisionPendingAt ? ` · revision pending ${formatDate(project.revisionPendingAt)}` : ""}
                      </p>
                      {project.latestClientFeedback && (
                        <p className="mt-3 border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">
                          {project.latestClientFeedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {services.map((assignment) => (
                    <div key={assignment.id} className="border border-white/10 bg-[#0b1220] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-blue-300">{assignment.service.category}</p>
                      <h3 className="mt-2 font-semibold">{assignment.service.name}</h3>
                      <p className="mt-2 text-sm text-white/45">Assigned service is {assignment.status.replaceAll("_", " ")}. Project track not loaded yet.</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 border border-dashed border-white/15 bg-[#0b1220] p-4 text-sm text-white/40">
                  No service assignments or project tracks exist yet.
                </p>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-violet-300" />
                  <h2 className="text-lg font-semibold">Onboarding review</h2>
                </div>
                {onboarding ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Metric label="Required" value={onboarding.totalRequiredTasks} />
                      <Metric label="Approved" value={onboarding.completedRequiredTasks} tone={onboardingCompleted ? "positive" : "neutral"} />
                      <Metric label="Submitted" value={onboarding.submittedTasks} tone={onboarding.submittedTasks > 0 ? "warning" : "neutral"} />
                      <Metric label="Rejected" value={onboarding.rejectedTasks} tone={onboarding.rejectedTasks > 0 ? "warning" : "positive"} />
                    </div>
                    <Link href={`/admin/onboarding/${client.id}`} className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:text-white">
                      Open onboarding
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <p className="mt-4 border border-dashed border-white/15 bg-[#0b1220] p-4 text-sm text-white/40">
                    Onboarding has not been generated or returned for this client yet.
                  </p>
                )}
              </div>

              <div className="border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-300" />
                  <h2 className="text-lg font-semibold">CRM control</h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric label="Total leads" value={crmLeads.length} />
                  <Metric label="Open leads" value={openCrmLeads.length} tone={openCrmLeads.length > 0 ? "neutral" : "positive"} />
                  <Metric label="Urgent" value={urgentCrmLeads.length} tone={urgentCrmLeads.length > 0 ? "warning" : "positive"} />
                  <Metric label="Actions" value={openActions.length} tone={openActions.length > 0 ? "warning" : "positive"} />
                </div>
                <Link href={`/clients/${client.id}/crm`} className="mt-4 inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:text-white">
                  Open CRM
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-300" />
                <h2 className="text-lg font-semibold">Recent workspace activity</h2>
              </div>
              {activities.length === 0 ? (
                <p className="mt-4 border border-dashed border-white/15 bg-[#0b1220] p-4 text-sm text-white/40">
                  No recent workspace activity yet.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {activities.map((activity) => {
                    const card = (
                      <div className={`h-full border px-4 py-3 text-sm ${statusToneClass(activity.tone)}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{activity.label}</p>
                            <p className="mt-2 line-clamp-2 text-white/85">{activity.detail}</p>
                          </div>
                          <span className="shrink-0 text-[11px] opacity-60">{formatDate(activity.timestamp)}</span>
                        </div>
                      </div>
                    )

                    return activity.href ? (
                      <Link key={activity.id} href={activity.href} className="block hover:opacity-90">
                        {card}
                      </Link>
                    ) : (
                      <div key={activity.id}>{card}</div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
