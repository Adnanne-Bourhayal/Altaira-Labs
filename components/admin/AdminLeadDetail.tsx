"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Check,
  FileText,
  RefreshCw,
  Send,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { AdminShell } from "@/components/admin/AdminShell"
import { LeadAssessmentFields } from "@/components/admin/LeadAssessmentFields"
import { ProvisioningPlanPanel } from "@/components/admin/ProvisioningPlanPanel"
import {
  LAUNCH_SERVICE_OPTIONS,
  LEAD_FORM_DEFINITIONS,
  leadFormDefinition,
  serviceLabel,
  type LeadFormKey,
} from "@/lib/lead-intake"
import { LEAD_STATUS_OPTIONS, type LeadStatus, statusLabel } from "@/lib/lead-status"
import { cn } from "@/lib/utils"

type Lead = {
  id: string
  fullName: string
  businessName: string
  email: string
  phone?: string
  industry?: string
  serviceInterest?: string
  goals?: string
  status: string
  createdAt: string
}

type Assessment = {
  id: string
  leadId: string
  formKey: LeadFormKey
  status: string
  responses: Record<string, string>
  recommendedServiceKeys: string[]
  qualificationSummary: string
  updatedAt: string
}

type InternalNote = {
  id: string
  content: string
  author: string
  createdAt: string
}

export function AdminLeadDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const leadId = params.id
  const [lead, setLead] = useState<Lead | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusBusy, setStatusBusy] = useState(false)
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [assessmentFormKey, setAssessmentFormKey] = useState<LeadFormKey>("general")
  const [assessmentResponses, setAssessmentResponses] = useState<Record<string, string>>({})
  const [assessmentBusy, setAssessmentBusy] = useState(false)
  const [assessmentError, setAssessmentError] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [noteBusy, setNoteBusy] = useState(false)
  const [noteError, setNoteError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [leadResponse, assessmentResponse, notesResponse] = await Promise.all([
        fetch(`/api/internal/leads/${leadId}`, { cache: "no-store" }),
        fetch(`/api/internal/leads/${leadId}/assessments`, { cache: "no-store" }),
        fetch(`/api/internal/leads/${leadId}/notes`, { cache: "no-store" }),
      ])

      if ([leadResponse, assessmentResponse, notesResponse].some((response) => response.status === 401)) {
        router.replace("/admin/login")
        return
      }

      const [leadData, assessmentData, notesData] = await Promise.all([
        leadResponse.json(),
        assessmentResponse.json(),
        notesResponse.json(),
      ])

      if (!leadResponse.ok) throw new Error(leadData?.message || leadData?.error || "Could not load lead")
      if (!assessmentResponse.ok) throw new Error(assessmentData?.message || assessmentData?.error || "Could not load assessments")
      if (!notesResponse.ok) throw new Error(notesData?.message || notesData?.error || "Could not load notes")

      const loadedAssessments = Array.isArray(assessmentData) ? assessmentData as Assessment[] : []
      setLead(leadData)
      setAssessments(loadedAssessments)
      setNotes(Array.isArray(notesData) ? notesData : [])

      const latest = loadedAssessments[0]
      const inferredForm = leadFormDefinition(leadData.serviceInterest || "")?.key || "general"
      setAssessmentFormKey(latest?.formKey || inferredForm)
      setAssessmentResponses(latest?.responses || {})
      if (latest?.recommendedServiceKeys?.length) {
        setSelectedServices(latest.recommendedServiceKeys)
      } else if (inferredForm !== "general") {
        setSelectedServices([inferredForm])
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load lead")
    } finally {
      setLoading(false)
    }
  }, [leadId, router])

  useEffect(() => {
    void load()
  }, [load])

  const activeAssessment = useMemo(
    () => assessments.find((assessment) => assessment.formKey === assessmentFormKey) || assessments[0],
    [assessmentFormKey, assessments]
  )
  const assessmentDefinition = leadFormDefinition(assessmentFormKey)!

  const updateStatus = async (status: LeadStatus) => {
    setStatusBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/internal/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not update status")
      setLead(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update status")
    } finally {
      setStatusBusy(false)
    }
  }

  const changeAssessmentForm = (key: LeadFormKey) => {
    setAssessmentFormKey(key)
    const existing = assessments.find((assessment) => assessment.formKey === key)
    setAssessmentResponses(existing?.responses || {})
    setAssessmentError("")
  }

  const saveAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAssessmentBusy(true)
    setAssessmentError("")
    try {
      const response = await fetch(`/api/internal/leads/${leadId}/assessments/${assessmentFormKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: assessmentResponses, status: "reviewed", schemaVersion: 2 }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected assessment response" }))
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not save assessment")
      setAssessments((current) => [data, ...current.filter((item) => item.id !== data.id)])
      setSelectedServices(data.recommendedServiceKeys || [])
      setLead((current) => current ? { ...current, status: current.status === "new" ? "qualified" : current.status } : current)
      if (lead?.status === "new") {
        await updateStatus("qualified")
      }
      setAssessmentOpen(false)
    } catch (caught) {
      setAssessmentError(caught instanceof Error ? caught.message : "Could not save assessment")
    } finally {
      setAssessmentBusy(false)
    }
  }

  const addNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNoteBusy(true)
    setNoteError("")
    try {
      const response = await fetch(`/api/internal/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected notes response" }))
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not add note")
      setNotes((current) => [data, ...current])
      setNoteContent("")
    } catch (caught) {
      setNoteError(caught instanceof Error ? caught.message : "Could not add note")
    } finally {
      setNoteBusy(false)
    }
  }

  if (loading) {
    return <AdminShell><CenteredState title="Loading lead" spin /></AdminShell>
  }

  if (error || !lead) {
    return (
      <AdminShell>
        <main className="px-4 py-12 md:px-8">
          <div className="mx-auto max-w-4xl border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-100">
            <h1 className="text-lg font-semibold">Could not open lead</h1>
            <p className="mt-2 text-sm">{error || "Lead not found"}</p>
            <button type="button" onClick={() => void load()} className="mt-5 border border-current px-4 py-2 text-sm font-medium">Retry</button>
          </div>
        </main>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <main className="px-4 py-10 md:px-8 md:py-12 xl:px-12">
        <div className="mx-auto max-w-[1320px]">
          <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-[#525252] hover:text-[#0f62fe] dark:text-[#c6c6c6]">
            <ArrowLeft className="h-4 w-4" />
            Lead inbox
          </Link>

          <header className="mt-8 flex flex-col justify-between gap-6 border-b border-[#c6c6c6] pb-7 dark:border-[#525252] md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">Lead record</p>
              <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{lead.businessName}</h1>
              <p className="mt-2 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">{lead.fullName} · {lead.email}</p>
            </div>
            <label className="w-full md:w-[210px]">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">Lead status</span>
              <select
                value={lead.status}
                disabled={statusBusy}
                onChange={(event) => void updateStatus(event.target.value as LeadStatus)}
                className="h-11 w-full border border-[#c6c6c6] bg-white px-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#262626]"
              >
                {LEAD_STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
          </header>

          <section className="grid border-b border-[#c6c6c6] dark:border-[#525252] md:grid-cols-3">
            <DataPoint label="Contact" value={lead.fullName} secondary={lead.phone || "No phone"} />
            <DataPoint label="Sector" value={lead.industry || "Not specified"} />
            <DataPoint label="Received" value={formatDate(lead.createdAt)} />
          </section>

          <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-7">
              <section className="border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
                <SectionHeader
                  eyebrow="Qualification"
                  title={activeAssessment ? leadFormDefinition(activeAssessment.formKey)?.shortTitle || activeAssessment.formKey : "No assessment yet"}
                  action={(
                    <button
                      type="button"
                      onClick={() => setAssessmentOpen((current) => !current)}
                      className="text-sm font-semibold text-[#0f62fe] hover:underline"
                    >
                      {assessmentOpen ? "Close" : activeAssessment ? "Review assessment" : "Add assessment"}
                    </button>
                  )}
                />

                {!assessmentOpen && activeAssessment && (
                  <div className="p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">Recommendation</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeAssessment.recommendedServiceKeys.length > 0
                        ? activeAssessment.recommendedServiceKeys.map((key) => (
                          <span key={key} className="border border-[#0f62fe] px-3 py-2 text-sm font-medium text-[#0f62fe]">{serviceLabel(key)}</span>
                        ))
                        : <span className="text-sm font-medium">Discovery review required</span>}
                    </div>
                    <p className="mt-5 text-sm leading-6 text-[#525252] dark:text-[#c6c6c6]">{activeAssessment.qualificationSummary}</p>
                  </div>
                )}

                {!assessmentOpen && !activeAssessment && (
                  <div className="p-6 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
                    This public lead has contact context only. Add a structured assessment before conversion.
                  </div>
                )}

                {assessmentOpen && (
                  <form onSubmit={saveAssessment} className="p-6">
                    <label className="block max-w-sm">
                      <FieldLabel label="Intake type" />
                      <select
                        value={assessmentFormKey}
                        onChange={(event) => changeAssessmentForm(event.target.value as LeadFormKey)}
                        className={inputClass}
                      >
                        {LEAD_FORM_DEFINITIONS.map((definition) => (
                          <option key={definition.key} value={definition.key}>{definition.shortTitle}</option>
                        ))}
                      </select>
                    </label>
                    <div className="mt-6">
                      <LeadAssessmentFields
                        definition={assessmentDefinition}
                        responses={assessmentResponses}
                        onChange={(key, value) => setAssessmentResponses((current) => ({ ...current, [key]: value }))}
                      />
                    </div>
                    {assessmentError && <InlineError message={assessmentError} />}
                    <div className="mt-7 flex justify-end">
                      <button disabled={assessmentBusy} className="h-11 bg-[#0f62fe] px-5 text-sm font-semibold text-white disabled:opacity-50">
                        {assessmentBusy ? "Saving..." : "Save assessment"}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <ProvisioningPlanPanel
                leadId={leadId}
                assessmentId={activeAssessment?.id}
                assessmentUpdatedAt={activeAssessment?.updatedAt}
              />

              <section className="border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
                <SectionHeader eyebrow="Context" title="Original request" />
                <div className="p-6">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#525252] dark:text-[#c6c6c6]">{lead.goals || "No additional message was supplied."}</p>
                  <dl className="mt-6 grid gap-4 border-t border-[#e0e0e0] pt-5 text-sm dark:border-[#393939] sm:grid-cols-2">
                    <div><dt className="text-[#6f6f6f]">Initial interest</dt><dd className="mt-1 font-medium">{lead.serviceInterest || "General enquiry"}</dd></div>
                    <div><dt className="text-[#6f6f6f]">Current status</dt><dd className="mt-1 font-medium">{statusLabel(lead.status)}</dd></div>
                  </dl>
                </div>
              </section>

              <section className="border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
                <SectionHeader eyebrow="Internal" title="Follow-up notes" />
                <div className="p-6">
                  <form onSubmit={addNote}>
                    <textarea
                      required
                      minLength={2}
                      rows={3}
                      value={noteContent}
                      onChange={(event) => setNoteContent(event.target.value)}
                      placeholder="Record the next useful fact or decision"
                      className={textareaClass}
                    />
                    {noteError && <InlineError message={noteError} />}
                    <div className="mt-3 flex justify-end">
                      <button disabled={noteBusy || noteContent.trim().length < 2} className="inline-flex h-10 items-center gap-2 bg-[#090b16] px-4 text-sm font-semibold text-white disabled:opacity-40">
                        <Send className="h-4 w-4" />
                        Add note
                      </button>
                    </div>
                  </form>
                  <div className="mt-6 divide-y divide-[#e0e0e0] border-t border-[#e0e0e0] dark:divide-[#393939] dark:border-[#393939]">
                    {notes.length === 0 && <p className="py-6 text-sm text-[#6f6f6f]">No internal notes yet.</p>}
                    {notes.map((note) => (
                      <article key={note.id} className="py-5">
                        <div className="flex items-center justify-between gap-4 text-xs text-[#6f6f6f]">
                          <span>{note.author || "Admin"}</span>
                          <time>{formatDate(note.createdAt)}</time>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{note.content}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <aside className="h-fit border border-[#20263a] bg-[#090b16] text-white xl:sticky xl:top-28">
              <div className="border-b border-white/10 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">Commercial review</p>
                <h2 className="mt-3 text-xl font-semibold">Confirm scope before payment</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Review the recommended services here. Client activation now runs only from an approved provisioning plan after payment confirmation.
                </p>
              </div>

              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Services</p>
                <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                  {LAUNCH_SERVICE_OPTIONS.filter((service) => selectedServices.includes(service.value)).map((service) => (
                    <div key={service.value} className="flex items-center gap-3 py-4">
                      <Check className="h-4 w-4 text-blue-300" />
                      <span className="text-sm font-medium">{service.label}</span>
                    </div>
                  ))}
                  {selectedServices.length === 0 && <p className="py-4 text-sm text-white/50">No service recommendation yet.</p>}
                </div>
                <p className="mt-4 text-xs leading-5 text-white/45">Change scope through the assessment and provisioning plan. This summary is read-only.</p>

                <div className="mt-6 border-l-2 border-[#0f62fe] bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/45">Activation sequence</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    {["Approve provisioning plan", "Create Stripe test payment", "Confirm payment", "Create client and workspace", "Send secure invitation"].map((item) => (
                      <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-300" />{item}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs leading-5 text-white/45">Provider resources remain dry-run and require separate activation.</p>
                </div>

                <div className="mt-6 border border-white/15 px-4 py-3 text-sm font-semibold text-white/60">
                  Direct conversion is closed. Approve the plan and confirm payment first.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </AdminShell>
  )
}

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="mb-2 block">
      <span className="text-sm font-medium">{label}</span>
      {help && <span className="mt-1 block text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{help}</span>}
    </span>
  )
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-[#e0e0e0] p-6 dark:border-[#393939]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      </div>
      {action}
    </header>
  )
}

function DataPoint({ label, value, secondary }: { label: string; value: string; secondary?: string }) {
  return (
    <div className="border-[#c6c6c6] py-5 md:border-r md:px-5 dark:border-[#525252]">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">{label}</dt>
      <dd className="mt-2 text-sm font-semibold">{value}</dd>
      {secondary && <dd className="mt-1 text-xs text-[#6f6f6f] dark:text-[#a8a8a8]">{secondary}</dd>}
    </div>
  )
}

function InlineError({ message, dark = false }: { message: string; dark?: boolean }) {
  return (
    <div className={cn(
      "mt-5 border-l-2 border-red-600 px-4 py-3 text-sm",
      dark ? "bg-red-950/30 text-red-200" : "bg-red-50 text-red-800 dark:bg-red-950/25 dark:text-red-200"
    )}>
      {message}
    </div>
  )
}

function CenteredState({ title, spin = false }: { title: string; spin?: boolean }) {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center p-8">
      <div className="text-center">
        {spin ? <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#0f62fe]" /> : <FileText className="mx-auto h-6 w-6 text-[#0f62fe]" />}
        <p className="mt-4 text-sm font-medium">{title}</p>
      </div>
    </main>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

const inputClass = "h-11 w-full border border-[#c6c6c6] bg-white px-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
const textareaClass = "w-full border border-[#c6c6c6] bg-white px-3 py-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
