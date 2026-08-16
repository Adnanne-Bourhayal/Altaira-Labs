"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Calendar, CheckCircle2, ListTodo, Mail, MessageSquare, Search, ShieldCheck, XCircle } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav"

type Client = {
  id: string
  name: string
  company: string
  email: string
  status: string
}

type ClientCrmLeadNote = {
  id: string
  leadId: string
  content: string
  authorUsername?: string | null
  authorRole?: string | null
  visibleToClient?: boolean
  createdAt?: string | null
}

type ClientCrmLeadEvent = {
  id: string
  leadId: string
  eventType: string
  actorRole: string
  actorUsername?: string | null
  fromStatus?: string | null
  toStatus?: string | null
  summary?: string | null
  createdAt?: string | null
}

type ClientCrmFollowUpAction = {
  id: string
  leadId: string
  clientId: string
  title: string
  description?: string | null
  status: "open" | "done" | "cancelled"
  ownerRole?: string | null
  createdByUsername?: string | null
  visibleToClient?: boolean
  dueAt?: string | null
  completedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type ClientCrmLead = {
  id: string
  clientId: string
  fullName: string
  email?: string | null
  phone?: string | null
  source?: string | null
  status: string
  priority: string
  sectorType: string
  sectorFields: Record<string, string>
  followUpActions: ClientCrmFollowUpAction[]
  notes: ClientCrmLeadNote[]
  events: ClientCrmLeadEvent[]
  createdAt?: string | null
  updatedAt?: string | null
}

type AdminCrmRecentActivity = {
  id: string
  leadId: string
  leadName: string
  label: string
  detail: string
  timestamp?: string | null
  visibleToClient: boolean
  tone: "action" | "note" | "event"
}

const crmStatuses = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "appointment_scheduled", label: "Appointment Scheduled" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
]

const crmPriorities = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

function statusLabel(status: string) {
  return crmStatuses.find((item) => item.value === status)?.label || status.replaceAll("_", " ")
}

function statusClass(status: string) {
  if (status === "won") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
  }

  if (status === "lost") {
    return "border-red-500/20 bg-red-500/10 text-red-300"
  }

  if (status === "appointment_scheduled" || status === "proposal_sent") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-300"
  }

  if (status === "contacted") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300"
  }

  return "border-white/10 bg-white/[0.04] text-white/60"
}

function priorityClass(priority: string) {
  if (priority === "urgent") {
    return "border-red-500/20 bg-red-500/10 text-red-300"
  }

  if (priority === "high") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300"
  }

  return "border-white/10 bg-white/[0.04] text-white/60"
}

function eventLabel(event: ClientCrmLeadEvent) {
  if (event.eventType === "lead_created") {
    return "Lead created"
  }

  if (event.eventType === "status_changed") {
    return `Status: ${statusLabel(event.fromStatus || "unknown")} -> ${statusLabel(event.toStatus || "unknown")}`
  }

  if (event.eventType === "note_added") {
    return "Note added"
  }

  return event.eventType.replaceAll("_", " ")
}

function isNoteClientVisible(note: ClientCrmLeadNote) {
  return note.authorRole === "client" || note.authorRole === "system" || note.visibleToClient === true
}

function isEventClientVisible(event: ClientCrmLeadEvent) {
  return event.actorRole === "client" || event.actorRole === "system"
}

function isActionClientVisible(action: ClientCrmFollowUpAction) {
  return action.ownerRole === "client" || action.ownerRole === "system" || action.visibleToClient === true
}

function visibilityLabel(visible: boolean) {
  return visible ? "Client-visible" : "Admin-only"
}

function visibilityClass(visible: boolean) {
  return visible
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-violet-500/20 bg-violet-500/10 text-violet-200"
}

function followUpStatusLabel(status: ClientCrmFollowUpAction["status"] | string) {
  switch (status) {
    case "done":
      return "Done"
    case "cancelled":
      return "Cancelled"
    default:
      return "Open"
  }
}

function followUpStatusClass(status: ClientCrmFollowUpAction["status"] | string) {
  switch (status) {
    case "done":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    case "cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-300"
    default:
      return "border-blue-500/20 bg-blue-500/10 text-blue-300"
  }
}

function buildAdminCrmRecentActivities(leads: ClientCrmLead[]) {
  return leads.flatMap((lead): AdminCrmRecentActivity[] => {
    const actionActivities = (lead.followUpActions || []).map((action) => ({
      id: `action:${action.id}`,
      leadId: lead.id,
      leadName: lead.fullName,
      label: `Action ${followUpStatusLabel(action.status).toLowerCase()}`,
      detail: action.title,
      timestamp: action.updatedAt || action.completedAt || action.createdAt,
      visibleToClient: isActionClientVisible(action),
      tone: "action" as const,
    }))

    const noteActivities = (lead.notes || []).map((note) => ({
      id: `note:${note.id}`,
      leadId: lead.id,
      leadName: lead.fullName,
      label: note.authorRole === "admin" ? "Admin note" : note.authorRole === "client" ? "Client note" : "System note",
      detail: note.content,
      timestamp: note.createdAt,
      visibleToClient: isNoteClientVisible(note),
      tone: "note" as const,
    }))

    const eventActivities = (lead.events || [])
      .filter((event) => event.eventType === "lead_created" || event.eventType === "status_changed")
      .map((event) => ({
        id: `event:${event.id}`,
        leadId: lead.id,
        leadName: lead.fullName,
        label: event.eventType === "status_changed" ? "Status update" : "Lead created",
        detail: eventLabel(event),
        timestamp: event.createdAt,
        visibleToClient: isEventClientVisible(event),
        tone: "event" as const,
      }))

    return [...actionActivities, ...noteActivities, ...eventActivities]
  })
    .filter((activity) => Boolean(activity.timestamp))
    .sort((first, second) => timestampMs(second.timestamp) - timestampMs(first.timestamp))
    .slice(0, 9)
}

function activityToneClass(tone: AdminCrmRecentActivity["tone"]) {
  switch (tone) {
    case "action":
      return "bg-violet-300"
    case "note":
      return "bg-blue-300"
    default:
      return "bg-emerald-300"
  }
}

function timestampMs(value?: string | null) {
  if (!value) {
    return 0
  }

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatAdminDate(value?: string | null) {
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

export default function AdminClientCrmPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id
  const requestedLeadId = searchParams.get("lead") || ""

  const [client, setClient] = useState<Client | null>(null)
  const [crmLeads, setCrmLeads] = useState<ClientCrmLead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [noteDraft, setNoteDraft] = useState("")
  const [shareNoteWithClient, setShareNoteWithClient] = useState(false)
  const [actionTitle, setActionTitle] = useState("")
  const [actionDescription, setActionDescription] = useState("")
  const [shareActionWithClient, setShareActionWithClient] = useState(false)
  const [actionId, setActionId] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchCrm = useCallback(async () => {
    if (!id) {
      return
    }

    try {
      setLoading(true)
      setError("")

      const [clientResponse, leadsResponse] = await Promise.all([
        fetch(`/api/internal/clients/${id}`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/crm-leads`, { cache: "no-store" }),
      ])

      if (clientResponse.status === 401 || leadsResponse.status === 401) {
        router.replace("/admin/login")
        return
      }

      const clientData = await clientResponse.json().catch(() => ({ error: "Unexpected client response" }))
      const leadsData = await leadsResponse.json().catch(() => ({ error: "Unexpected CRM response" }))

      if (!clientResponse.ok) {
        throw new Error(clientData?.message || clientData?.error || "Could not load client.")
      }

      if (!leadsResponse.ok) {
        throw new Error(leadsData?.message || leadsData?.error || "Could not load CRM leads.")
      }

      const leads = Array.isArray(leadsData) ? leadsData as ClientCrmLead[] : []
      const requestedLead = requestedLeadId ? leads.find((lead) => lead.id === requestedLeadId) : null
      setClient(clientData as Client)
      setCrmLeads(leads)
      setSelectedLeadId((current) => requestedLead?.id || current || leads[0]?.id || "")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not load CRM workspace.")
    } finally {
      setLoading(false)
    }
  }, [id, requestedLeadId, router])

  useEffect(() => {
    void fetchCrm()
  }, [fetchCrm])

  useEffect(() => {
    if (!requestedLeadId || crmLeads.length === 0) {
      return
    }

    const requestedLead = crmLeads.find((lead) => lead.id === requestedLeadId)
    if (requestedLead) {
      setSelectedLeadId(requestedLead.id)
    }
  }, [crmLeads, requestedLeadId])

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return crmLeads.filter((lead) => {
      const haystack = [
        lead.fullName,
        lead.email,
        lead.phone,
        lead.source,
        lead.sectorType,
        ...Object.values(lead.sectorFields || {}),
        ...lead.notes.map((note) => note.content),
        ...lead.notes.map((note) => visibilityLabel(isNoteClientVisible(note))),
        ...(lead.followUpActions || []).map((action) => action.title),
        ...(lead.followUpActions || []).map((action) => action.description),
        ...(lead.followUpActions || []).map((action) => action.status),
        ...(lead.followUpActions || []).map((action) => visibilityLabel(isActionClientVisible(action))),
        ...(lead.events || []).map((event) => event.summary || event.eventType),
        ...(lead.events || []).map((event) => visibilityLabel(isEventClientVisible(event))),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "open" && !["won", "lost"].includes(lead.status)) ||
        lead.status === statusFilter
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [crmLeads, priorityFilter, search, statusFilter])

  const selectedLead = crmLeads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0] || null
  const openCount = crmLeads.filter((lead) => !["won", "lost"].includes(lead.status)).length
  const urgentCount = crmLeads.filter((lead) => lead.priority === "urgent").length
  const wonCount = crmLeads.filter((lead) => lead.status === "won").length
  const openActionCount = crmLeads.reduce(
    (count, lead) => count + (lead.followUpActions || []).filter((action) => action.status === "open").length,
    0
  )
  const clientVisibleActionCount = crmLeads.reduce(
    (count, lead) => count + (lead.followUpActions || []).filter(isActionClientVisible).length,
    0
  )
  const recentActivities = useMemo(() => buildAdminCrmRecentActivities(crmLeads), [crmLeads])
  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "all" || priorityFilter !== "all"

  const updateLead = (updatedLead: ClientCrmLead) => {
    setCrmLeads((current) => current.map((lead) => lead.id === updatedLead.id ? updatedLead : lead))
    setSelectedLeadId(updatedLead.id)
  }

  function resetFilters() {
    setSearch("")
    setStatusFilter("all")
    setPriorityFilter("all")
  }

  async function updateLeadStatus(leadId: string, status: string) {
    try {
      setActionId(`status:${leadId}`)
      setNotice("")
      setError("")

      const response = await fetch(`/api/internal/clients/${id}/crm-leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected status response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update lead status.")
      }

      updateLead(data as ClientCrmLead)
      setNotice("CRM lead status updated.")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not update lead status.")
    } finally {
      setActionId("")
    }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedLead || noteDraft.trim().length < 2) {
      return
    }

    try {
      setActionId(`note:${selectedLead.id}`)
      setNotice("")
      setError("")

      const response = await fetch(`/api/internal/clients/${id}/crm-leads/${selectedLead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteDraft, visibleToClient: shareNoteWithClient }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected note response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not add CRM note.")
      }

      updateLead(data as ClientCrmLead)
      setNoteDraft("")
      setShareNoteWithClient(false)
      setNotice("CRM note added.")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not add CRM note.")
    } finally {
      setActionId("")
    }
  }

  async function addFollowUpAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedLead || actionTitle.trim().length < 3) {
      return
    }

    try {
      setActionId(`followup:${selectedLead.id}`)
      setNotice("")
      setError("")

      const response = await fetch(`/api/internal/clients/${id}/crm-leads/${selectedLead.id}/follow-up-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: actionTitle,
          description: actionDescription,
          visibleToClient: shareActionWithClient,
        }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected follow-up action response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not add follow-up action.")
      }

      updateLead(data as ClientCrmLead)
      setActionTitle("")
      setActionDescription("")
      setShareActionWithClient(false)
      setNotice("Follow-up action added.")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not add follow-up action.")
    } finally {
      setActionId("")
    }
  }

  async function updateFollowUpActionStatus(action: ClientCrmFollowUpAction, status: ClientCrmFollowUpAction["status"]) {
    if (!selectedLead) {
      return
    }

    try {
      setActionId(`followup-status:${action.id}`)
      setNotice("")
      setError("")

      const response = await fetch(`/api/internal/clients/${id}/crm-leads/${selectedLead.id}/follow-up-actions/${action.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected follow-up action status response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update follow-up action.")
      }

      updateLead(data as ClientCrmLead)
      setNotice("Follow-up action updated.")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not update follow-up action.")
    } finally {
      setActionId("")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 border border-white/10 bg-white/[0.03] p-6 text-white/60">
          <ShieldCheck className="h-5 w-5 animate-pulse" />
          Loading CRM workspace...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <AdminWorkspaceNav active="crm" clientId={id} className="mb-6" />

        {error && (
          <div className="mb-5 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-5 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        <section className="border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-violet-200">Admin CRM</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{client?.company || "Client CRM"}</h1>
              <p className="mt-2 text-white/50">
                {client?.name} · {client?.email} · {client?.status}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/35">Open</p>
                <p className="mt-1 text-xl font-semibold text-blue-200">{openCount}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/35">Urgent</p>
                <p className="mt-1 text-xl font-semibold text-red-200">{urgentCount}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/35">Won</p>
                <p className="mt-1 text-xl font-semibold text-emerald-200">{wonCount}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/35">Actions</p>
                <p className="mt-1 text-xl font-semibold text-violet-200">{openActionCount}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/35">Shared</p>
                <p className="mt-1 text-xl font-semibold text-blue-200">{clientVisibleActionCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-violet-200">Recent activity</p>
              <h2 className="mt-2 text-xl font-semibold">Latest CRM movement</h2>
              <p className="mt-1 text-sm text-white/45">
                Recent notes, follow-up actions and status movement for this client.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.16em] text-white/30">{recentActivities.length} shown</span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {recentActivities.length === 0 ? (
              <p className="border border-dashed border-white/15 bg-[#0b1220] p-4 text-sm text-white/40 lg:col-span-3">
                No CRM activity yet.
              </p>
            ) : recentActivities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => setSelectedLeadId(activity.leadId)}
                className="border border-white/10 bg-[#0b1220] p-4 text-left hover:border-violet-300/40"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 ${activityToneClass(activity.tone)}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                        {activity.label}
                      </span>
                      <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${visibilityClass(activity.visibleToClient)}`}>
                        {visibilityLabel(activity.visibleToClient)}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-white/85">{activity.leadName}</span>
                    <span className="mt-1 block line-clamp-2 text-sm leading-5 text-white/45">{activity.detail}</span>
                    <span className="mt-2 block text-xs text-white/30">{formatAdminDate(activity.timestamp)}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <aside className="border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 border border-white/10 bg-[#0b1220] px-3 py-2">
              <Search className="h-4 w-4 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads, notes, fields..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="all">All statuses</option>
                <option value="open">Open leads</option>
                {crmStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="all">All priorities</option>
                {crmPriorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {filteredLeads.length === 0 ? (
                <div className="border border-dashed border-white/15 bg-[#0b1220] p-5">
                  {crmLeads.length === 0 ? (
                    <>
                      <p className="text-sm font-semibold text-white/75">No CRM leads for this client yet.</p>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Leads created by the client workspace or connected CRM intake will appear here for admin review.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-white/75">No CRM leads match the current filters.</p>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Clear filters or adjust the search to inspect the full client pipeline.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        disabled={!hasActiveFilters}
                        className="mt-4 border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:border-violet-300/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Clear filters
                      </button>
                    </>
                  )}
                </div>
              ) : filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full border p-4 text-left transition ${selectedLead?.id === lead.id ? "border-violet-400/50 bg-violet-500/10" : "border-white/10 bg-[#0b1220] hover:border-white/25"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{lead.fullName}</h2>
                      <p className="mt-1 text-xs text-white/40">{lead.email || lead.phone || "No contact detail"}</p>
                    </div>
                    <span className={`border px-2 py-1 text-xs ${priorityClass(lead.priority)}`}>{lead.priority}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`border px-2 py-1 text-xs ${statusClass(lead.status)}`}>{statusLabel(lead.status)}</span>
                    <span className="border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/45">
                      {lead.source?.replaceAll("_", " ") || "unknown source"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-h-[620px] border border-white/10 bg-white/[0.03] p-6">
            {!selectedLead ? (
              <div className="flex h-full items-center justify-center text-white/40">
                Select a CRM lead to review.
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-violet-200">Lead detail</p>
                    <h2 className="mt-2 text-3xl font-semibold">{selectedLead.fullName}</h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/45">
                      {selectedLead.email && <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{selectedLead.email}</span>}
                      {selectedLead.phone && <span>{selectedLead.phone}</span>}
                      {selectedLead.createdAt && <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(selectedLead.createdAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  <select
                    value={selectedLead.status}
                    disabled={actionId === `status:${selectedLead.id}`}
                    onChange={(event) => void updateLeadStatus(selectedLead.id, event.target.value)}
                    className={`border px-3 py-2 text-sm outline-none disabled:opacity-50 ${statusClass(selectedLead.status)}`}
                  >
                    {crmStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="border border-white/10 bg-[#0b1220] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/35">Source</p>
                    <p className="mt-2 text-white/75">{selectedLead.source?.replaceAll("_", " ") || "unknown"}</p>
                  </div>
                  <div className="border border-white/10 bg-[#0b1220] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/35">Priority</p>
                    <p className="mt-2 text-white/75">{selectedLead.priority}</p>
                  </div>
                  <div className="border border-white/10 bg-[#0b1220] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/35">Sector</p>
                    <p className="mt-2 text-white/75">{selectedLead.sectorType.replaceAll("_", " ")}</p>
                  </div>
                </div>

                {Object.keys(selectedLead.sectorFields || {}).length > 0 && (
                  <div className="mt-5 border border-white/10 bg-[#0b1220] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/35">Sector fields</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {Object.entries(selectedLead.sectorFields).map(([key, value]) => (
                        <div key={key} className="border border-white/10 bg-white/[0.02] p-3 text-sm">
                          <p className="text-white/35">{key.replaceAll("_", " ")}</p>
                          <p className="mt-1 text-white/75">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  <div className="border border-white/10 bg-[#0b1220] p-4">
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-4 w-4 text-violet-200" />
                      <h3 className="font-semibold">Follow-up actions</h3>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(selectedLead.followUpActions || []).length === 0 ? (
                        <p className="text-sm text-white/40">No follow-up actions yet.</p>
                      ) : (selectedLead.followUpActions || []).map((action) => (
                        <div key={action.id} className="border border-white/10 bg-white/[0.02] p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white/80">{action.title}</p>
                              {action.description && <p className="mt-2 text-sm leading-6 text-white/50">{action.description}</p>}
                              <p className="mt-2 text-xs text-white/35">
                                {(action.createdByUsername || action.ownerRole || "system").replaceAll("_", " ")}
                                {" · "}
                                {action.updatedAt ? new Date(action.updatedAt).toLocaleString() : "Unknown time"}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${followUpStatusClass(action.status)}`}>
                                {followUpStatusLabel(action.status)}
                              </span>
                              <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${visibilityClass(isActionClientVisible(action))}`}>
                                {visibilityLabel(isActionClientVisible(action))}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {action.status !== "done" && (
                              <button
                                type="button"
                                disabled={actionId === `followup-status:${action.id}`}
                                onClick={() => void updateFollowUpActionStatus(action, "done")}
                                className="inline-flex items-center gap-2 border border-emerald-500/25 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Done
                              </button>
                            )}
                            {action.status !== "open" && (
                              <button
                                type="button"
                                disabled={actionId === `followup-status:${action.id}`}
                                onClick={() => void updateFollowUpActionStatus(action, "open")}
                                className="border border-blue-500/25 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/10 disabled:opacity-50"
                              >
                                Reopen
                              </button>
                            )}
                            {action.status !== "cancelled" && (
                              <button
                                type="button"
                                disabled={actionId === `followup-status:${action.id}`}
                                onClick={() => void updateFollowUpActionStatus(action, "cancelled")}
                                className="inline-flex items-center gap-2 border border-red-500/25 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={addFollowUpAction} className="mt-4 space-y-3">
                      <input
                        value={actionTitle}
                        onChange={(event) => setActionTitle(event.target.value)}
                        placeholder="Follow-up action title"
                        className="w-full border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/40"
                      />
                      <textarea
                        value={actionDescription}
                        onChange={(event) => setActionDescription(event.target.value)}
                        placeholder="Optional action context..."
                        rows={3}
                        className="w-full border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/40"
                      />
                      <label className="flex items-start gap-3 border border-white/10 bg-white/[0.02] p-3 text-sm text-white/60">
                        <input
                          type="checkbox"
                          checked={shareActionWithClient}
                          onChange={(event) => setShareActionWithClient(event.target.checked)}
                          className="mt-1 h-4 w-4 accent-violet-500"
                        />
                        <span>
                          <span className="block font-semibold text-white/80">Share this action with client</span>
                          <span className="mt-1 block text-xs leading-5 text-white/40">
                            Unchecked actions remain internal to admin CRM.
                          </span>
                        </span>
                      </label>
                      <button
                        disabled={actionId === `followup:${selectedLead.id}` || actionTitle.trim().length < 3}
                        className="inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white disabled:opacity-50"
                      >
                        <ListTodo className="h-4 w-4" />
                        {actionId === `followup:${selectedLead.id}` ? "Adding..." : "Add action"}
                      </button>
                    </form>
                  </div>

                  <div className="border border-white/10 bg-[#0b1220] p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-200" />
                      <h3 className="font-semibold">Notes</h3>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedLead.notes.length === 0 ? (
                        <p className="text-sm text-white/40">No notes yet.</p>
                      ) : selectedLead.notes.map((note) => (
                        <div key={note.id} className="border border-white/10 bg-white/[0.02] p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="text-sm text-white/70">{note.content}</p>
                            <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${visibilityClass(isNoteClientVisible(note))}`}>
                              {visibilityLabel(isNoteClientVisible(note))}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-white/35">
                            {(note.authorUsername || note.authorRole || "system").replaceAll("_", " ")} · {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Unknown time"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={addNote} className="mt-4 space-y-3">
                      <textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Add an admin CRM note..."
                        rows={3}
                        className="w-full border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/40"
                      />
                      <label className="flex items-start gap-3 border border-white/10 bg-white/[0.02] p-3 text-sm text-white/60">
                        <input
                          type="checkbox"
                          checked={shareNoteWithClient}
                          onChange={(event) => setShareNoteWithClient(event.target.checked)}
                          className="mt-1 h-4 w-4 accent-blue-500"
                        />
                        <span>
                          <span className="block font-semibold text-white/80">Share this note with client</span>
                          <span className="mt-1 block text-xs leading-5 text-white/40">
                            Leave unchecked for private admin notes. Shared notes appear in the client dashboard.
                          </span>
                        </span>
                      </label>
                      <button
                        disabled={actionId === `note:${selectedLead.id}` || noteDraft.trim().length < 2}
                        className="inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white disabled:opacity-50"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {actionId === `note:${selectedLead.id}` ? "Adding..." : "Add Note"}
                      </button>
                    </form>
                  </div>

                  <div className="border border-white/10 bg-[#0b1220] p-4">
                    <h3 className="font-semibold">Timeline</h3>
                    <div className="mt-4 space-y-3">
                      {(selectedLead.events || []).length === 0 ? (
                        <p className="text-sm text-white/40">No timeline events yet.</p>
                      ) : [...(selectedLead.events || [])].reverse().map((event) => (
                        <div key={event.id} className="border-l border-violet-400/50 pl-4">
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm font-semibold text-white/80">{eventLabel(event)}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${visibilityClass(isEventClientVisible(event))}`}>
                                {visibilityLabel(isEventClientVisible(event))}
                              </span>
                              <p className="text-xs text-white/30">
                                {event.createdAt ? new Date(event.createdAt).toLocaleString() : "Unknown time"}
                              </p>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-white/40">
                            {(event.actorUsername || event.actorRole || "system").replaceAll("_", " ")}
                            {event.summary ? ` · ${event.summary}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
