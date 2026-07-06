"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft, BriefcaseBusiness, Calendar, FileText, Mail, MessageSquare, RefreshCw, Send, Wrench } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

type Client = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  sourceLeadId: string | null
  status: string
  createdAt: string
  updatedAt: string
}

type ServiceItem = {
  id: string
  name: string
  category: string
  description: string
  active: boolean
}

type ClientService = {
  id: string
  clientId: string
  service: ServiceItem
  status: string
  notes: string
  createdAt: string
  updatedAt: string
}

type InternalNote = {
  id: string
  clientId: string | null
  content: string
  author: string
  createdAt: string
}

const CLIENT_SERVICE_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

function statusClass(status: string) {
  if (status === "delivered") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
  }

  if (status === "in_progress") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-300"
  }

  if (status === "review") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300"
  }

  if (status === "cancelled") {
    return "border-red-500/20 bg-red-500/10 text-red-300"
  }

  return "border-white/10 bg-white/[0.04] text-white/60"
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [client, setClient] = useState<Client | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [clientServices, setClientServices] = useState<ClientService[]>([])
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [serviceNotes, setServiceNotes] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [assignmentError, setAssignmentError] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [addingNote, setAddingNote] = useState(false)
  const [noteError, setNoteError] = useState("")

  const fetchClientData = useCallback(async () => {
    if (!id) {
      return
    }

    try {
      setLoading(true)
      setError("")

      const [clientResponse, servicesResponse, assignedResponse, notesResponse] = await Promise.all([
        fetch(`/api/internal/clients/${id}`, { cache: "no-store" }),
        fetch("/api/internal/services", { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/services`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/notes`, { cache: "no-store" }),
      ])

      if ([clientResponse, servicesResponse, assignedResponse, notesResponse].some((response) => response.status === 401)) {
        router.replace("/login")
        return
      }

      const clientData = await clientResponse.json().catch(() => ({ error: "Unexpected client response" }))
      const servicesData = await servicesResponse.json().catch(() => ({ error: "Unexpected services response" }))
      const assignedData = await assignedResponse.json().catch(() => ({ error: "Unexpected assigned services response" }))
      const notesData = await notesResponse.json().catch(() => ({ error: "Unexpected notes response" }))

      if (!clientResponse.ok) {
        throw new Error(clientData?.message || clientData?.error || "Failed to fetch client")
      }

      if (!servicesResponse.ok) {
        throw new Error(servicesData?.message || servicesData?.error || "Failed to fetch services")
      }

      if (!assignedResponse.ok) {
        throw new Error(assignedData?.message || assignedData?.error || "Failed to fetch client services")
      }

      if (!notesResponse.ok) {
        throw new Error(notesData?.message || notesData?.error || "Failed to fetch notes")
      }

      setClient(clientData as Client)
      setServices(Array.isArray(servicesData) ? servicesData : [])
      setClientServices(Array.isArray(assignedData) ? assignedData : [])
      setNotes(Array.isArray(notesData) ? notesData : [])
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not load client.")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])

  const activeServices = useMemo(() => services.filter((service) => service.active), [services])

  const assignService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!serviceId) {
      setAssignmentError("Choose a service first.")
      return
    }

    try {
      setAssigning(true)
      setAssignmentError("")

      const response = await fetch(`/api/internal/clients/${id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, notes: serviceNotes }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected assignment response" }))

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not assign service")
      }

      setClientServices((current) => [data as ClientService, ...current])
      setServiceId("")
      setServiceNotes("")
    } catch (err) {
      console.error(err)
      setAssignmentError(err instanceof Error ? err.message : "Could not assign service.")
    } finally {
      setAssigning(false)
    }
  }

  const updateClientServiceStatus = async (assignmentId: string, status: string) => {
    const response = await fetch(`/api/internal/client-services/${assignmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })

    const data = await response.json().catch(() => ({ error: "Unexpected status response" }))

    if (response.status === 401) {
      router.replace("/login")
      return
    }

    if (!response.ok) {
      setAssignmentError(data?.message || data?.error || "Could not update service status")
      return
    }

    setClientServices((current) =>
      current.map((assignment) => assignment.id === assignmentId ? data as ClientService : assignment)
    )
  }

  const addNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setAddingNote(true)
      setNoteError("")

      const response = await fetch(`/api/internal/clients/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected note response" }))

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not add note")
      }

      setNotes((current) => [data as InternalNote, ...current])
      setNoteContent("")
    } catch (err) {
      console.error(err)
      setNoteError(err instanceof Error ? err.message : "Could not add note.")
    } finally {
      setAddingNote(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-6xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
          Loading client...
        </div>
      </main>
    )
  }

  if (error || !client) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <Link href="/clients" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to clients
          </Link>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300 flex gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <h2 className="font-semibold text-red-200">Could not load client</h2>
              <p className="text-sm text-red-200/80 mt-1">{error || "Client not found."}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/clients" className="inline-flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to clients
          </Link>
          <Link href="/leads" className="text-white/45 hover:text-white">Leads</Link>
          <Link href="/services" className="text-white/45 hover:text-white">Services</Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{client.name}</h1>
              <p className="text-white/50 mt-2">{client.company}</p>
            </div>
            <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
              {client.status}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <p className="text-white/90 break-all">{client.email}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Calendar className="w-4 h-4" />
                Created
              </div>
              <p className="text-white/90">{new Date(client.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {client.sourceLeadId && (
            <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
              <p className="text-sm text-blue-100/80">
                This client was created from a lead.{" "}
                <Link href={`/leads/${client.sourceLeadId}`} className="font-semibold text-blue-200 hover:text-white">
                  Open source lead
                </Link>
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2 mb-5">
                <BriefcaseBusiness className="w-5 h-5 text-blue-300" />
                <h2 className="text-xl font-semibold">Assigned Services</h2>
              </div>

              {assignmentError && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {assignmentError}
                </div>
              )}

              {clientServices.length === 0 ? (
                <p className="text-white/40">No services assigned yet.</p>
              ) : (
                <div className="space-y-4">
                  {clientServices.map((assignment) => (
                    <div key={assignment.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-semibold">{assignment.service.name}</h3>
                          <p className="text-sm text-white/45 mt-1">{assignment.service.category}</p>
                          {assignment.notes && (
                            <p className="text-sm text-white/65 mt-3 whitespace-pre-wrap">{assignment.notes}</p>
                          )}
                        </div>
                        <select
                          value={assignment.status}
                          onChange={(event) => updateClientServiceStatus(assignment.id, event.target.value)}
                          className={`rounded-xl border px-3 py-2 text-sm outline-none ${statusClass(assignment.status)}`}
                        >
                          {CLIENT_SERVICE_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="w-5 h-5 text-amber-300" />
                <h2 className="text-xl font-semibold">Internal Notes</h2>
              </div>

              {noteError && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {noteError}
                </div>
              )}

              <form onSubmit={addNote} className="mb-5 flex flex-col gap-3">
                <textarea
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  placeholder="Add an internal note for this client..."
                  rows={3}
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
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 h-fit">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-5 h-5 text-blue-300" />
              <h2 className="text-lg font-semibold">Assign Service</h2>
            </div>
            <p className="text-sm text-white/40 mb-5">
              Link this client to an Altaira Labs service and track delivery status.
            </p>

            <form onSubmit={assignService} className="space-y-3">
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white focus:outline-none focus:border-blue-500/40"
              >
                <option value="">Select service</option>
                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <textarea
                value={serviceNotes}
                onChange={(event) => setServiceNotes(event.target.value)}
                placeholder="Notes or scope for this service..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <button
                disabled={assigning}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Assign Service"}
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-white/45 text-sm mb-2">
                <FileText className="w-4 h-4" />
                Demo logic
              </div>
              <p className="text-sm text-white/45">
                A client can have one or more services. Each assignment has its own delivery status.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
