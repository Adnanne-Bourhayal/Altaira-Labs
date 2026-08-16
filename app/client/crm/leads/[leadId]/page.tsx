"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CalendarDays, CheckCircle2, ListTodo, Mail, Phone, RefreshCw, Save, XCircle } from "lucide-react"
import Logo from "@/components/Logo"

type ClientCrmLeadStatus = "new_lead" | "contacted" | "appointment_scheduled" | "proposal_sent" | "won" | "lost"
type ClientCrmLeadPriority = "low" | "normal" | "high" | "urgent"

type ClientCrmLeadNote = {
  id: string
  leadId: string
  content: string
  authorUsername?: string | null
  authorRole?: "client" | "admin" | "system" | null
  visibleToClient?: boolean
  createdAt?: string | null
}

type ClientCrmLeadEvent = {
  id: string
  leadId: string
  eventType: "lead_created" | "status_changed" | "note_added" | "follow_up_created" | "follow_up_status_changed"
  actorRole?: "client" | "admin" | "system" | null
  actorUsername?: string | null
  fromStatus?: ClientCrmLeadStatus | null
  toStatus?: ClientCrmLeadStatus | null
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
  ownerRole?: "client" | "admin" | "system" | null
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
  status: ClientCrmLeadStatus
  priority: ClientCrmLeadPriority
  sectorType: string
  sectorFields: Record<string, string>
  followUpActions: ClientCrmFollowUpAction[]
  notes: ClientCrmLeadNote[]
  events: ClientCrmLeadEvent[]
  createdAt?: string | null
  updatedAt?: string | null
}

const crmStatuses: Array<{ key: ClientCrmLeadStatus; label: string }> = [
  { key: "new_lead", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "appointment_scheduled", label: "Appointment" },
  { key: "proposal_sent", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
]

export default function ClientCrmLeadDetailPage() {
  const params = useParams<{ leadId: string }>()
  const router = useRouter()
  const leadId = params?.leadId

  const [lead, setLead] = useState<ClientCrmLead | null>(null)
  const [noteDraft, setNoteDraft] = useState("")
  const [actionTitle, setActionTitle] = useState("")
  const [actionDescription, setActionDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const loadLead = useCallback(async () => {
    if (!leadId) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const [response, accessResponse] = await Promise.all([
        fetch(`/api/client/crm/leads/${leadId}`, { cache: "no-store" }),
        fetch("/api/client/auth/me", { cache: "no-store" }),
      ])
      const data = await response.json().catch(() => ({ error: "Unexpected CRM lead response" }))
      const accessData = await accessResponse.json().catch(() => ({ error: "Unexpected client access response" }))

      if (response.status === 401 || accessResponse.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load CRM lead.")
      }

      if (!accessResponse.ok) {
        throw new Error(accessData?.message || accessData?.error || "Could not verify client access.")
      }

      setLead(data as ClientCrmLead)
      setCanEdit(Boolean(accessData?.canEdit))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load CRM lead.")
    } finally {
      setLoading(false)
    }
  }, [leadId, router])

  useEffect(() => {
    void loadLead()
  }, [loadLead])

  async function updateStatus(status: ClientCrmLeadStatus) {
    if (!lead) {
      return
    }

    setSaving(true)
    setNotice("")
    setError("")

    try {
      const response = await fetch(`/api/client/crm/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected CRM status response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update lead status.")
      }

      setLead(data as ClientCrmLead)
      setNotice("Lead status updated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update lead status.")
    } finally {
      setSaving(false)
    }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!lead || noteDraft.trim().length < 3) {
      return
    }

    setSaving(true)
    setNotice("")
    setError("")

    try {
      const response = await fetch(`/api/client/crm/leads/${lead.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: noteDraft }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected CRM note response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not save note.")
      }

      setLead(data as ClientCrmLead)
      setNoteDraft("")
      setNotice("Note saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note.")
    } finally {
      setSaving(false)
    }
  }

  async function addFollowUpAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!lead || actionTitle.trim().length < 3) {
      return
    }

    setSaving(true)
    setNotice("")
    setError("")

    try {
      const response = await fetch(`/api/client/crm/leads/${lead.id}/follow-up-actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: actionTitle,
          description: actionDescription,
        }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected CRM follow-up response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not save follow-up action.")
      }

      setLead(data as ClientCrmLead)
      setActionTitle("")
      setActionDescription("")
      setNotice("Follow-up action saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save follow-up action.")
    } finally {
      setSaving(false)
    }
  }

  async function updateFollowUpActionStatus(actionId: string, status: ClientCrmFollowUpAction["status"]) {
    if (!lead) {
      return
    }

    setSaving(true)
    setNotice("")
    setError("")

    try {
      const response = await fetch(`/api/client/crm/leads/${lead.id}/follow-up-actions/${actionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected CRM follow-up status response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update follow-up action.")
      }

      setLead(data as ClientCrmLead)
      setNotice("Follow-up action updated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update follow-up action.")
    } finally {
      setSaving(false)
    }
  }

  const workspaceNotes = useMemo(() => (lead?.notes ?? []).filter((note) => note.authorRole !== "admin"), [lead])
  const altairaNotes = useMemo(() => (lead?.notes ?? []).filter((note) => note.authorRole === "admin"), [lead])
  const latestEvent = lead?.events && lead.events.length > 0 ? lead.events[lead.events.length - 1] : null

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <Logo />
          <div className="mt-10 flex items-center gap-3 border border-white/10 bg-white/[0.03] p-6 text-white/55">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-300" />
            Loading CRM lead...
          </div>
        </div>
      </main>
    )
  }

  if (!lead) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <Logo />
          <div className="mt-10 border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {error || "CRM lead unavailable."}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <Link href="/client/dashboard" className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-sm font-semibold text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        {error && (
          <div className="mt-6 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {notice && (
          <div className="mt-6 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        {!canEdit && (
          <div className="mt-6 border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
            Read-only access. Lead activity is visible, but changes require a client editor.
          </div>
        )}

        <section className="mt-8 border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Client CRM lead</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{lead.fullName}</h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/50">
                {lead.email && <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{lead.email}</span>}
                {lead.phone && <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{lead.phone}</span>}
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(lead.createdAt)}</span>
              </div>
              {latestEvent && (
                <div className="mt-5 border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
                  Latest visible update: {crmEventLabel(latestEvent)}
                </div>
              )}
            </div>

            <div className="border border-white/10 bg-[#0b1220] p-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Status</span>
                <select
                  value={lead.status}
                  disabled={!canEdit || saving}
                  onChange={(event) => void updateStatus(event.target.value as ClientCrmLeadStatus)}
                  className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                >
                  {crmStatuses.map((status) => (
                    <option key={status.key} value={status.key}>{status.label}</option>
                  ))}
                </select>
              </label>
              <div className="mt-4 grid gap-3 text-sm">
                <InfoRow label="Priority" value={lead.priority} />
                <InfoRow label="Source" value={sourceLabel(lead.source)} />
                <InfoRow label="Sector" value={lead.sectorType.replaceAll("_", " ")} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <article className="border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-violet-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Follow-up actions</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Visible next steps for this lead. Admin-only internal actions stay hidden from this client workspace.
              </p>

              <div className="mt-5 grid gap-3">
                {(lead.followUpActions || []).length === 0 && (
                  <p className="border border-dashed border-white/10 p-4 text-sm text-white/35">No visible follow-up actions yet.</p>
                )}
                {(lead.followUpActions || []).map((action) => (
                  <div key={action.id} className="border border-white/10 bg-[#050810] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-white/85">{action.title}</p>
                        {action.description && <p className="mt-2 text-sm leading-6 text-white/50">{action.description}</p>}
                        <p className="mt-2 text-xs text-white/35">
                          {followUpStatusLabel(action.status)} · {formatDate(action.updatedAt || action.createdAt)}
                        </p>
                      </div>
                      <span className={`border px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${followUpStatusClass(action.status)}`}>
                        {followUpStatusLabel(action.status)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {action.status !== "done" && (
                        <button
                          type="button"
                          disabled={!canEdit || saving}
                          onClick={() => void updateFollowUpActionStatus(action.id, "done")}
                          className="inline-flex items-center gap-2 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark done
                        </button>
                      )}
                      {action.status !== "open" && (
                        <button
                          type="button"
                          disabled={!canEdit || saving}
                          onClick={() => void updateFollowUpActionStatus(action.id, "open")}
                          className="border border-blue-500/30 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/10 disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                      {action.status !== "cancelled" && (
                        <button
                          type="button"
                          disabled={!canEdit || saving}
                          onClick={() => void updateFollowUpActionStatus(action.id, "cancelled")}
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

              <form onSubmit={addFollowUpAction} className="mt-6 grid gap-3">
                <input
                  value={actionTitle}
                  onChange={(event) => setActionTitle(event.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="Next action title"
                  className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <textarea
                  value={actionDescription}
                  onChange={(event) => setActionDescription(event.target.value)}
                  disabled={!canEdit || saving}
                  rows={3}
                  placeholder="Optional context for this follow-up"
                  className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!canEdit || saving || actionTitle.trim().length < 3}
                  className="inline-flex items-center justify-center gap-2 border border-violet-500/40 bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ListTodo className="h-4 w-4" />
                  {saving ? "Saving..." : "Add follow-up action"}
                </button>
              </form>
            </article>

            <article className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Visible notes</p>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Altaira notes are shared by the team. Workspace notes are written by your business.
              </p>

              <div className="mt-5 grid gap-5">
                {altairaNotes.length > 0 && (
                  <NoteGroup title="Altaira notes" notes={altairaNotes} tone="altaira" />
                )}
                {workspaceNotes.length > 0 && (
                  <NoteGroup title="Your workspace notes" notes={workspaceNotes} tone="workspace" />
                )}
                {lead.notes.length === 0 && (
                  <p className="border border-dashed border-white/10 p-4 text-sm text-white/35">No visible notes yet.</p>
                )}
              </div>

              <form onSubmit={addNote} className="mt-6 grid gap-3">
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  disabled={!canEdit || saving}
                  rows={4}
                  placeholder="Add a workspace note for your team"
                  className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!canEdit || saving || noteDraft.trim().length < 3}
                  className="inline-flex items-center justify-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save workspace note"}
                </button>
              </form>
            </article>

            <article className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Workspace timeline</p>
              <div className="mt-5 grid gap-4">
                {lead.events.length === 0 && (
                  <p className="text-sm text-white/35">No visible activity yet.</p>
                )}
                {[...lead.events].reverse().map((event) => (
                  <div key={event.id} className="border-l border-blue-400/50 pl-4">
                    <p className="text-sm font-semibold text-white/80">{crmEventLabel(event)}</p>
                    <p className="mt-1 text-xs text-white/35">{formatDate(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="border border-white/10 bg-[#0b1220] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Sector context</p>
            <div className="mt-4 grid gap-3">
              {Object.entries(lead.sectorFields || {}).length === 0 && (
                <p className="text-sm text-white/35">No sector-specific context yet.</p>
              )}
              {Object.entries(lead.sectorFields || {}).map(([key, value]) => (
                <div key={key} className="border border-white/10 bg-[#050810] p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/35">{fieldLabel(key)}</p>
                  <p className="mt-2 text-sm text-white/75">{value}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

function NoteGroup({ title, notes, tone }: { title: string; notes: ClientCrmLeadNote[]; tone: "altaira" | "workspace" }) {
  return (
    <div>
      <p className={tone === "altaira" ? "text-xs font-semibold uppercase tracking-[0.14em] text-violet-300" : "text-xs font-semibold uppercase tracking-[0.14em] text-blue-300"}>
        {title}
      </p>
      <div className="mt-2 grid gap-3">
        {notes.map((note) => (
          <div key={note.id} className={tone === "altaira" ? "border border-violet-500/20 bg-violet-500/10 p-4" : "border border-white/10 bg-[#050810] p-4"}>
            <p className="text-sm leading-6 text-white/75">{note.content}</p>
            <p className="mt-2 text-xs text-white/35">{visibleNoteRoleLabel(note.authorRole)} · {formatDate(note.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-white/[0.02] px-3 py-2">
      <span className="text-white/35">{label}</span>
      <span className="text-right text-white/75">{value}</span>
    </div>
  )
}

function statusLabel(status: ClientCrmLeadStatus | string) {
  return crmStatuses.find((item) => item.key === status)?.label || status.replaceAll("_", " ")
}

function sourceLabel(source?: string | null) {
  if (!source) {
    return "Unknown source"
  }

  return source.replaceAll("_", " ")
}

function fieldLabel(key: string) {
  return key.replaceAll("_", " ")
}

function visibleNoteRoleLabel(role?: ClientCrmLeadNote["authorRole"]) {
  switch (role) {
    case "admin":
      return "Altaira note"
    case "system":
      return "System note"
    case "client":
      return "Workspace note"
    default:
      return "Visible note"
  }
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
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    case "cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-200"
    default:
      return "border-blue-500/20 bg-blue-500/10 text-blue-200"
  }
}

function crmEventLabel(event: ClientCrmLeadEvent) {
  if (event.eventType === "status_changed" && event.fromStatus && event.toStatus) {
    return `Status changed from ${statusLabel(event.fromStatus)} to ${statusLabel(event.toStatus)}`
  }

  if (event.summary) {
    return event.summary
  }

  switch (event.eventType) {
    case "lead_created":
      return "Lead added to your workspace"
    case "note_added":
      return "Workspace note added"
    default:
      return "Workspace activity updated"
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
