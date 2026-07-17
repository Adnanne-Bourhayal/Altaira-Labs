"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Building2, Mail, Briefcase, Calendar, FileText, RefreshCw, AlertCircle, UserPlus, MessageSquare, Send, Phone, Target } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { LEAD_STATUS_OPTIONS, type LeadStatus, isLeadStatus, statusBadgeClass, statusLabel } from "@/lib/lead-status"

type Lead = {
  id: string
  fullName: string
  businessName: string
  email: string
  phone?: string
  industry: string
  serviceInterest?: string
  goals: string
  status: string
  createdAt: string
}

type Client = {
  id: string
  name: string
  company: string
  email: string
  sourceLeadId: string | null
  status: string
}

type InternalNote = {
  id: string
  leadId: string | null
  content: string
  author: string
  createdAt: string
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [statusError, setStatusError] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [clientResult, setClientResult] = useState<Client | null>(null)
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientError, setClientError] = useState("")
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [notesError, setNotesError] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  const id = params?.id

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError("")
      setStatusError("")

      const response = await fetch(`/api/internal/leads/${id}`, {
        cache: "no-store",
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from lead service" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to fetch lead")
      }

      setLead(data)
    } catch (err) {
      console.error(err)
      setLoadError(err instanceof Error ? err.message : "Could not load lead details.")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  const fetchNotes = useCallback(async () => {
    try {
      setNotesError("")

      const response = await fetch(`/api/internal/leads/${id}/notes`, {
        cache: "no-store",
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from notes service" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to fetch notes")
      }

      setNotes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setNotesError(err instanceof Error ? err.message : "Could not load notes.")
    }
  }, [id, router])

  const updateStatus = async (status: LeadStatus) => {
    if (!isLeadStatus(status)) {
      setStatusError("Invalid status selected.")
      return
    }

    try {
      setUpdating(true)
      setStatusError("")
      setStatusMessage("")

      const response = await fetch(`/api/internal/leads/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const updatedLead = await response.json().catch(() => ({ error: "Unexpected response from lead service" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(updatedLead?.message || updatedLead?.error || "Failed to update status")
      }

      setLead(updatedLead as Lead)
      setStatusMessage(`Status updated to ${statusLabel(status)}.`)
    } catch (err) {
      console.error(err)
      setStatusError(err instanceof Error ? err.message : "Could not update lead status.")
    } finally {
      setUpdating(false)
    }
  }

  const createClientFromLead = async () => {
    try {
      setCreatingClient(true)
      setClientError("")

      const response = await fetch(`/api/internal/clients/from-lead/${id}`, {
        method: "POST",
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from client service" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not create client from lead")
      }

      setClientResult(data as Client)
    } catch (err) {
      console.error(err)
      setClientError(err instanceof Error ? err.message : "Could not create client from lead.")
    } finally {
      setCreatingClient(false)
    }
  }

  const addNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setAddingNote(true)
      setNotesError("")

      const response = await fetch(`/api/internal/leads/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: noteContent }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from notes service" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not add note")
      }

      setNotes((current) => [data as InternalNote, ...current])
      setNoteContent("")
    } catch (err) {
      console.error(err)
      setNotesError(err instanceof Error ? err.message : "Could not add note.")
    } finally {
      setAddingNote(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchLead()
      fetchNotes()
    }
  }, [fetchLead, fetchNotes, id])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
          Loading lead...
        </div>
      </main>
    )
  }

  if (loadError || !lead) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <Link href="/leads" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to leads
          </Link>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-red-200">Could not load lead</h2>
                  <p className="text-sm text-red-200/80 mt-1">{loadError || "Lead not found."}</p>
                </div>
              </div>
              <button
                onClick={fetchLead}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/leads" className="inline-flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to leads
          </Link>
          <Link href="/clients" className="text-white/45 hover:text-white">Clients</Link>
          <Link href="/admin/services" className="text-white/45 hover:text-white">Services</Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{lead.fullName}</h1>
              <p className="text-white/50 mt-2">{lead.businessName}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={createClientFromLead}
                disabled={creatingClient}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {creatingClient ? "Creating..." : "Create Client"}
              </button>

              <span className={`inline-flex px-3 py-1.5 rounded-full text-sm border ${statusBadgeClass(lead.status)}`}>
                {statusLabel(lead.status)}
              </span>

              {LEAD_STATUS_OPTIONS.map((status) => {
                const isActive = lead.status === status.value

                return (
                  <button
                    key={status.value}
                    onClick={() => updateStatus(status.value)}
                    disabled={updating || isActive}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${
                      isActive
                        ? "border-white/10 bg-white/[0.06] text-white/50"
                        : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08]"
                    }`}
                  >
                    {isActive ? "Current" : `Set ${status.label}`}
                  </button>
                )
              })}
            </div>
          </div>

          {(statusError || statusMessage) && (
            <div
              role={statusError ? "alert" : "status"}
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                statusError
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {statusError || statusMessage}
            </div>
          )}

          {(clientError || clientResult) && (
            <div
              role={clientError ? "alert" : "status"}
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                clientError
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-blue-500/20 bg-blue-500/10 text-blue-200"
              }`}
            >
              {clientError || (
                <>
                  Client record ready:{" "}
                  <Link href={`/clients/${clientResult?.id}`} className="font-semibold text-blue-100 hover:text-white">
                    open {clientResult?.company}
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Building2 className="w-4 h-4" />
                Business
              </div>
              <p className="text-white/90">{lead.businessName}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <p className="text-white/90 break-all">{lead.email}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Phone className="w-4 h-4" />
                Phone
              </div>
              <p className="text-white/90">{lead.phone || "-"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Briefcase className="w-4 h-4" />
                Context
              </div>
              <p className="text-white/90">{lead.industry || "-"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Target className="w-4 h-4" />
                Service / interest
              </div>
              <p className="text-white/90">{lead.serviceInterest || "-"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Calendar className="w-4 h-4" />
                Created
              </div>
              <p className="text-white/90">{new Date(lead.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
              <FileText className="w-4 h-4" />
              Goals
            </div>
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
              {lead.goals || "-"}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
              <MessageSquare className="w-4 h-4" />
              Internal Notes
            </div>

            {notesError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {notesError}
              </div>
            )}

            <form onSubmit={addNote} className="mb-5 flex flex-col gap-3">
              <textarea
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                rows={3}
                placeholder="Add an internal follow-up note..."
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <button
                disabled={addingNote || noteContent.trim().length < 2}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {addingNote ? "Adding..." : "Add Note"}
              </button>
            </form>

            {notes.length === 0 ? (
              <p className="text-white/40">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-white/80 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-white/35 mt-3">
                      {note.author} · {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
