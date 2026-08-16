"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Check, FileText, LockKeyhole, Upload, X } from "lucide-react"
import Logo from "@/components/Logo"
import { uploadFileDirectly } from "@/lib/client-direct-upload"

type OnboardingTask = {
  id: string
  title: string
  description: string
  taskKey: string
  taskType: "signature" | "file_upload" | "preferences_form"
  status: "pending" | "submitted" | "approved" | "rejected"
  required: boolean
  critical: boolean
  serviceKey: string
  sectorType: string
  dataJson?: string
  fileMetadataJson?: string
  adminFeedback?: string
  submittedAt?: string
  approvedAt?: string
}

type OnboardingDashboard = {
  workspaceId: string
  workspaceName: string
  status: string
  onboardingCompleted: boolean
  contractSubmitted: boolean
  contractApproved: boolean
  totalRequiredTasks: number
  completedRequiredTasks: number
  submittedTasks: number
  rejectedTasks: number
  accessRole: "client_user" | "viewer"
  canEdit: boolean
  client: {
    company: string
    name: string
    email: string
    sectorType: string
  }
  tasks: OnboardingTask[]
}

type SubmissionState = {
  signatureFullName: string
  signatureDocumentId: string
  signatureConsent: boolean
  notes: string
  dynamicValues: Record<string, string | boolean>
  files: File[]
}

const emptySubmission: SubmissionState = {
  signatureFullName: "",
  signatureDocumentId: "",
  signatureConsent: false,
  notes: "",
  dynamicValues: {},
  files: [],
}

type PreferenceField = {
  key: string
  label: string
  helper?: string
  type: "text" | "textarea" | "checkbox"
}

const defaultPreferenceFields: PreferenceField[] = [
  {
    key: "notes",
    label: "Main notes / requirements",
    type: "textarea",
  },
  {
    key: "businessRules",
    label: "Business rules, opening hours, service rules or internal process",
    type: "textarea",
  },
]

const taskPreferenceFields: Record<string, PreferenceField[]> = {
  "business-profile": [
    { key: "business_summary", label: "What does the business do?", type: "textarea" },
    { key: "market", label: "Main market or city", type: "text" },
    { key: "current_manual_work", label: "Manual work you want to reduce", type: "textarea" },
  ],
  "sector-clinic-context": [
    { key: "clinic_type", label: "Clinic type", helper: "Dental, aesthetic, physiotherapy, psychology or mixed clinic.", type: "text" },
    { key: "patient_intake", label: "Current patient intake flow", type: "textarea" },
    { key: "follow_up_rules", label: "Follow-up and reminder rules", type: "textarea" },
  ],
  "sector-restaurant-context": [
    { key: "service_style", label: "Service style", helper: "Casual restaurant, fine dining, take-away, private events, etc.", type: "text" },
    { key: "table_flow", label: "Table flow and reservation pressure", type: "textarea" },
    { key: "menu_allergy_context", label: "Menu, allergy or private-event context", type: "textarea" },
  ],
  "sector-car-dealer-context": [
    { key: "inventory_type", label: "Vehicle inventory type", type: "text" },
    { key: "vehicle_photo_process", label: "Vehicle photo and showroom process", type: "textarea" },
    { key: "sales_follow_up", label: "Sales follow-up process", type: "textarea" },
  ],
  "sector-custom-context": [
    { key: "daily_operation", label: "Daily operation", type: "textarea" },
    { key: "client_journey", label: "Client journey", type: "textarea" },
    { key: "custom_workflow_need", label: "Workflow that needs custom design", type: "textarea" },
  ],
  "web-pages-content": [
    { key: "required_pages", label: "Required website pages", helper: "Home, services, sectors, contact, blog, legal pages, etc.", type: "textarea" },
    { key: "competitor_websites", label: "Competitor websites or references", type: "textarea" },
    { key: "seo_keywords", label: "SEO keywords or search terms", type: "textarea" },
    { key: "local_sme_offer", label: "Offer that must be clear online", helper: "Explain what your ideal visitor must understand in the first visit.", type: "textarea" },
  ],
  "web-domain-access-context": [
    { key: "domain_owner", label: "Domain owner or registrar", helper: "Example: OVH, GoDaddy, Google Domains, Squarespace.", type: "text" },
    { key: "hosting_context", label: "Current hosting or website platform", type: "textarea" },
    { key: "analytics_or_search_console", label: "Analytics, Search Console or tracking context", type: "textarea" },
    { key: "technical_contact", label: "Who controls technical access?", type: "textarea" },
  ],
  "booking-business-rules": [
    { key: "opening_days", label: "Opening days and hours", type: "textarea" },
    { key: "slot_duration", label: "Slot duration", helper: "For example: 30 minutes, 60 minutes, lunch/dinner turns.", type: "text" },
    { key: "capacity_rules", label: "Capacity and maximum occupancy rules", type: "textarea" },
    { key: "minimum_notice", label: "Minimum notice before booking", type: "text" },
  ],
  "booking-resources-spaces": [
    { key: "bookable_units", label: "Bookable units", helper: "Tables, rooms, doctors, cabinets, vehicles, advisors or other resources.", type: "textarea" },
    { key: "resource_constraints", label: "Resource constraints or exceptions", type: "textarea" },
  ],
  "booking-policies-cancellations": [
    { key: "cancellation_policy", label: "Cancellation policy", type: "textarea" },
    { key: "delay_policy", label: "Delay or courtesy margin policy", type: "textarea" },
    { key: "deposit_policy", label: "Deposit or payment policy", type: "textarea" },
  ],
  "booking-integrations": [
    { key: "google_calendar", label: "Google Calendar integration", type: "checkbox" },
    { key: "apple_calendar", label: "Apple Calendar integration", type: "checkbox" },
    { key: "stripe_deposits", label: "Stripe deposits or payments", type: "checkbox" },
    { key: "integration_notes", label: "Integration notes", type: "textarea" },
  ],
  "crm-service-catalogue": [
    { key: "service_catalogue", label: "Services/products sold by the business", type: "textarea" },
    { key: "base_prices", label: "Base prices or pricing ranges", type: "textarea" },
  ],
  "crm-pipeline-fields": [
    { key: "pipeline_stages", label: "Lead pipeline stages", helper: "New, contacted, appointment, proposal, won/lost, etc.", type: "textarea" },
    { key: "required_contact_fields", label: "Required contact fields", type: "textarea" },
    { key: "sector_specific_fields", label: "Sector-specific fields", helper: "Treatments, car models, guest count, etc.", type: "textarea" },
  ],
  "crm-web-form-integrations": [
    { key: "web_forms_to_connect", label: "Existing forms to connect", helper: "Contact forms, quote forms, booking requests, landing pages, etc.", type: "textarea" },
    { key: "lead_sources", label: "Lead sources or campaigns", type: "textarea" },
    { key: "intake_notifications", label: "Who should be notified when a lead arrives?", type: "textarea" },
    { key: "webhook_context", label: "Existing integration or webhook context", helper: "Do not paste API tokens or passwords here.", type: "textarea" },
  ],
  "automation-channel-connections": [
    { key: "email_channel", label: "Email sender/channel", type: "textarea" },
    { key: "whatsapp_channel", label: "WhatsApp Business context", type: "textarea" },
    { key: "sms_channel", label: "SMS provider context", type: "textarea" },
  ],
  "automation-brand-tone": [
    { key: "tone_of_voice", label: "Tone of voice", helper: "Formal, friendly, direct, multilingual, etc.", type: "textarea" },
    { key: "preferred_phrases", label: "Preferred phrases or wording", type: "textarea" },
    { key: "banned_phrases", label: "Words or style to avoid", type: "textarea" },
  ],
  "automation-goals-recipes": [
    { key: "reduce_no_shows", label: "Reduce no-shows", type: "checkbox" },
    { key: "google_reviews", label: "Request Google reviews", type: "checkbox" },
    { key: "birthday_loyalty", label: "Birthday or loyalty messages", type: "checkbox" },
    { key: "main_goal", label: "Main automation goal", type: "textarea" },
  ],
  "dashboard-roles-staff": [
    { key: "staff_roles", label: "Staff roles and organization chart", type: "textarea" },
    { key: "permission_expectations", label: "Permission expectations", helper: "Owner, manager, employee, read-only, etc.", type: "textarea" },
  ],
  "dashboard-operational-protocols": [
    { key: "daily_protocols", label: "Daily operating rules", type: "textarea" },
    { key: "exception_handling", label: "Exceptions or special cases", type: "textarea" },
    { key: "internal_notes_context", label: "Internal notes that should guide the team", type: "textarea" },
  ],
  "dashboard-kpis": [
    { key: "kpis", label: "KPIs to track", type: "textarea" },
    { key: "data_sources", label: "Data sources", helper: "Spreadsheets, CRM, booking exports, finance files, etc.", type: "textarea" },
    { key: "reporting_frequency", label: "Reporting frequency", type: "text" },
  ],
}

type ClientOnboardingWorkspaceProps = {
  embedded?: boolean
}

export default function ClientOnboardingWorkspace({ embedded = false }: ClientOnboardingWorkspaceProps) {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<OnboardingDashboard | null>(null)
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null)
  const [selectedServiceKey, setSelectedServiceKey] = useState("general")
  const [submission, setSubmission] = useState<SubmissionState>(emptySubmission)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const progress = useMemo(() => {
    if (!dashboard || dashboard.totalRequiredTasks === 0) {
      return 0
    }

    return Math.round((dashboard.completedRequiredTasks / dashboard.totalRequiredTasks) * 100)
  }, [dashboard])
  const serviceSummaries = useMemo(() => summarizeServiceTracks(dashboard?.tasks ?? []), [dashboard])
  const visibleTasks = useMemo(() => {
    if (!dashboard) {
      return []
    }

    return dashboard.tasks.filter((task) => task.serviceKey === selectedServiceKey)
  }, [dashboard, selectedServiceKey])

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/client/onboarding", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.error || "Could not load onboarding.")
      }

      setDashboard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load onboarding.")
    } finally {
      setLoading(false)
    }
  }

  function openTask(task: OnboardingTask) {
    if (!dashboard?.canEdit) {
      return
    }

    setSelectedTask(task)
    setSubmission(initialSubmissionForTask(task))
    setError("")
  }

  async function submitTask() {
    if (!selectedTask) {
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = selectedTask.taskType === "file_upload"
        ? await submitFileTask(selectedTask.id, submission)
        : await fetch(`/api/client/onboarding/tasks/${selectedTask.id}/submit`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildSubmissionBody(selectedTask, submission)),
          })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || "Could not submit task.")
      }

      setSelectedTask(null)
      setSubmission(emptySubmission)
      await loadDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit task.")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitFileTask(taskId: string, nextSubmission: SubmissionState) {
    let directUploadStarted = false
    let lastConfirmation: Response | null = null

    for (const file of nextSubmission.files) {
      const receipt = await uploadFileDirectly(
        file,
        `/api/client/onboarding/tasks/${taskId}/upload-url`,
      )

      if (!receipt) {
        if (directUploadStarted) {
          throw new Error("Secure storage became unavailable during the upload. Please try again.")
        }
        return submitFileTaskMultipart(taskId, nextSubmission)
      }

      directUploadStarted = true
      lastConfirmation = await fetch(`/api/client/onboarding/tasks/${taskId}/files/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...receipt, notes: nextSubmission.notes }),
      })

      if (!lastConfirmation.ok) {
        return lastConfirmation
      }
    }

    if (!lastConfirmation) {
      throw new Error("Choose at least one file before submitting this task.")
    }

    return lastConfirmation
  }

  function submitFileTaskMultipart(taskId: string, nextSubmission: SubmissionState) {
    const formData = new FormData()

    nextSubmission.files.forEach((file) => {
      formData.append("files", file)
    })
    formData.append("notes", nextSubmission.notes)

    return fetch(`/api/client/onboarding/tasks/${taskId}/files`, {
      method: "POST",
      body: formData,
    })
  }

  if (loading) {
    if (embedded) {
      return (
        <div className="border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Loading onboarding...
        </div>
      )
    }

    return (
      <main className="min-h-screen bg-white text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="border border-slate-200 px-8 py-6 text-sm text-slate-600">Loading onboarding workspace...</div>
        </div>
      </main>
    )
  }

  if (!dashboard) {
    if (embedded) {
      return (
        <div className="border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error || "Onboarding unavailable."}
        </div>
      )
    }

    return (
      <main className="min-h-screen bg-white text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="border border-red-200 bg-red-50 px-8 py-6 text-sm text-red-700">{error || "Onboarding unavailable."}</div>
        </div>
      </main>
    )
  }

  if (embedded) {
    const selectedSummary = serviceSummaries.find((summary) => summary.serviceKey === selectedServiceKey)
    const selectedRequired = visibleTasks.filter((task) => task.required)
    const selectedApproved = selectedRequired.filter((task) => task.status === "approved").length
    const selectedProgress = selectedRequired.length === 0
      ? 0
      : Math.round((selectedApproved / selectedRequired.length) * 100)

    return (
      <section className="grid gap-6 text-slate-950">
        <div className="grid gap-5 border border-slate-200 bg-white p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Onboarding</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Complete one service at a time</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Open only the checklist you need. Submitted items are reviewed by Altaira Labs before they unlock delivery work.
            </p>
          </div>
          <div className="min-w-[190px] border-l-2 border-blue-600 pl-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>Overall progress</span>
              <span className="text-blue-700">{progress}%</span>
            </div>
            <div className="mt-3 h-1.5 bg-slate-200">
              <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!dashboard.canEdit && (
          <div className="border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
            Read-only access. Only a client editor can submit onboarding tasks.
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 bg-white">
          <div className="flex min-w-max">
            <button
              type="button"
              onClick={() => setSelectedServiceKey("general")}
              className={`border-r border-slate-200 px-5 py-4 text-sm font-semibold transition ${
                selectedServiceKey === "general"
                  ? "border-b-2 border-b-blue-600 bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              General
            </button>
            {serviceSummaries.map((summary) => (
              <button
                key={summary.serviceKey}
                type="button"
                onClick={() => setSelectedServiceKey(summary.serviceKey)}
                className={`border-r border-slate-200 px-5 py-4 text-sm font-semibold transition ${
                  selectedServiceKey === summary.serviceKey
                    ? "border-b-2 border-b-blue-600 bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {summary.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              {selectedServiceKey === "general" ? "Workspace access" : selectedSummary?.label}
            </p>
            <h3 className="mt-3 text-lg font-semibold">
              {selectedServiceKey === "general"
                ? "Business and agreement"
                : selectedSummary?.guide.heading}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {selectedServiceKey === "general"
                ? "Confirm the shared business information and agreement needed across the workspace."
                : selectedSummary?.guide.description}
            </p>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Approved</span>
                <span className="font-semibold text-blue-700">{selectedApproved}/{selectedRequired.length}</span>
              </div>
              <div className="mt-3 h-1.5 bg-slate-200">
                <div className="h-full bg-blue-600" style={{ width: `${selectedProgress}%` }} />
              </div>
            </div>

            {!dashboard.contractApproved && selectedServiceKey === "general" && (
              <div className="mt-5 border-l-2 border-blue-600 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
                Contract approval is required before delivery actions open.
              </div>
            )}
          </aside>

          <div className="grid content-start gap-3">
            {visibleTasks.length === 0 ? (
              <div className="border border-slate-200 bg-white px-6 py-12 text-center">
                <p className="font-semibold text-slate-900">No checklist items in this section</p>
                <p className="mt-2 text-sm text-slate-500">Nothing is required here right now.</p>
              </div>
            ) : visibleTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task)}
                disabled={!dashboard.canEdit}
                className="group grid gap-4 border border-slate-200 bg-white p-5 text-left transition enabled:hover:border-blue-500 enabled:hover:bg-slate-50 disabled:cursor-default sm:grid-cols-[auto_1fr_auto]"
              >
                <div className="grid h-11 w-11 place-items-center border border-slate-200 bg-slate-50 text-blue-700">
                  {task.taskType === "signature" && <FileText className="h-5 w-5" />}
                  {task.taskType === "file_upload" && <Upload className="h-5 w-5" />}
                  {task.taskType === "preferences_form" && <AlertCircle className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{task.title}</h3>
                    {task.critical && (
                      <span className="border border-blue-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                  {task.adminFeedback && (
                    <p className="mt-3 border-l-2 border-red-500 pl-3 text-sm text-red-700">
                      Admin feedback: {task.adminFeedback}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedTask && (
          <TaskModal
            task={selectedTask}
            submission={submission}
            setSubmission={setSubmission}
            submitting={submitting}
            error={error}
            onClose={() => setSelectedTask(null)}
            onSubmit={submitTask}
          />
        )}
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-[#050814] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => router.push("/client/login")}
            className="border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-400"
          >
            Client Area
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="min-w-0 border border-slate-200 bg-slate-50 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Client onboarding</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">{dashboard.client.company}</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Complete the required onboarding tasks so Altaira Labs can start the project with the right legal,
              brand and business information.
            </p>

            <div className="mt-8 border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">Approved progress</span>
                <span className="font-semibold text-blue-700">{progress}%</span>
              </div>
              <div className="mt-3 h-2 bg-slate-200">
                <div className="h-full bg-gradient-to-r from-blue-600 to-violet-600" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-1 text-center text-xs text-slate-600 sm:gap-3">
                <Metric label="Required" value={dashboard.totalRequiredTasks} />
                <Metric label="Submitted" value={dashboard.submittedTasks} />
                <Metric label="Rejected" value={dashboard.rejectedTasks} />
              </div>
            </div>

            {!dashboard.contractApproved && (
              <div className="mt-6 border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <LockKeyhole className="h-4 w-4" />
                  Contract gate active
                </div>
                <p>General dashboard access remains blocked until the critical contract task is approved.</p>
              </div>
            )}

            <div className="mt-6 border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">How this works</p>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                <p>Each contracted service has its own onboarding checklist, review cycle and project track.</p>
                <p>Submit the requested evidence first. Altaira Labs reviews it, approves what is clear and sends feedback on anything that needs correction.</p>
                <p>Once the critical signatures are approved, the private service dashboard can open for project follow-up.</p>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            {error && (
              <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!dashboard.canEdit && (
              <div className="mb-5 border border-violet-200 bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-900">
                Read-only access. You can review this workspace, but only a client editor can submit onboarding tasks.
              </div>
            )}

            {serviceSummaries.length > 0 && (
              <div className="mb-6 border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Service onboarding tracks</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">What each service needs before execution</h2>
                  </div>
                  <span className="text-sm text-slate-500">
                    {serviceSummaries.length} active {serviceSummaries.length === 1 ? "track" : "tracks"}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {serviceSummaries.map((summary) => (
                    <ServiceTrackSummary key={summary.serviceKey} summary={summary} />
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {dashboard.tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openTask(task)}
                  disabled={!dashboard.canEdit}
                  className="group grid gap-4 border border-slate-200 bg-white p-5 text-left transition enabled:hover:border-blue-500 enabled:hover:bg-slate-50 disabled:cursor-default md:grid-cols-[auto_1fr_auto]"
                >
                  <div className="grid h-12 w-12 place-items-center border border-slate-200 bg-slate-50 text-blue-700">
                    {task.taskType === "signature" && <FileText className="h-5 w-5" />}
                    {task.taskType === "file_upload" && <Upload className="h-5 w-5" />}
                    {task.taskType === "preferences_form" && <AlertCircle className="h-5 w-5" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{task.title}</h2>
                      {task.critical && <span className="border border-blue-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Critical</span>}
                      {task.required && <span className="border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Required</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {serviceLabel(task.serviceKey)}
                      </span>
                      <span className="text-sm leading-6 text-slate-600">{task.description}</span>
                    </div>
                    {task.adminFeedback && (
                      <p className="mt-3 border-l-2 border-red-500 pl-3 text-sm text-red-700">Admin feedback: {task.adminFeedback}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={task.status} />
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          submission={submission}
          setSubmission={setSubmission}
          submitting={submitting}
          error={error}
          onClose={() => setSelectedTask(null)}
          onSubmit={submitTask}
        />
      )}
    </main>
  )
}

type ServiceTrackSummaryData = {
  serviceKey: string
  label: string
  total: number
  approved: number
  submitted: number
  rejected: number
  criticalOpen: number
  progress: number
  guide: ReturnType<typeof serviceOnboardingGuide>
}

function ServiceTrackSummary({ summary }: { summary: ServiceTrackSummaryData }) {
  const locked = summary.criticalOpen > 0

  return (
    <div className="border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{summary.label}</p>
          <h3 className="mt-2 font-semibold text-slate-950">{summary.guide.heading}</h3>
        </div>
        <span className={`border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
          locked ? "border-blue-200 bg-blue-50 text-blue-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {locked ? "Gate active" : "Ready path"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{summary.guide.description}</p>

      <div className="mt-4 h-2 bg-slate-200">
        <div className="h-full bg-gradient-to-r from-blue-600 to-violet-600" style={{ width: `${summary.progress}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[10px] uppercase text-slate-500 sm:grid-cols-4 sm:text-[11px]">
        <ServiceTrackMetric label="Tasks" value={summary.total} />
        <ServiceTrackMetric label="Approved" value={summary.approved} />
        <ServiceTrackMetric label="Submitted" value={summary.submitted} />
        <ServiceTrackMetric label="Rejected" value={summary.rejected} />
      </div>

      <div className="mt-4 border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">Unlocks:</span> {summary.guide.unlocks}
      </div>
    </div>
  )
}

function ServiceTrackMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 border border-slate-200 bg-white px-2 py-2">
      <div className="text-base font-semibold text-slate-950">{value}</div>
      <div className="mt-1">{label}</div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 border border-slate-200 bg-white px-1 py-3 sm:px-2">
      <div className="text-lg font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-[10px] uppercase leading-4">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: OnboardingTask["status"] }) {
  const styles = {
    pending: "border-slate-300 text-slate-600",
    submitted: "border-blue-300 bg-blue-50 text-blue-700",
    approved: "border-emerald-300 bg-emerald-50 text-emerald-700",
    rejected: "border-red-300 bg-red-50 text-red-700",
  }

  return (
    <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styles[status]}`}>
      {status}
    </span>
  )
}

function TaskModal({
  task,
  submission,
  setSubmission,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  task: OnboardingTask
  submission: SubmissionState
  setSubmission: (submission: SubmissionState) => void
  submitting: boolean
  error: string
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-slate-300 bg-white text-slate-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">{task.taskType.replace("_", " ")}</p>
            <h2 className="mt-2 text-2xl font-semibold">{task.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center border border-slate-200 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6">
          <p className="text-sm leading-6 text-slate-600">{task.description}</p>

          {task.taskType === "signature" && (
            <SignatureFields submission={submission} setSubmission={setSubmission} />
          )}

          {task.taskType === "file_upload" && (
            <FileFields submission={submission} setSubmission={setSubmission} />
          )}

          {task.taskType === "preferences_form" && (
            <PreferenceFields task={task} submission={submission} setSubmission={setSubmission} />
          )}

          {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit task"}
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignatureFields({ submission, setSubmission }: FieldProps) {
  return (
    <div className="grid gap-5">
      <div className="border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Service agreement preview</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This modal records written signature evidence. A configured contract PDF can be stamped by the backend;
          otherwise the backend generates a signed audit PDF receipt.
        </p>
      </div>
      <TextInput label="Full legal name" value={submission.signatureFullName} onChange={(value) => setSubmission({ ...submission, signatureFullName: value })} />
      <TextInput label="Document ID (DNI/CIF/NIE)" value={submission.signatureDocumentId} onChange={(value) => setSubmission({ ...submission, signatureDocumentId: value })} />
      <label className="flex items-start gap-3 border border-slate-200 p-4 text-sm leading-6">
        <input
          type="checkbox"
          checked={submission.signatureConsent}
          onChange={(event) => setSubmission({ ...submission, signatureConsent: event.target.checked })}
          className="mt-1"
        />
        <span>I confirm that I have reviewed the service agreement and accept this written signature record.</span>
      </label>
    </div>
  )
}

function FileFields({ submission, setSubmission }: FieldProps) {
  return (
    <div className="grid gap-4">
      <label className="grid cursor-pointer place-items-center border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-blue-500">
        <Upload className="mb-3 h-7 w-7 text-blue-700" />
        <span className="text-sm font-semibold text-slate-800">Drop files here or select them</span>
        <span className="mt-2 text-xs text-slate-500">Upload brand, content or legal assets for admin review.</span>
        <input
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files || [])
            setSubmission({ ...submission, files })
          }}
        />
      </label>
      {submission.files.length > 0 && (
        <div className="border border-slate-200">
          {submission.files.map((file) => (
            <div key={`${file.name}-${file.size}`} className="flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <span>{file.name}</span>
              <span className="text-slate-500">{Math.round(file.size / 1024)} KB</span>
            </div>
          ))}
        </div>
      )}
      <TextArea label="Notes about these files" value={submission.notes} onChange={(value) => setSubmission({ ...submission, notes: value })} />
    </div>
  )
}

function PreferenceFields({ task, submission, setSubmission }: FieldProps & { task: OnboardingTask }) {
  const fields = fieldsForTask(task)

  return (
    <div className="grid gap-4">
      <div className="border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-900">{serviceLabel(task.serviceKey)}</span>
        {" "}
        onboarding data is saved as structured JSON so the admin can review it and turn it into project instructions.
      </div>

      {fields.map((field) => (
        <DynamicPreferenceField
          key={field.key}
          field={field}
          value={submission.dynamicValues[field.key]}
          onChange={(value) => setSubmission({
            ...submission,
            dynamicValues: {
              ...submission.dynamicValues,
              [field.key]: value,
            },
          })}
        />
      ))}
    </div>
  )
}

type FieldProps = {
  submission: SubmissionState
  setSubmission: (submission: SubmissionState) => void
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700"
      />
    </label>
  )
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700"
      />
    </label>
  )
}

function DynamicPreferenceField({
  field,
  value,
  onChange,
}: {
  field: PreferenceField
  value: string | boolean | undefined
  onChange: (value: string | boolean) => void
}) {
  if (field.type === "checkbox") {
    return (
      <label className="flex items-start gap-3 border border-slate-200 p-4 text-sm leading-6">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-semibold text-slate-800">{field.label}</span>
          {field.helper && <span className="mt-1 block text-slate-500">{field.helper}</span>}
        </span>
      </label>
    )
  }

  if (field.type === "textarea") {
    return (
      <div className="grid gap-2">
        <TextArea label={field.label} value={typeof value === "string" ? value : ""} onChange={onChange} />
        {field.helper && <p className="-mt-1 text-xs leading-5 text-slate-500">{field.helper}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <TextInput label={field.label} value={typeof value === "string" ? value : ""} onChange={onChange} />
      {field.helper && <p className="-mt-1 text-xs leading-5 text-slate-500">{field.helper}</p>}
    </div>
  )
}

function buildSubmissionBody(task: OnboardingTask, submission: SubmissionState) {
  if (task.taskType === "signature") {
    return {
      signatureFullName: submission.signatureFullName,
      signatureDocumentId: submission.signatureDocumentId,
      signatureConsent: submission.signatureConsent,
    }
  }

  if (task.taskType === "file_upload") {
    return {
      files: submission.files,
      data: {
        notes: submission.notes,
      },
    }
  }

  return {
    data: {
      ...submission.dynamicValues,
      taskKey: task.taskKey,
      serviceKey: task.serviceKey,
      sectorType: task.sectorType,
    },
  }
}

function initialSubmissionForTask(task: OnboardingTask): SubmissionState {
  return {
    ...emptySubmission,
    dynamicValues: parseDynamicValues(task.dataJson),
  }
}

function parseDynamicValues(dataJson?: string) {
  if (!dataJson) {
    return {}
  }

  try {
    const parsed = JSON.parse(dataJson)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "string" || typeof value === "boolean")
    ) as Record<string, string | boolean>
  } catch {
    return {}
  }
}

function fieldsForTask(task: OnboardingTask) {
  return taskPreferenceFields[task.taskKey] ?? defaultPreferenceFields
}

function summarizeServiceTracks(tasks: OnboardingTask[]): ServiceTrackSummaryData[] {
  const serviceTasks = tasks.filter((task) => task.serviceKey !== "general")
  const grouped = serviceTasks.reduce<Record<string, OnboardingTask[]>>((current, task) => {
    return {
      ...current,
      [task.serviceKey]: [...(current[task.serviceKey] ?? []), task],
    }
  }, {})

  return Object.entries(grouped)
    .map(([serviceKey, groupedTasks]) => {
      const total = groupedTasks.length
      const approved = groupedTasks.filter((task) => task.status === "approved").length
      const submitted = groupedTasks.filter((task) => task.status === "submitted").length
      const rejected = groupedTasks.filter((task) => task.status === "rejected").length
      const requiredTasks = groupedTasks.filter((task) => task.required)
      const approvedRequired = requiredTasks.filter((task) => task.status === "approved").length
      const criticalOpen = groupedTasks.filter((task) => task.critical && task.status !== "approved").length

      return {
        serviceKey,
        label: serviceLabel(serviceKey),
        total,
        approved,
        submitted,
        rejected,
        criticalOpen,
        progress: requiredTasks.length === 0 ? 0 : Math.round((approvedRequired / requiredTasks.length) * 100),
        guide: serviceOnboardingGuide(serviceKey),
      }
    })
    .sort((a, b) => serviceTrackSortOrder(a.serviceKey) - serviceTrackSortOrder(b.serviceKey))
}

function serviceTrackSortOrder(serviceKey: string) {
  const order: Record<string, number> = {
    web_seo: 10,
    booking: 20,
    crm: 30,
    automation: 40,
    dashboard: 50,
  }

  return order[serviceKey] ?? 999
}

function serviceOnboardingGuide(serviceKey: string) {
  switch (serviceKey) {
    case "booking":
      return {
        heading: "Booking rules before widget work",
        description: "Define how appointments, tables, resources, policies and optional integrations should behave before the booking widget is built.",
        unlocks: "Booking project status, widget staging, testing feedback and launch handoff.",
      }
    case "crm":
      return {
        heading: "CRM structure before client records",
        description: "Confirm the catalogue, lead fields, sources and existing contact imports before the CRM workspace becomes operational.",
        unlocks: "Private CRM lead management, client records, notes, follow-up actions and intake planning.",
      }
    case "automation":
      return {
        heading: "Messaging rules before automation",
        description: "Confirm channels, sender context, tone and priority recipes before any customer-facing automation is drafted or tested.",
        unlocks: "Automation project status, template review, test-flow planning and production activation notes.",
      }
    case "dashboard":
      return {
        heading: "Roles and KPIs before dashboard build",
        description: "Define staff roles, permission expectations, protocols, historical data and KPIs before the internal dashboard is modelled.",
        unlocks: "Dashboard project status, mockup review, data migration planning and delivery handoff.",
      }
    case "web_seo":
      return {
        heading: "Content and access before web build",
        description: "Provide brand assets, page structure, SEO context, domain/hosting ownership and legal content before the public website is built.",
        unlocks: "Web/SEO project status, staging review, content handoff and launch readiness.",
      }
    default:
      return {
        heading: "Service context before execution",
        description: "Submit the required information so Altaira Labs can review the scope and turn it into an implementation plan.",
        unlocks: "Project status, review feedback and delivery handoff.",
      }
  }
}

function serviceLabel(serviceKey: string) {
  const labels: Record<string, string> = {
    general: "General",
    web_seo: "Web & SEO",
    booking: "Booking System",
    crm: "CRM / Lead Management",
    automation: "Workflow Automation",
    dashboard: "Management Dashboard",
  }

  return labels[serviceKey] ?? serviceKey.replaceAll("_", " ")
}
