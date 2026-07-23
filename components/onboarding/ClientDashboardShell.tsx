"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Columns3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  List,
  ListTodo,
  Link2,
  LockKeyhole,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  SearchCheck,
  Send,
  Upload,
  UserPlus,
  Workflow,
  X,
} from "lucide-react"
import Logo from "@/components/Logo"

type ClientPortalModule = {
  moduleKey: "web_seo" | "crm" | "booking" | "automation" | "dashboard"
  title: string
  description: string
  active: boolean
  locked: boolean
  status: string
  clientServiceId?: string | null
  serviceName?: string | null
}

type ClientProject = {
  id: string
  clientServiceId?: string | null
  projectKey: string
  name: string
  currentPhase: "requirements" | "design" | "development" | "review" | "launch"
  stagingUrl?: string | null
  latestClientFeedback?: string | null
  revisionPendingAt?: string | null
  assets?: ClientProjectAsset[]
}

type ProjectPhaseDefinition = {
  key: ClientProject["currentPhase"]
  label: string
}

type ServiceTrackGuide = {
  headline: string
  summary: string
  clientFocus: string[]
  delivery: string[]
}

type ServiceHandoffPlan = {
  title: string
  summary: string
  deliverables: string[]
  clientChecks: string[]
  futureWork: string[]
}

type ClientProjectAsset = {
  id: string
  projectId: string
  clientId: string
  assetType: string
  notes?: string | null
  originalFilename: string
  contentType?: string | null
  sizeBytes: number
  checksumSha256?: string | null
  externalUrl?: string | null
  status: "uploaded" | "approved" | "rejected"
  adminFeedback?: string | null
  uploadedAt?: string | null
  reviewedAt?: string | null
}

type ClientPortal = {
  client: {
    id: string
    name: string
    company: string
    email: string
    sectorType?: string | null
  }
  onboardingCompleted: boolean
  contractApproved: boolean
  accessRole: "client_user" | "viewer"
  canEdit: boolean
  modules: ClientPortalModule[]
  projects: ClientProject[]
}

type ClientCrmLeadStatus = "new_lead" | "contacted" | "appointment_scheduled" | "proposal_sent" | "won" | "lost"
type ClientCrmLeadPriority = "low" | "normal" | "high" | "urgent"
type ClientCrmStatusFilter = "all" | "open" | ClientCrmLeadStatus
type ClientCrmPriorityFilter = "all" | ClientCrmLeadPriority

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

type ClientCrmRecentActivity = {
  id: string
  leadId: string
  leadName: string
  label: string
  detail: string
  timestamp?: string | null
  tone: "action" | "note" | "event"
}

type CrmLeadForm = {
  fullName: string
  email: string
  phone: string
  source: string
  priority: ClientCrmLeadPriority
  sectorFieldA: string
  sectorFieldB: string
  initialNote: string
}

const moduleIcons = {
  web_seo: SearchCheck,
  crm: LayoutDashboard,
  booking: CalendarDays,
  automation: Workflow,
  dashboard: BarChart3,
}

const defaultPhaseLabels: ProjectPhaseDefinition[] = [
  { key: "requirements", label: "Requirements" },
  { key: "design", label: "Design" },
  { key: "development", label: "Development" },
  { key: "review", label: "Review" },
  { key: "launch", label: "Launch" },
]

const phaseLabelsByProjectKey: Record<string, ProjectPhaseDefinition[]> = {
  web_seo: [
    { key: "requirements", label: "Content handoff" },
    { key: "design", label: "Visual structure" },
    { key: "development", label: "Build" },
    { key: "review", label: "SEO and review" },
    { key: "launch", label: "Launch" },
  ],
  booking: [
    { key: "requirements", label: "Rules complete" },
    { key: "design", label: "Widget layout" },
    { key: "development", label: "Booking logic" },
    { key: "review", label: "Test bookings" },
    { key: "launch", label: "Web integration" },
  ],
  crm: [
    { key: "requirements", label: "Fields defined" },
    { key: "design", label: "Data model" },
    { key: "development", label: "Migration" },
    { key: "review", label: "Form integration" },
    { key: "launch", label: "Workspace delivery" },
  ],
  automation: [
    { key: "requirements", label: "Goals complete" },
    { key: "design", label: "API connection" },
    { key: "development", label: "Trigger build" },
    { key: "review", label: "Sending tests" },
    { key: "launch", label: "Production active" },
  ],
  dashboard: [
    { key: "requirements", label: "Roles defined" },
    { key: "design", label: "View architecture" },
    { key: "development", label: "Permissions" },
    { key: "review", label: "Data testing" },
    { key: "launch", label: "Panel delivery" },
  ],
}

const crmStatuses: Array<{ key: ClientCrmLeadStatus; label: string }> = [
  { key: "new_lead", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "appointment_scheduled", label: "Appointment" },
  { key: "proposal_sent", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
]

const initialCrmLeadForm: CrmLeadForm = {
  fullName: "",
  email: "",
  phone: "",
  source: "web_form",
  priority: "normal",
  sectorFieldA: "",
  sectorFieldB: "",
  initialNote: "",
}

export default function ClientDashboardShell() {
  const router = useRouter()
  const [portal, setPortal] = useState<ClientPortal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [feedbackError, setFeedbackError] = useState("")
  const [feedbackNotice, setFeedbackNotice] = useState("")
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [assetType, setAssetType] = useState("general")
  const [assetNotes, setAssetNotes] = useState("")
  const [assetFiles, setAssetFiles] = useState<File[]>([])
  const [assetUploading, setAssetUploading] = useState(false)
  const [assetError, setAssetError] = useState("")
  const [assetNotice, setAssetNotice] = useState("")
  const [linkLabel, setLinkLabel] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkNotes, setLinkNotes] = useState("")
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkError, setLinkError] = useState("")
  const [linkNotice, setLinkNotice] = useState("")
  const [crmLeads, setCrmLeads] = useState<ClientCrmLead[]>([])
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmError, setCrmError] = useState("")
  const [crmNotice, setCrmNotice] = useState("")
  const [crmView, setCrmView] = useState<"kanban" | "list">("kanban")
  const [crmSearch, setCrmSearch] = useState("")
  const [crmStatusFilter, setCrmStatusFilter] = useState<ClientCrmStatusFilter>("all")
  const [crmPriorityFilter, setCrmPriorityFilter] = useState<ClientCrmPriorityFilter>("all")
  const [crmSourceFilter, setCrmSourceFilter] = useState("all")
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [leadSaving, setLeadSaving] = useState(false)
  const [newLead, setNewLead] = useState<CrmLeadForm>(initialCrmLeadForm)
  const [noteDraft, setNoteDraft] = useState("")
  const [noteSaving, setNoteSaving] = useState(false)
  const [followUpTitle, setFollowUpTitle] = useState("")
  const [followUpDescription, setFollowUpDescription] = useState("")
  const [followUpSaving, setFollowUpSaving] = useState(false)

  useEffect(() => {
    void loadPortal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPortal() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/client/portal", { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected client portal response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load client dashboard.")
      }

      const nextPortal = data as ClientPortal
      setPortal(nextPortal)

      if (nextPortal.modules.some((module) => module.moduleKey === "crm" && module.active)) {
        void loadCrmLeads()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load client dashboard.")
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await fetch("/api/client/auth/logout", { method: "POST" }).catch(() => undefined)
    router.replace("/client/login")
  }

  async function submitProjectFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProject) {
      setFeedbackError("No active project track is available yet.")
      return
    }

    if (feedback.trim().length < 8) {
      setFeedbackError("Add a short but clear revision note before sending.")
      return
    }

    setFeedbackSaving(true)
    setFeedbackError("")
    setFeedbackNotice("")

    try {
      const response = await fetch(`/api/client/portal/projects/${selectedProject.id}/feedback`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected feedback response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not send feedback.")
      }

      const updatedProject = data as ClientProject
      setPortal((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          projects: current.projects.map((project) => project.id === updatedProject.id ? updatedProject : project),
        }
      })
      setFeedback("")
      setFeedbackNotice("Feedback sent. This project track is now marked for review.")
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Could not send feedback.")
    } finally {
      setFeedbackSaving(false)
    }
  }

  async function uploadProjectAssets(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProject) {
      setAssetError("No active project track is available yet.")
      return
    }

    if (assetFiles.length === 0) {
      setAssetError("Choose at least one file to upload.")
      return
    }

    const formData = new FormData()
    assetFiles.forEach((file) => formData.append("files", file))
    formData.append("assetType", assetType)
    formData.append("notes", assetNotes)

    setAssetUploading(true)
    setAssetError("")
    setAssetNotice("")

    try {
      const response = await fetch(`/api/client/portal/projects/${selectedProject.id}/assets`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json().catch(() => ({ error: "Unexpected project asset response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not upload project material.")
      }

      const uploadedAssets = Array.isArray(data) ? data as ClientProjectAsset[] : []
      setPortal((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          projects: current.projects.map((project) => {
            if (project.id !== selectedProject.id) {
              return project
            }

            return {
              ...project,
              assets: [...(project.assets ?? []), ...uploadedAssets],
            }
          }),
        }
      })
      setAssetFiles([])
      setAssetNotes("")
      setAssetNotice("Project material uploaded. The Altaira team can now review and download it.")
    } catch (err) {
      setAssetError(err instanceof Error ? err.message : "Could not upload project material.")
    } finally {
      setAssetUploading(false)
    }
  }

  async function createProjectLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProject) {
      setLinkError("No active project track is available yet.")
      return
    }

    if (!linkUrl.trim()) {
      setLinkError("Add a project link before saving.")
      return
    }

    setLinkSaving(true)
    setLinkError("")
    setLinkNotice("")

    try {
      const response = await fetch(`/api/client/portal/projects/${selectedProject.id}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: linkUrl,
          label: linkLabel,
          assetType: "external_link",
          notes: linkNotes,
        }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected project link response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not save project link.")
      }

      const newLink = data as ClientProjectAsset
      setPortal((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          projects: current.projects.map((project) => {
            if (project.id !== selectedProject.id) {
              return project
            }

            return {
              ...project,
              assets: [...(project.assets ?? []), newLink],
            }
          }),
        }
      })
      setLinkLabel("")
      setLinkUrl("")
      setLinkNotes("")
      setLinkNotice("Project link saved for this track.")
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Could not save project link.")
    } finally {
      setLinkSaving(false)
    }
  }

  async function loadCrmLeads() {
    setCrmLoading(true)
    setCrmError("")

    try {
      const response = await fetch("/api/client/crm/leads", { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected CRM response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load CRM leads.")
      }

      setCrmLeads(Array.isArray(data) ? data as ClientCrmLead[] : [])
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : "Could not load CRM leads.")
    } finally {
      setCrmLoading(false)
    }
  }

  async function createCrmLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newLead.fullName.trim().length < 2) {
      setCrmError("Add the lead name before creating it.")
      return
    }

    const sectorFields = buildSectorFields(portal?.client.sectorType, newLead)

    setLeadSaving(true)
    setCrmError("")
    setCrmNotice("")

    try {
      const response = await fetch("/api/client/crm/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: newLead.fullName,
          email: newLead.email,
          phone: newLead.phone,
          source: newLead.source,
          priority: newLead.priority,
          sectorFields,
          initialNote: newLead.initialNote,
        }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected CRM create response" }))

      if (response.status === 401) {
        router.replace("/client/login")
        return
      }

      if (response.status === 423) {
        router.replace("/onboarding")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not create CRM lead.")
      }

      const createdLead = data as ClientCrmLead
      setCrmLeads((current) => [createdLead, ...current])
      setSelectedLeadId(createdLead.id)
      setNewLead(initialCrmLeadForm)
      setCrmNotice("CRM lead created.")
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : "Could not create CRM lead.")
    } finally {
      setLeadSaving(false)
    }
  }

  async function updateCrmLeadStatus(leadId: string, status: ClientCrmLeadStatus) {
    setCrmError("")
    setCrmNotice("")

    try {
      const response = await fetch(`/api/client/crm/leads/${leadId}/status`, {
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

      updateCrmLead(data as ClientCrmLead)
      setCrmNotice("Lead status updated.")
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : "Could not update lead status.")
    }
  }

  async function addCrmLeadNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedCrmLead) {
      return
    }

    if (noteDraft.trim().length < 3) {
      setCrmError("Write a short note before saving.")
      return
    }

    setNoteSaving(true)
    setCrmError("")
    setCrmNotice("")

    try {
      const response = await fetch(`/api/client/crm/leads/${selectedCrmLead.id}/notes`, {
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

      updateCrmLead(data as ClientCrmLead)
      setNoteDraft("")
      setCrmNotice("Note saved.")
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : "Could not save note.")
    } finally {
      setNoteSaving(false)
    }
  }

  async function addCrmFollowUpAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedCrmLead) {
      return
    }

    if (followUpTitle.trim().length < 3) {
      setCrmError("Add a short follow-up action title before saving.")
      return
    }

    setFollowUpSaving(true)
    setCrmError("")
    setCrmNotice("")

    try {
      const response = await fetch(`/api/client/crm/leads/${selectedCrmLead.id}/follow-up-actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: followUpTitle,
          description: followUpDescription,
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

      updateCrmLead(data as ClientCrmLead)
      setFollowUpTitle("")
      setFollowUpDescription("")
      setCrmNotice("Follow-up action saved.")
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : "Could not save follow-up action.")
    } finally {
      setFollowUpSaving(false)
    }
  }

  async function updateCrmFollowUpActionStatus(actionId: string, status: ClientCrmFollowUpAction["status"]) {
    if (!selectedCrmLead) {
      return
    }

    setFollowUpSaving(true)
    setCrmError("")
    setCrmNotice("")

    try {
      const response = await fetch(`/api/client/crm/leads/${selectedCrmLead.id}/follow-up-actions/${actionId}/status`, {
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

      updateCrmLead(data as ClientCrmLead)
      setCrmNotice("Follow-up action updated.")
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : "Could not update follow-up action.")
    } finally {
      setFollowUpSaving(false)
    }
  }

  function updateCrmLead(updatedLead: ClientCrmLead) {
    setCrmLeads((current) => current.map((lead) => lead.id === updatedLead.id ? updatedLead : lead))
  }

  const activeModules = useMemo(() => portal?.modules.filter((module) => module.active) ?? [], [portal])
  const lockedModules = useMemo(() => portal?.modules.filter((module) => module.locked) ?? [], [portal])
  const webProject = portal?.projects.find((project) => project.projectKey === "web_seo")
  const primaryProject = webProject ?? portal?.projects[0]
  const selectedProject = portal?.projects.find((project) => project.id === selectedProjectId) ?? primaryProject
  const crmModule = portal?.modules.find((module) => module.moduleKey === "crm")
  const crmActive = crmModule?.active ?? false
  const selectedCrmLead = crmLeads.find((lead) => lead.id === selectedLeadId) ?? null
  const crmFieldLabels = getSectorFieldLabels(portal?.client.sectorType)
  const crmSourceOptions = useMemo(() => {
    return Array.from(new Set(crmLeads.map((lead) => lead.source).filter((source): source is string => Boolean(source))))
      .sort((first, second) => sourceLabel(first).localeCompare(sourceLabel(second)))
  }, [crmLeads])
  const filteredCrmLeads = useMemo(() => {
    const search = crmSearch.trim().toLowerCase()

    return crmLeads.filter((lead) => {
      const matchesSearch = !search || [
        lead.fullName,
        lead.email,
        lead.phone,
        lead.source,
        lead.priority,
        statusLabel(lead.status),
        ...Object.values(lead.sectorFields || {}),
        ...(lead.followUpActions || []).map((action) => action.title),
        ...(lead.followUpActions || []).map((action) => action.description),
        ...(lead.followUpActions || []).map((action) => followUpStatusLabel(action.status)),
        ...lead.notes.map((note) => note.content),
        ...(lead.events || []).map((event) => crmEventLabel(event)),
      ].some((value) => (value || "").toLowerCase().includes(search))
      const matchesStatus = crmStatusFilter === "all" ||
        (crmStatusFilter === "open" && !["won", "lost"].includes(lead.status)) ||
        lead.status === crmStatusFilter
      const matchesPriority = crmPriorityFilter === "all" || lead.priority === crmPriorityFilter
      const matchesSource = crmSourceFilter === "all" || lead.source === crmSourceFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesSource
    })
  }, [crmLeads, crmPriorityFilter, crmSearch, crmSourceFilter, crmStatusFilter])
  const crmOpenCount = crmLeads.filter((lead) => !["won", "lost"].includes(lead.status)).length
  const crmUrgentCount = crmLeads.filter((lead) => lead.priority === "urgent").length
  const crmWonCount = crmLeads.filter((lead) => lead.status === "won").length
  const crmOpenActionCount = crmLeads.reduce(
    (count, lead) => count + (lead.followUpActions || []).filter((action) => action.status === "open").length,
    0
  )
  const selectedLeadNotes = selectedCrmLead?.notes ?? []
  const selectedFollowUpActions = selectedCrmLead?.followUpActions ?? []
  const selectedWorkspaceNotes = selectedLeadNotes.filter((note) => note.authorRole !== "admin")
  const selectedAltairaNotes = selectedLeadNotes.filter((note) => note.authorRole === "admin")
  const selectedTimelineEvents = selectedCrmLead?.events ?? []
  const latestTimelineEvent = selectedTimelineEvents.length > 0
    ? selectedTimelineEvents[selectedTimelineEvents.length - 1]
    : null
  const recentCrmActivities = useMemo(() => buildClientCrmRecentActivities(crmLeads), [crmLeads])
  const crmHasActiveFilters = Boolean(crmSearch.trim()) ||
    crmStatusFilter !== "all" ||
    crmPriorityFilter !== "all" ||
    crmSourceFilter !== "all"

  function resetCrmFilters() {
    setCrmSearch("")
    setCrmStatusFilter("all")
    setCrmPriorityFilter("all")
    setCrmSourceFilter("all")
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 border border-white/10 bg-white/[0.03] p-6 text-white/60">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-300" />
          Loading client dashboard...
        </div>
      </main>
    )
  }

  if (!portal) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          {error || "Client dashboard unavailable."}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050810] text-white">
      <div className="grid min-h-screen min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 border-r border-white/10 bg-[#080d19] px-5 py-6">
          <Logo />

          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Client workspace</p>
            <h1 className="mt-3 break-words text-2xl font-semibold leading-tight">{portal.client.company || portal.client.name}</h1>
            <p className="mt-2 break-all text-sm text-white/45">{portal.client.email}</p>
          </div>

          <nav className="mt-10 grid gap-2" aria-label="Client modules">
            <Link
              href="/client/dashboard"
              className="flex items-center gap-3 border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-left text-sm text-white transition hover:bg-blue-500/15"
            >
              <LayoutDashboard className="h-4 w-4 text-blue-200" />
              <span className="flex-1">Overview</span>
            </Link>
            <Link
              href="/client/tasks"
              className="flex items-center gap-3 border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm text-white/55 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white"
            >
              <ListTodo className="h-4 w-4 text-blue-200" />
              <span className="flex-1">Tasks</span>
            </Link>
            {portal.modules.map((module) => {
              const Icon = moduleIcons[module.moduleKey]
              return (
                <button
                  key={module.moduleKey}
                  type="button"
                  disabled={module.locked}
                  className={`group flex items-center gap-3 border px-4 py-3 text-left text-sm transition ${
                    module.active
                      ? "border-blue-500/30 bg-blue-500/10 text-white hover:bg-blue-500/15"
                      : "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/35"
                  }`}
                >
                  <Icon className={module.active ? "h-4 w-4 text-blue-200" : "h-4 w-4 text-white/25"} />
                  <span className="flex-1">{module.title}</span>
                  {module.locked && <LockKeyhole className="h-4 w-4" />}
                </button>
              )
            })}
          </nav>

          <div className="mt-8 grid gap-3 border-t border-white/10 pt-6">
            <Link href="/onboarding" className="text-sm text-white/50 hover:text-white">
              Onboarding
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 text-left text-sm text-white/50 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-6 py-8 lg:px-10">
          <div className="flex flex-col gap-5 border border-white/10 bg-white/[0.03] p-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-300">Altaira Client Area</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight">
                Your business system, always in one place.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">
                Access active modules, onboarding status and project progress from one private workspace. Locked
                modules show what can be activated later without mixing them into your current scope.
              </p>
            </div>
            <div className="grid min-w-56 gap-3 text-sm">
              <StatusPill label="Contract" value={portal.contractApproved ? "Approved" : "Locked"} positive={portal.contractApproved} />
              <StatusPill label="Onboarding" value={portal.onboardingCompleted ? "Complete" : "In progress"} positive={portal.onboardingCompleted} />
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Metric label="Active modules" value={activeModules.length} />
            <Metric label="Locked modules" value={lockedModules.length} />
            <Metric label="Projects" value={portal.projects.length} />
          </div>

          {!portal.canEdit && (
            <div className="mt-6 border border-violet-400/25 bg-violet-500/10 px-5 py-4 text-sm leading-6 text-violet-100">
              Read-only access. You can review projects, materials and CRM activity, but changes require a client editor.
            </div>
          )}

          {portal.projects.length > 0 && (
            <section className="mt-6 border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Service work</p>
                  <h3 className="mt-3 text-2xl font-semibold">Active project tracks</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
                    Each active module has its own project track, so Web, Booking, CRM, Automation and Dashboard work can
                    move independently without losing the overall view.
                  </p>
                </div>
                <span className="border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                  {portal.projects.length} tracks
                </span>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {portal.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id)
                      setFeedback("")
                      setFeedbackError("")
                      setFeedbackNotice("")
                      setAssetError("")
                      setAssetNotice("")
                      setLinkError("")
                      setLinkNotice("")
                    }}
                    className={`border p-4 text-left transition ${
                      selectedProject?.id === project.id
                        ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_24px_rgba(59,130,246,0.16)]"
                        : "border-white/10 bg-[#0b1220] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                      {projectModuleTitle(project.projectKey)}
                    </p>
                    <h4 className="mt-3 text-base font-semibold">{project.name}</h4>
                    <div className="mt-4 h-2 border border-white/10 bg-[#050810]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                        style={{ width: projectPhasePercent(project.currentPhase) }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/40">
                      <span>{projectPhaseLabel(project.currentPhase, project.projectKey)}</span>
                      <span>{project.assets?.length ?? 0} items</span>
                    </div>
                    {project.revisionPendingAt && (
                      <p className="mt-3 border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        Review pending
                      </p>
                    )}
                    <p className="mt-3 text-xs font-semibold text-blue-200">
                      {selectedProject?.id === project.id ? "Selected" : "Open track"}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
                    {selectedProject ? projectModuleTitle(selectedProject.projectKey) : "Service progress"}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold">{selectedProject?.name || "Service project"}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Select a project track above to review its current phase, send feedback and upload the right
                    material for that service without mixing it with other modules.
                  </p>
                </div>
                {selectedProject?.stagingUrl && (
                  <Link
                    href={selectedProject.stagingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-blue-500/20"
                  >
                    Open staging
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-5">
                {projectPhaseLabels(selectedProject?.projectKey).map((phase, index) => {
                  const currentPhase = selectedProject?.currentPhase || "requirements"
                  const activeIndex = projectPhaseLabels(selectedProject?.projectKey).findIndex((item) => item.key === currentPhase)
                  const reached = index <= activeIndex
                  return (
                    <div
                      key={phase.key}
                      className={`border p-4 ${
                        reached
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
                          : "border-white/10 bg-white/[0.02] text-white/35"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]">{index + 1}</span>
                        {reached && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="mt-4 text-sm font-semibold">{phase.label}</div>
                    </div>
                  )
                })}
              </div>

              {selectedProject && <ServiceExecutionPanel project={selectedProject} />}

              {selectedProject && <ServiceTrackGuideBlock projectKey={selectedProject.projectKey} />}

              {selectedProject?.latestClientFeedback && (
                <div className="mt-6 border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
                  Latest feedback: {selectedProject.latestClientFeedback}
                </div>
              )}

              {selectedProject && (
                <form onSubmit={submitProjectFeedback} className="mt-6 border border-white/10 bg-[#0b1220] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">Send revision feedback</h4>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Use this for the selected {projectModuleTitle(selectedProject.projectKey)} track when you want
                        the team to adjust something or review a decision.
                      </p>
                    </div>
                    {selectedProject.revisionPendingAt && (
                      <span className="border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
                        Review pending
                      </span>
                    )}
                  </div>

                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    rows={4}
                    disabled={!portal.canEdit || feedbackSaving}
                    placeholder={projectFeedbackPlaceholder(selectedProject.projectKey)}
                    className="mt-4 w-full border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  {feedbackError && (
                    <div className="mt-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {feedbackError}
                    </div>
                  )}

                  {feedbackNotice && (
                    <div className="mt-3 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {feedbackNotice}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!portal.canEdit || feedbackSaving}
                    className="mt-4 inline-flex items-center justify-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {feedbackSaving ? "Sending..." : "Send feedback"}
                  </button>
                </form>
              )}

              {selectedProject && (
                <section className="mt-6 border border-white/10 bg-[#0b1220] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">Project materials</h4>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Upload files, screenshots, exports or notes for the selected{" "}
                        {projectModuleTitle(selectedProject.projectKey)} track. Files are stored privately and reviewed
                        from the admin workspace.
                      </p>
                    </div>
                    <span className="border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                      {selectedProject.assets?.length ?? 0} items
                    </span>
                  </div>

                  <form onSubmit={uploadProjectAssets} className="mt-5 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-white/70">Material type</span>
                        <select
                          value={assetType}
                          onChange={(event) => setAssetType(event.target.value)}
                          disabled={!portal.canEdit || assetUploading}
                          className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="general">General material</option>
                          <option value="brand_logo">Logo / brand</option>
                          <option value="business_photos">Business photos</option>
                          <option value="website_copy">Website copy</option>
                          <option value="booking_rules">Booking rules</option>
                          <option value="crm_import">CRM import / leads</option>
                          <option value="workflow_map">Workflow map</option>
                          <option value="dashboard_metrics">Dashboard metrics</option>
                          <option value="legal_content">Legal content</option>
                          <option value="seo_references">SEO references</option>
                        </select>
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-white/70">Files</span>
                        <input
                          type="file"
                          multiple
                          disabled={!portal.canEdit || assetUploading}
                          onChange={(event) => setAssetFiles(Array.from(event.target.files ?? []))}
                          className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white file:mr-4 file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </label>
                    </div>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Notes for the team</span>
                      <textarea
                        value={assetNotes}
                        onChange={(event) => setAssetNotes(event.target.value)}
                        rows={3}
                        disabled={!portal.canEdit || assetUploading}
                        placeholder={projectAssetPlaceholder(selectedProject.projectKey)}
                        className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </label>

                    {assetError && (
                      <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {assetError}
                      </div>
                    )}

                    {assetNotice && (
                      <div className="border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        {assetNotice}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!portal.canEdit || assetUploading}
                      className="inline-flex items-center justify-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {assetUploading ? "Uploading..." : "Upload materials"}
                    </button>
                  </form>

                  <form onSubmit={createProjectLink} className="mt-5 grid gap-4 border border-white/10 bg-[#050810] p-4">
                    <div>
                      <h5 className="font-semibold">Add project link</h5>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Save shared folders, forms, references, booking calendars, CRM exports or dashboard sources for
                        this selected track.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-white/70">Link label</span>
                        <input
                          value={linkLabel}
                          onChange={(event) => setLinkLabel(event.target.value)}
                          disabled={!portal.canEdit || linkSaving}
                          placeholder="Example: Booking rules sheet"
                          className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-white/70">URL</span>
                        <input
                          value={linkUrl}
                          onChange={(event) => setLinkUrl(event.target.value)}
                          disabled={!portal.canEdit || linkSaving}
                          placeholder={projectLinkPlaceholder(selectedProject.projectKey)}
                          type="url"
                          className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </label>
                    </div>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Link notes</span>
                      <textarea
                        value={linkNotes}
                        onChange={(event) => setLinkNotes(event.target.value)}
                        rows={3}
                        disabled={!portal.canEdit || linkSaving}
                        placeholder="Explain what this link contains and what the team should review."
                        className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </label>

                    {linkError && (
                      <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {linkError}
                      </div>
                    )}

                    {linkNotice && (
                      <div className="border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        {linkNotice}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!portal.canEdit || linkSaving}
                      className="inline-flex items-center justify-center gap-2 border border-violet-500/40 bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Link2 className="h-4 w-4" />
                      {linkSaving ? "Saving..." : "Save link"}
                    </button>
                  </form>

                  {selectedProject.assets && selectedProject.assets.length > 0 && (
                    <div className="mt-6 grid gap-3">
                      {selectedProject.assets.map((asset) => (
                        <div key={asset.id} className="border border-white/10 bg-[#050810] p-4 text-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="inline-flex items-center gap-2 font-semibold text-white">
                                {asset.externalUrl ? (
                                  <Link2 className="h-4 w-4 text-violet-300" />
                                ) : (
                                  <FileText className="h-4 w-4 text-blue-300" />
                                )}
                                {asset.originalFilename}
                              </div>
                              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/35">
                                {asset.assetType.replaceAll("_", " ")} · {asset.externalUrl ? "external link" : formatBytes(asset.sizeBytes)}
                              </p>
                              {asset.notes && <p className="mt-2 text-white/45">{asset.notes}</p>}
                              {asset.externalUrl && (
                                <Link
                                  href={asset.externalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-violet-100"
                                >
                                  Open link
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              )}
                              {asset.adminFeedback && (
                                <p className="mt-2 border border-red-500/20 bg-red-500/10 p-3 text-red-100">
                                  Admin feedback: {asset.adminFeedback}
                                </p>
                              )}
                            </div>
                            <span className={asset.status === "approved" ? "text-emerald-300" : asset.status === "rejected" ? "text-red-300" : "text-amber-300"}>
                              {asset.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </article>

            <article className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Module access</p>
              <h3 className="mt-3 text-2xl font-semibold">Current service scope</h3>
              <div className="mt-6 grid gap-3">
                {portal.modules.map((module) => (
                  <div key={module.moduleKey} className="border border-white/10 bg-[#0b1220] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold">{module.title}</h4>
                      <span className={module.active ? "text-xs text-emerald-300" : "text-xs text-white/35"}>
                        {module.active ? module.status : "locked"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/45">{module.description}</p>
                    {module.serviceName && (
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-blue-300">{module.serviceName}</p>
                    )}
                  </div>
                ))}
              </div>
            </article>
          </section>

          {crmActive && (
            <section className="mt-6 border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">CRM / Lead Management</p>
                  <h3 className="mt-3 text-2xl font-semibold">Pipeline for your business leads</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
                    Track incoming opportunities in a simple CRM owned by your workspace. Use Kanban for operations or
                    List for scanning, then open a lead to keep notes and sector-specific context.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCrmView("kanban")}
                    className={`inline-flex items-center gap-2 border px-4 py-3 text-sm font-semibold ${
                      crmView === "kanban"
                        ? "border-blue-500/40 bg-blue-600 text-white"
                        : "border-white/10 bg-[#0b1220] text-white/55 hover:text-white"
                    }`}
                  >
                    <Columns3 className="h-4 w-4" />
                    Kanban
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrmView("list")}
                    className={`inline-flex items-center gap-2 border px-4 py-3 text-sm font-semibold ${
                      crmView === "list"
                        ? "border-blue-500/40 bg-blue-600 text-white"
                        : "border-white/10 bg-[#0b1220] text-white/55 hover:text-white"
                    }`}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadCrmLeads()}
                    disabled={crmLoading}
                    className="inline-flex items-center gap-2 border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-semibold text-white/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${crmLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {crmError && (
                <div className="mt-5 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {crmError}
                </div>
              )}

              {crmNotice && (
                <div className="mt-5 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {crmNotice}
                </div>
              )}

              <div className="mt-6 grid gap-3 md:grid-cols-5">
                <Metric label="Total leads" value={crmLeads.length} />
                <Metric label="Open leads" value={crmOpenCount} />
                <Metric label="Open actions" value={crmOpenActionCount} />
                <Metric label="Urgent leads" value={crmUrgentCount} />
                <Metric label="Won leads" value={crmWonCount} />
              </div>

              <div className="mt-4 border border-white/10 bg-[#0b1220] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Recent activity</p>
                    <p className="mt-1 text-sm text-white/45">Latest visible CRM movement across your workspace.</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-white/30">
                    {recentCrmActivities.length} shown
                  </span>
                </div>
                <div className="mt-4 grid gap-2 lg:grid-cols-2">
                  {recentCrmActivities.length === 0 ? (
                    <p className="border border-dashed border-white/10 p-3 text-sm text-white/35 lg:col-span-2">
                      No recent visible CRM activity yet.
                    </p>
                  ) : recentCrmActivities.map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => setSelectedLeadId(activity.leadId)}
                      className="border border-white/10 bg-[#050810] p-3 text-left hover:border-violet-300/40"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 ${activityToneClass(activity.tone)}`} />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                            {activity.label} · {formatDate(activity.timestamp)}
                          </span>
                          <span className="mt-1 block truncate text-sm font-semibold text-white/80">{activity.leadName}</span>
                          <span className="mt-1 block line-clamp-2 text-sm leading-5 text-white/45">{activity.detail}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 border border-white/10 bg-[#0b1220] p-4 lg:grid-cols-[1fr_180px_180px_180px_auto]">
                <label className="relative block">
                  <SearchCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={crmSearch}
                    onChange={(event) => setCrmSearch(event.target.value)}
                    placeholder="Search leads, notes or sector context"
                    className="w-full border border-white/10 bg-[#050810] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60"
                  />
                </label>
                <select
                  value={crmStatusFilter}
                  onChange={(event) => setCrmStatusFilter(event.target.value as ClientCrmStatusFilter)}
                  className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60"
                  aria-label="Filter CRM leads by status"
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open leads</option>
                  {crmStatuses.map((status) => (
                    <option key={status.key} value={status.key}>{status.label}</option>
                  ))}
                </select>
                <select
                  value={crmPriorityFilter}
                  onChange={(event) => setCrmPriorityFilter(event.target.value as ClientCrmPriorityFilter)}
                  className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60"
                  aria-label="Filter CRM leads by priority"
                >
                  <option value="all">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={crmSourceFilter}
                  onChange={(event) => setCrmSourceFilter(event.target.value)}
                  className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60"
                  aria-label="Filter CRM leads by source"
                >
                  <option value="all">All sources</option>
                  {crmSourceOptions.map((source) => (
                    <option key={source} value={source}>{sourceLabel(source)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={resetCrmFilters}
                  disabled={!crmHasActiveFilters}
                  className="border border-white/10 px-4 py-3 text-sm font-semibold text-white/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Clear
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCrmSearch("")
                    setCrmStatusFilter("open")
                    setCrmPriorityFilter("all")
                    setCrmSourceFilter("all")
                  }}
                  className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                    crmStatusFilter === "open" && crmPriorityFilter === "all" && crmSourceFilter === "all" && !crmSearch.trim()
                      ? "border-blue-400/50 bg-blue-500/15 text-blue-100"
                      : "border-white/10 text-white/45 hover:text-white"
                  }`}
                >
                  Open follow-up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCrmSearch("")
                    setCrmStatusFilter("all")
                    setCrmPriorityFilter("urgent")
                    setCrmSourceFilter("all")
                  }}
                  className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                    crmStatusFilter === "all" && crmPriorityFilter === "urgent" && crmSourceFilter === "all" && !crmSearch.trim()
                      ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                      : "border-white/10 text-white/45 hover:text-white"
                  }`}
                >
                  Urgent
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCrmSearch("")
                    setCrmStatusFilter("won")
                    setCrmPriorityFilter("all")
                    setCrmSourceFilter("all")
                  }}
                  className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                    crmStatusFilter === "won" && crmPriorityFilter === "all" && crmSourceFilter === "all" && !crmSearch.trim()
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                      : "border-white/10 text-white/45 hover:text-white"
                  }`}
                >
                  Won
                </button>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/35">
                Showing {filteredCrmLeads.length} of {crmLeads.length} CRM leads
              </p>

              {!crmLoading && crmLeads.length === 0 && (
                <div className="mt-5 border border-dashed border-blue-400/25 bg-blue-500/10 p-5">
                  <p className="text-sm font-semibold text-blue-100">Your CRM workspace is ready.</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                    Add the first real opportunity from a web form, call, email or walk-in conversation. Once leads exist,
                    this area becomes your simple pipeline for follow-up and decisions.
                  </p>
                </div>
              )}

              {!crmLoading && crmLeads.length > 0 && filteredCrmLeads.length === 0 && (
                <div className="mt-5 flex flex-col gap-4 border border-violet-400/25 bg-violet-500/10 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-violet-100">No leads match the current filters.</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      Clear the filters or adjust the search to return to the full workspace pipeline.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetCrmFilters}
                    disabled={!crmHasActiveFilters}
                    className="border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:border-violet-300/50"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
                <form onSubmit={createCrmLead} className="border border-white/10 bg-[#0b1220] p-5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-300" />
                    <h4 className="font-semibold">Add lead</h4>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Add a real opportunity from a call, web form, WhatsApp or walk-in conversation.
                  </p>

                  <div className="mt-5 grid gap-3">
                    <input
                      value={newLead.fullName}
                      onChange={(event) => setNewLead((current) => ({ ...current, fullName: event.target.value }))}
                      disabled={!portal.canEdit || leadSaving}
                      placeholder="Lead name"
                      className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <input
                      value={newLead.email}
                      onChange={(event) => setNewLead((current) => ({ ...current, email: event.target.value }))}
                      disabled={!portal.canEdit || leadSaving}
                      placeholder="Email"
                      type="email"
                      className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <input
                      value={newLead.phone}
                      onChange={(event) => setNewLead((current) => ({ ...current, phone: event.target.value }))}
                      disabled={!portal.canEdit || leadSaving}
                      placeholder="Phone"
                      className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={newLead.source}
                        onChange={(event) => setNewLead((current) => ({ ...current, source: event.target.value }))}
                        disabled={!portal.canEdit || leadSaving}
                        className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="web_form">Web form</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="instagram">Instagram</option>
                        <option value="phone_call">Phone call</option>
                        <option value="walk_in">Walk-in</option>
                      </select>
                      <select
                        value={newLead.priority}
                        onChange={(event) => setNewLead((current) => ({ ...current, priority: event.target.value as ClientCrmLeadPriority }))}
                        disabled={!portal.canEdit || leadSaving}
                        className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <input
                      value={newLead.sectorFieldA}
                      onChange={(event) => setNewLead((current) => ({ ...current, sectorFieldA: event.target.value }))}
                      disabled={!portal.canEdit || leadSaving}
                      placeholder={crmFieldLabels[0].placeholder}
                      className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <input
                      value={newLead.sectorFieldB}
                      onChange={(event) => setNewLead((current) => ({ ...current, sectorFieldB: event.target.value }))}
                      disabled={!portal.canEdit || leadSaving}
                      placeholder={crmFieldLabels[1].placeholder}
                      className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <textarea
                      value={newLead.initialNote}
                      onChange={(event) => setNewLead((current) => ({ ...current, initialNote: event.target.value }))}
                      disabled={!portal.canEdit || leadSaving}
                      rows={3}
                      placeholder="Initial internal note"
                      className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!portal.canEdit || leadSaving}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {leadSaving ? "Creating..." : "Create lead"}
                  </button>
                </form>

                <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
                  <div className="min-w-0">
                    {crmLoading ? (
                      <div className="flex items-center gap-3 border border-white/10 bg-[#0b1220] p-5 text-sm text-white/50">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-300" />
                        Loading CRM leads...
                      </div>
                    ) : crmView === "kanban" ? (
                      <div className="grid gap-3 lg:grid-cols-3 2xl:grid-cols-6">
                        {crmStatuses.map((status) => {
                          const statusLeads = filteredCrmLeads.filter((lead) => lead.status === status.key)
                          return (
                            <div key={status.key} className="border border-white/10 bg-[#0b1220] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-semibold">{status.label}</h4>
                                <span className="text-xs text-white/35">{statusLeads.length}</span>
                              </div>
                              <div className="mt-3 grid gap-3">
                                {statusLeads.length === 0 && (
                                  <div className="border border-dashed border-white/10 p-4 text-xs text-white/30">No leads</div>
                                )}
                                {statusLeads.map((lead) => (
                                  <button
                                    key={lead.id}
                                    type="button"
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className={`border p-3 text-left transition hover:border-blue-400/40 ${
                                      selectedLeadId === lead.id
                                        ? "border-blue-500/50 bg-blue-500/10"
                                        : "border-white/10 bg-[#050810]"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <span className="text-sm font-semibold">{lead.fullName}</span>
                                      <span className={priorityClass(lead.priority)}>{lead.priority}</span>
                                    </div>
                                    <p className="mt-2 text-xs text-white/40">{lead.phone || lead.email || "No contact yet"}</p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-blue-300">{sourceLabel(lead.source)}</p>
                                    <p className="mt-2 border-t border-white/5 pt-2 text-xs leading-5 text-white/45">
                                      Next: {crmSuggestedNextAction(lead)}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-white/10 bg-[#0b1220]">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/35">
                            <tr>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">Contact</th>
                              <th className="px-4 py-3">Source</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Next action</th>
                              <th className="px-4 py-3">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCrmLeads.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-white/35">
                                  {crmLeads.length === 0 ? "No CRM leads yet." : "No matching CRM leads."}
                                </td>
                              </tr>
                            )}
                            {filteredCrmLeads.map((lead) => (
                              <tr
                                key={lead.id}
                                onClick={() => setSelectedLeadId(lead.id)}
                                className="cursor-pointer border-b border-white/5 hover:bg-white/[0.03]"
                              >
                                <td className="px-4 py-3 font-semibold">{lead.fullName}</td>
                                <td className="px-4 py-3 text-white/55">{lead.email || lead.phone || "No contact"}</td>
                                <td className="px-4 py-3 text-white/55">{sourceLabel(lead.source)}</td>
                                <td className="px-4 py-3 text-white/55">{statusLabel(lead.status)}</td>
                                <td className="px-4 py-3 text-white/55">{crmSuggestedNextAction(lead)}</td>
                                <td className="px-4 py-3 text-white/40">{formatDate(lead.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <aside className="border border-white/10 bg-[#0b1220] p-5">
                    {selectedCrmLead ? (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Lead detail</p>
                            <h4 className="mt-2 text-xl font-semibold">{selectedCrmLead.fullName}</h4>
                            <p className="mt-2 text-sm text-white/45">{selectedCrmLead.email || selectedCrmLead.phone || "No contact added"}</p>
                            <Link
                              href={`/client/crm/leads/${selectedCrmLead.id}`}
                              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-violet-100"
                            >
                              Open full detail
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            {latestTimelineEvent && (
                              <p className="mt-3 border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs leading-5 text-blue-100">
                                Latest visible update: {crmEventLabel(latestTimelineEvent)}
                              </p>
                            )}
                            <div className="mt-3 border border-violet-500/20 bg-violet-500/10 px-3 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">Suggested next action</p>
                              <p className="mt-1 text-sm leading-6 text-white/75">{crmSuggestedNextAction(selectedCrmLead)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedLeadId(null)}
                            className="border border-white/10 p-2 text-white/45 hover:text-white"
                            aria-label="Close lead detail"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <label className="mt-5 grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Pipeline status</span>
                          <select
                            value={selectedCrmLead.status}
                            disabled={!portal.canEdit}
                            onChange={(event) => void updateCrmLeadStatus(selectedCrmLead.id, event.target.value as ClientCrmLeadStatus)}
                            className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {crmStatuses.map((status) => (
                              <option key={status.key} value={status.key}>{status.label}</option>
                            ))}
                          </select>
                        </label>

                        <div className="mt-5 border-t border-white/10 pt-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Sector fields</p>
                          <div className="mt-3 grid gap-2 text-sm">
                            {Object.entries(selectedCrmLead.sectorFields || {}).length === 0 && (
                              <p className="text-white/35">No sector-specific context yet.</p>
                            )}
                            {Object.entries(selectedCrmLead.sectorFields || {}).map(([key, value]) => (
                              <div key={key} className="flex justify-between gap-4 border border-white/10 px-3 py-2">
                                <span className="text-white/35">{fieldLabel(key)}</span>
                                <span className="text-right text-white/70">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-5">
                          <div className="flex items-center gap-2">
                            <ListTodo className="h-4 w-4 text-violet-300" />
                            <p className="text-sm font-semibold">Follow-up actions</p>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-white/35">
                            Track the next visible steps for this lead. Private Altaira actions stay outside the client view.
                          </p>

                          <div className="mt-4 grid gap-3">
                            {selectedFollowUpActions.length === 0 && (
                              <p className="border border-dashed border-white/10 p-3 text-sm text-white/35">No visible follow-up actions yet.</p>
                            )}
                            {selectedFollowUpActions.map((action) => (
                              <div key={action.id} className="border border-white/10 bg-[#050810] p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-white/80">{action.title}</p>
                                    {action.description && <p className="mt-2 text-xs leading-5 text-white/45">{action.description}</p>}
                                    <p className="mt-2 text-xs text-white/30">{formatDate(action.updatedAt || action.createdAt)}</p>
                                  </div>
                                  <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${followUpStatusClass(action.status)}`}>
                                    {followUpStatusLabel(action.status)}
                                  </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {action.status !== "done" && (
                                    <button
                                      type="button"
                                      disabled={!portal.canEdit || followUpSaving}
                                      onClick={() => void updateCrmFollowUpActionStatus(action.id, "done")}
                                      className="inline-flex items-center gap-2 border border-emerald-500/25 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Done
                                    </button>
                                  )}
                                  {action.status !== "open" && (
                                    <button
                                      type="button"
                                      disabled={!portal.canEdit || followUpSaving}
                                      onClick={() => void updateCrmFollowUpActionStatus(action.id, "open")}
                                      className="border border-blue-500/25 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Reopen
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <form onSubmit={addCrmFollowUpAction} className="mt-4 grid gap-3">
                            <input
                              value={followUpTitle}
                              onChange={(event) => setFollowUpTitle(event.target.value)}
                              disabled={!portal.canEdit || followUpSaving}
                              placeholder="Next action title"
                              className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <textarea
                              value={followUpDescription}
                              onChange={(event) => setFollowUpDescription(event.target.value)}
                              disabled={!portal.canEdit || followUpSaving}
                              rows={3}
                              placeholder="Optional action context"
                              className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                              type="submit"
                              disabled={!portal.canEdit || followUpSaving || followUpTitle.trim().length < 3}
                              className="inline-flex items-center justify-center gap-2 border border-violet-500/40 bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                              {followUpSaving ? "Saving..." : "Add follow-up action"}
                            </button>
                          </form>
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-5">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-300" />
                            <p className="text-sm font-semibold">Visible notes</p>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-white/35">
                            Notes here are visible inside this client workspace. Altaira notes are shared by the team;
                            workspace notes are written by your business.
                          </p>

                          <div className="mt-4 grid gap-4">
                            {selectedLeadNotes.length === 0 && (
                              <p className="border border-dashed border-white/10 p-3 text-sm text-white/35">No visible notes yet.</p>
                            )}

                            {selectedAltairaNotes.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">Altaira notes</p>
                                <div className="mt-2 grid gap-2">
                                  {selectedAltairaNotes.map((note) => (
                                    <CrmNoteCard key={note.id} note={note} tone="altaira" />
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedWorkspaceNotes.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Your workspace notes</p>
                                <div className="mt-2 grid gap-2">
                                  {selectedWorkspaceNotes.map((note) => (
                                    <CrmNoteCard key={note.id} note={note} tone="workspace" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <form onSubmit={addCrmLeadNote} className="mt-4 grid gap-3">
                            <textarea
                              value={noteDraft}
                              onChange={(event) => setNoteDraft(event.target.value)}
                              disabled={!portal.canEdit || noteSaving}
                              rows={3}
                              placeholder="Add internal follow-up note"
                              className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                              type="submit"
                              disabled={!portal.canEdit || noteSaving}
                              className="inline-flex items-center justify-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                              {noteSaving ? "Saving..." : "Add note"}
                            </button>
                          </form>
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Workspace timeline</p>
                          <div className="mt-3 grid gap-3">
                            {(selectedCrmLead.events || []).length === 0 && (
                              <p className="text-sm text-white/35">No visible activity yet.</p>
                            )}
                            {(selectedCrmLead.events || []).slice(-5).reverse().map((event) => (
                              <div key={event.id} className="border-l border-blue-400/50 pl-3 text-sm">
                                <p className="font-semibold text-white/75">{crmEventLabel(event)}</p>
                                <p className="mt-1 text-xs text-white/30">{formatDate(event.createdAt)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex min-h-80 flex-col items-center justify-center border border-dashed border-white/10 p-6 text-center">
                        <MessageSquare className="h-8 w-8 text-white/20" />
                        <p className="mt-4 text-sm text-white/45">Select a lead to see details, notes and sector fields.</p>
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  )
}

function StatusPill({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-[#0b1220] px-4 py-3">
      <span className="text-white/45">{label}</span>
      <span className={positive ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>{value}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.16em] text-white/40">{label}</div>
    </div>
  )
}

function CrmNoteCard({ note, tone }: { note: ClientCrmLeadNote; tone: "altaira" | "workspace" }) {
  const toneClass = tone === "altaira"
    ? "border-violet-500/20 bg-violet-500/10"
    : "border-white/10 bg-[#050810]"

  return (
    <div className={`border p-3 text-sm ${toneClass}`}>
      <p className="leading-6 text-white/75">{note.content}</p>
      <p className="mt-2 text-xs text-white/35">
        {visibleNoteRoleLabel(note.authorRole)} · {formatDate(note.createdAt)}
      </p>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getSectorFieldLabels(sectorType?: string | null) {
  switch (sectorType) {
    case "clinics":
      return [
        { key: "treatment_interest", label: "Treatment interest", placeholder: "Treatment interest" },
        { key: "preferred_schedule", label: "Preferred schedule", placeholder: "Preferred schedule" },
      ]
    case "restaurants":
      return [
        { key: "event_type", label: "Event type", placeholder: "Event type or reservation reason" },
        { key: "guest_count", label: "Guest count", placeholder: "Guest count" },
      ]
    case "car_dealers":
      return [
        { key: "vehicle_model", label: "Vehicle model", placeholder: "Vehicle model of interest" },
        { key: "trade_in_vehicle", label: "Trade-in vehicle", placeholder: "Trade-in vehicle" },
      ]
    default:
      return [
        { key: "business_need", label: "Business need", placeholder: "Business need" },
        { key: "preferred_contact", label: "Preferred contact", placeholder: "Preferred contact method/time" },
      ]
  }
}

function buildSectorFields(sectorType: string | null | undefined, form: CrmLeadForm) {
  const labels = getSectorFieldLabels(sectorType)
  const fields: Record<string, string> = {}

  if (form.sectorFieldA.trim()) {
    fields[labels[0].key] = form.sectorFieldA.trim()
  }

  if (form.sectorFieldB.trim()) {
    fields[labels[1].key] = form.sectorFieldB.trim()
  }

  return fields
}

function statusLabel(status: ClientCrmLeadStatus) {
  return crmStatuses.find((item) => item.key === status)?.label || status
}

function ServiceTrackGuideBlock({ projectKey }: { projectKey: string }) {
  const guide = serviceTrackGuide(projectKey)

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="border border-white/10 bg-[#0b1220] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">What to review</p>
        <h4 className="mt-3 text-lg font-semibold">{guide.headline}</h4>
        <p className="mt-3 text-sm leading-6 text-white/45">{guide.summary}</p>
        <div className="mt-4 grid gap-2">
          {guide.clientFocus.map((item) => (
            <div key={item} className="border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/65">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="border border-white/10 bg-[#0b1220] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Delivery area</p>
        <h4 className="mt-3 text-lg font-semibold">What will appear here later</h4>
        <div className="mt-4 grid gap-2">
          {guide.delivery.map((item) => (
            <div key={item} className="border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/65">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ServiceExecutionPanel({ project }: { project: ClientProject }) {
  const plan = serviceExecutionPlan(project.projectKey)
  const handoff = serviceHandoffPlan(project.projectKey)
  const currentPhaseLabel = projectPhaseLabel(project.currentPhase, project.projectKey)
  const launched = project.currentPhase === "launch"
  const activePhaseIndex = defaultPhaseLabels.findIndex((item) => item.key === project.currentPhase)
  const normalizedPhaseIndex = activePhaseIndex === -1 ? 0 : activePhaseIndex

  return (
    <>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="border border-blue-500/20 bg-blue-500/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Project status</p>
          <h4 className="mt-3 text-lg font-semibold text-blue-50">{currentPhaseLabel}</h4>
          <p className="mt-3 text-sm leading-6 text-blue-50/70">
            {plan.phaseMessages[project.currentPhase] || plan.phaseMessages.requirements}
          </p>
          <div className="mt-4 grid grid-cols-5 gap-1">
            {defaultPhaseLabels.map((phase, index) => (
              <span
                key={phase.key}
                className={`h-1.5 ${index <= normalizedPhaseIndex ? "bg-blue-300" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-[#0b1220] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Staging area</p>
          <h4 className="mt-3 text-lg font-semibold">{plan.stagingTitle}</h4>
          <p className="mt-3 text-sm leading-6 text-white/45">{plan.stagingDescription}</p>
          {project.stagingUrl ? (
            <Link
              href={project.stagingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 border border-violet-400/30 bg-violet-500/20 px-4 py-3 text-sm font-semibold text-violet-50 hover:bg-violet-500/30"
            >
              Open staging
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : (
            <div className="mt-4 border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-white/40">
              {plan.stagingPlaceholder}
            </div>
          )}
        </div>

        <div className={`border p-5 ${launched ? "border-emerald-500/25 bg-emerald-500/10" : "border-white/10 bg-[#0b1220]"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${launched ? "text-emerald-200" : "text-white/35"}`}>
                Delivery
              </p>
              <h4 className="mt-3 text-lg font-semibold">{plan.deliveryTitle}</h4>
            </div>
            {launched ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <LockKeyhole className="h-5 w-5 text-white/30" />}
          </div>
          <div className="mt-4 grid gap-2">
            {plan.deliveryItems.map((item) => (
              <div key={item} className="border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/65">
                {item}
              </div>
            ))}
          </div>
          {!launched && (
            <p className="mt-4 text-xs leading-5 text-white/35">
              Delivery material unlocks progressively as this track reaches launch.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 border border-white/10 bg-[#050810] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Service handoff</p>
            <h4 className="mt-2 text-lg font-semibold">{handoff.title}</h4>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">{handoff.summary}</p>
          </div>
          <span className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${launched ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100" : "border-white/10 text-white/40"}`}>
            {launched ? "Ready for handoff" : "Prepared for launch"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <ServiceHandoffColumn title="What you receive" items={handoff.deliverables} tone="blue" />
          <ServiceHandoffColumn title="What to check" items={handoff.clientChecks} tone="violet" />
          <ServiceHandoffColumn title="Future upgrades" items={handoff.futureWork} tone="neutral" />
        </div>
      </div>
    </>
  )
}

function ServiceHandoffColumn({ title, items, tone }: { title: string; items: string[]; tone: "blue" | "violet" | "neutral" }) {
  const toneClass = {
    blue: "text-blue-200",
    violet: "text-violet-200",
    neutral: "text-white/45",
  }[tone]

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${toneClass}`}>{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6 text-white/65">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function projectModuleTitle(projectKey: string) {
  switch (projectKey) {
    case "web_seo":
      return "Web & SEO"
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

function serviceExecutionPlan(projectKey: string) {
  switch (projectKey) {
    case "booking":
      return {
        stagingTitle: "Booking widget preview",
        stagingDescription: "Review the public reservation flow, visual style and test-booking experience before launch.",
        stagingPlaceholder: "A booking widget preview or test link will appear here when the system enters testing.",
        deliveryTitle: "Booking launch handoff",
        deliveryItems: [
          "Reservation rules and capacity confirmed",
          "Testing link or widget preview",
          "Usage manual and embed/integration notes",
        ],
        phaseMessages: {
          requirements: "We are validating opening hours, capacity, resources and booking policies.",
          design: "Rules are being translated into widget structure and customer-facing flow.",
          development: "Reservation logic and resource handling are being built.",
          review: "Test bookings should be reviewed before the widget is integrated.",
          launch: "The booking system is ready for delivery or live integration.",
        },
      }
    case "crm":
      return {
        stagingTitle: "CRM workspace preview",
        stagingDescription: "Review how leads, client records, notes and follow-up actions will be organized.",
        stagingPlaceholder: "A CRM preview or workspace link will appear here when the structure is ready.",
        deliveryTitle: "CRM workspace handoff",
        deliveryItems: [
          "Pipeline and fields confirmed",
          "Client records and notes workflow",
          "Import or form-connection notes",
        ],
        phaseMessages: {
          requirements: "We are confirming lead fields, services catalogue and pipeline stages.",
          design: "The CRM data model and workspace structure are being defined.",
          development: "Migration, forms and follow-up workflow are being implemented.",
          review: "Forms and lead records should be reviewed before handoff.",
          launch: "The CRM workspace is ready for day-to-day use.",
        },
      }
    case "automation":
      return {
        stagingTitle: "Automation simulation",
        stagingDescription: "Review sample messages and trigger logic before anything reaches real customers.",
        stagingPlaceholder: "A test message or simulation link will appear here once the flows are in review.",
        deliveryTitle: "Automation activation handoff",
        deliveryItems: [
          "Channels and sender context confirmed",
          "Message templates reviewed",
          "Activation notes for approved flows",
        ],
        phaseMessages: {
          requirements: "We are confirming channels, brand tone and first automation goals.",
          design: "APIs, webhooks and message structure are being planned.",
          development: "Triggers and templates are being prepared for testing.",
          review: "Test messages should be reviewed before activation.",
          launch: "Approved automations are ready for production use.",
        },
      }
    case "dashboard":
      return {
        stagingTitle: "Dashboard mockup preview",
        stagingDescription: "Review how staff roles, KPIs, internal notes and operational views will be arranged.",
        stagingPlaceholder: "A dashboard mockup or staging link will appear here when views are ready.",
        deliveryTitle: "Management dashboard handoff",
        deliveryItems: [
          "Roles and permissions confirmed",
          "KPI/data source structure",
          "Internal operating notes area",
        ],
        phaseMessages: {
          requirements: "We are confirming staff roles, permissions, KPIs and operational protocols.",
          design: "The dashboard views and data visibility are being structured.",
          development: "Permissions, records and internal notes are being implemented.",
          review: "Internal testing should confirm the dashboard reflects daily operations.",
          launch: "The management dashboard is ready for team use.",
        },
      }
    case "web_seo":
      return {
        stagingTitle: "Website preview",
        stagingDescription: "Review the public pages, service structure, lead capture and SEO-ready content.",
        stagingPlaceholder: "A website preview link will appear here when the first layout is ready.",
        deliveryTitle: "Website launch handoff",
        deliveryItems: [
          "Public pages and lead form",
          "SEO-ready services structure",
          "Launch checklist and handoff notes",
        ],
        phaseMessages: {
          requirements: "We are collecting brand assets, service pages, references and local SEO context.",
          design: "The website structure and visual direction are being prepared.",
          development: "The public pages and lead capture flow are being built.",
          review: "Copy, images, SEO and CTAs should be reviewed before launch.",
          launch: "The website is ready for public launch or final handoff.",
        },
      }
    default:
      return {
        stagingTitle: "Service preview",
        stagingDescription: "Review the current service preview before launch.",
        stagingPlaceholder: "A preview link will appear here when available.",
        deliveryTitle: "Service delivery",
        deliveryItems: [
          "Project scope confirmed",
          "Materials reviewed",
          "Delivery notes prepared",
        ],
        phaseMessages: {
          requirements: "We are confirming the service requirements.",
          design: "The service structure is being prepared.",
          development: "The service is being implemented.",
          review: "The service is ready for review.",
          launch: "The service is ready for delivery.",
        },
      }
  }
}

function serviceHandoffPlan(projectKey: string): ServiceHandoffPlan {
  switch (projectKey) {
    case "booking":
      return {
        title: "Booking System delivery package",
        summary: "The booking track ends with a usable reservation flow, operating rules and clear launch notes for daily reservation management.",
        deliverables: [
          "Public booking widget or test reservation link",
          "Opening hours, resources, capacity and cancellation policy summary",
          "Usage manual, admin access notes and embed/integration instructions",
        ],
        clientChecks: [
          "Run a simulated booking from the visitor point of view",
          "Check resources, slot duration, capacity and minimum notice",
          "Confirm cancellation and delay text before live launch",
        ],
        futureWork: [
          "Google/Apple Calendar sync",
          "Stripe deposits or paid reservations",
          "WhatsApp/SMS reminder chains",
        ],
      }
    case "crm":
      return {
        title: "CRM / Lead Management handoff",
        summary: "The CRM track delivers a controlled lead-to-client workspace with clear fields, statuses, notes and follow-up habits.",
        deliverables: [
          "Client list/detail workspace and status pipeline",
          "Internal notes and follow-up workflow",
          "Lead source, form connection or migration notes",
        ],
        clientChecks: [
          "Confirm field names match daily business language",
          "Review pipeline statuses with real lead examples",
          "Check that old imports or web forms are clearly documented",
        ],
        futureWork: [
          "Automated lead-to-client conversion",
          "Service history and payment-triggered updates",
          "Advanced multi-user CRM permissions",
        ],
      }
    case "automation":
      return {
        title: "Workflow Automation activation pack",
        summary: "The automation track delivers approved message flows, safe testing notes and a boundary between active automations and future channels.",
        deliverables: [
          "Active trigger/action list and message templates",
          "Test-send or staging validation notes",
          "Pause, rollback and monitoring instructions",
        ],
        clientChecks: [
          "Read each message as if it reached a real customer",
          "Confirm timing, tone, channels and consent assumptions",
          "Approve only the flows that should go live now",
        ],
        futureWork: [
          "WhatsApp Business and SMS integrations",
          "Sector-specific loyalty and review campaigns",
          "Cross-system webhooks with external tools",
        ],
      }
    case "dashboard":
      return {
        title: "Management Dashboard delivery package",
        summary: "The dashboard track delivers the internal operating view, role notes and KPI/source definitions needed for the business to run work more clearly.",
        deliverables: [
          "Owner/admin view, staff view notes and role assumptions",
          "KPI definitions and data source summary",
          "Internal notes and operating protocol section",
        ],
        clientChecks: [
          "Confirm who should see sensitive metrics",
          "Review KPI labels and operational protocols",
          "Test the dashboard with real daily scenarios",
        ],
        futureWork: [
          "Realtime Kanban or staff task board",
          "Richer customer record attachments",
          "Advanced analytics and BI reporting",
        ],
      }
    case "web_seo":
      return {
        title: "Website and SEO launch handoff",
        summary: "The Web/SEO track delivers the public presence, lead capture path and launch notes needed to turn visitors into workable requests.",
        deliverables: [
          "Public pages, service pages and contact/lead form",
          "SEO-ready structure, local keywords and metadata notes",
          "Launch checklist with domain, content and follow-up notes",
        ],
        clientChecks: [
          "Read homepage, services and contact copy end to end",
          "Check images, logo, legal pages and CTA wording",
          "Submit a test lead and confirm the team receives it",
        ],
        futureWork: [
          "Advanced content/blog SEO calendar",
          "A/B tests and conversion analytics",
          "Client portal integration on the public website",
        ],
      }
    default:
      return {
        title: "Service delivery handoff",
        summary: "The selected service track keeps final deliverables, review actions and future improvements separate.",
        deliverables: [
          "Approved scope and final service notes",
          "Client-facing links or documentation",
          "Support and follow-up instructions",
        ],
        clientChecks: [
          "Review the service output before launch",
          "Send feedback on unclear or missing parts",
          "Confirm what should stay future work",
        ],
        futureWork: [
          "Advanced integrations",
          "Automation improvements",
          "Additional service modules",
        ],
      }
  }
}

function serviceTrackGuide(projectKey: string): ServiceTrackGuide {
  switch (projectKey) {
    case "booking":
      return {
        headline: "Booking rules, widget feedback and launch handoff",
        summary: "This track keeps reservation logic, availability rules and widget review separate from other work.",
        clientFocus: [
          "Confirm opening hours, slot duration and minimum notice.",
          "Review resources such as tables, rooms, doctors or advisors.",
          "Send feedback on the public booking widget before launch.",
        ],
        delivery: [
          "Testing link for simulated reservations.",
          "Admin access or usage manual after launch.",
          "Final embed code or integration notes.",
        ],
      }
    case "crm":
      return {
        headline: "Lead fields, contact migration and workspace delivery",
        summary: "This track prepares the private CRM so leads become workable client records with notes and follow-up.",
        clientFocus: [
          "Define the services/products that should appear in customer history.",
          "Confirm pipeline statuses and required lead fields.",
          "Upload or link the old contact list when migration is needed.",
        ],
        delivery: [
          "Client list and detail workspace.",
          "Follow-up notes and status workflow.",
          "Public form or webhook connection notes.",
        ],
      }
    case "automation":
      return {
        headline: "Messaging flows, tone and testing",
        summary: "This track documents which repetitive messages can be automated and how they should sound.",
        clientFocus: [
          "Confirm active channels such as email, WhatsApp or SMS.",
          "Describe brand tone and language rules.",
          "Choose the first automation goals before advanced flows.",
        ],
        delivery: [
          "Staging test message for review.",
          "Approved Resend email flows.",
          "Future WhatsApp/SMS upgrade notes if needed.",
        ],
      }
    case "dashboard":
      return {
        headline: "Roles, KPIs and internal operating rules",
        summary: "This track prepares the internal management dashboard around staff permissions and daily operations.",
        clientFocus: [
          "Define staff roles and who should see which information.",
          "List protocols, exceptions and internal rules.",
          "Confirm the KPIs that matter before advanced analytics.",
        ],
        delivery: [
          "Owner/admin operational view.",
          "Employee-safe task or service view.",
          "Internal notes and KPI review area.",
        ],
      }
    case "web_seo":
      return {
        headline: "Website structure, brand material and local SEO",
        summary: "This track prepares the public website, lead capture and SEO structure that supports the business offer.",
        clientFocus: [
          "Confirm brand assets, services and business photos.",
          "Review page copy, trust/legal text and CTAs.",
          "Share local SEO keywords and competitor references.",
        ],
        delivery: [
          "Public website pages and lead form.",
          "SEO-ready service structure.",
          "Launch checklist and handoff notes.",
        ],
      }
    default:
      return {
        headline: "Service requirements and delivery handoff",
        summary: "This track keeps the service scope, feedback and delivery materials together.",
        clientFocus: [
          "Confirm the business need.",
          "Share files, links and feedback for the selected service.",
          "Review staging before launch.",
        ],
        delivery: [
          "Project status updates.",
          "Reviewed materials.",
          "Final delivery notes.",
        ],
      }
  }
}

function projectFeedbackPlaceholder(projectKey: string) {
  switch (projectKey) {
    case "web_seo":
      return "Example: The homepage copy is good, but please replace the clinic image and make the booking CTA clearer."
    case "booking":
      return "Example: Please add a 15-minute buffer between appointments and block Sunday bookings."
    case "crm":
      return "Example: The pipeline needs a follow-up status between contacted and appointment scheduled."
    case "automation":
      return "Example: Send a reminder only after two days without response, not immediately."
    case "dashboard":
      return "Example: Weekly revenue and booking conversion should be visible before advanced metrics."
    default:
      return "Add clear feedback for this selected project track."
  }
}

function projectAssetPlaceholder(projectKey: string) {
  switch (projectKey) {
    case "web_seo":
      return "Example: Use these clinic photos for the homepage and keep the logo on a dark background."
    case "booking":
      return "Example: These files contain opening hours, appointment types and cancellation rules."
    case "crm":
      return "Example: These notes describe the current lead statuses, fields and follow-up process."
    case "automation":
      return "Example: This workflow map shows the trigger, action and exception cases to automate."
    case "dashboard":
      return "Example: This sheet defines the KPIs and data sources that should appear in the dashboard."
    default:
      return "Explain what the uploaded material contains and how it should be used."
  }
}

function projectLinkPlaceholder(projectKey: string) {
  switch (projectKey) {
    case "web_seo":
      return "https://drive.google.com/.../brand-assets"
    case "booking":
      return "https://calendar.example.com/opening-hours"
    case "crm":
      return "https://docs.example.com/current-pipeline"
    case "automation":
      return "https://miro.com/.../workflow-map"
    case "dashboard":
      return "https://sheets.google.com/.../kpi-definitions"
    default:
      return "https://example.com/project-reference"
  }
}

function projectPhaseLabels(projectKey?: string | null) {
  if (!projectKey) {
    return defaultPhaseLabels
  }

  return phaseLabelsByProjectKey[projectKey] ?? defaultPhaseLabels
}

function projectPhaseLabel(phase: ClientProject["currentPhase"], projectKey?: string | null) {
  return projectPhaseLabels(projectKey).find((item) => item.key === phase)?.label || phase
}

function projectPhasePercent(phase: ClientProject["currentPhase"]) {
  const phaseIndex = defaultPhaseLabels.findIndex((item) => item.key === phase)
  const normalizedIndex = phaseIndex === -1 ? 0 : phaseIndex
  return `${((normalizedIndex + 1) / defaultPhaseLabels.length) * 100}%`
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

function priorityClass(priority: ClientCrmLeadPriority) {
  switch (priority) {
    case "urgent":
      return "text-xs font-semibold uppercase tracking-[0.12em] text-red-300"
    case "high":
      return "text-xs font-semibold uppercase tracking-[0.12em] text-amber-300"
    case "low":
      return "text-xs font-semibold uppercase tracking-[0.12em] text-white/35"
    default:
      return "text-xs font-semibold uppercase tracking-[0.12em] text-blue-300"
  }
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

function buildClientCrmRecentActivities(leads: ClientCrmLead[]) {
  return leads.flatMap((lead): ClientCrmRecentActivity[] => {
    const actionActivities = (lead.followUpActions || []).map((action) => ({
      id: `action:${action.id}`,
      leadId: lead.id,
      leadName: lead.fullName,
      label: `Action ${followUpStatusLabel(action.status).toLowerCase()}`,
      detail: action.title,
      timestamp: action.updatedAt || action.completedAt || action.createdAt,
      tone: "action" as const,
    }))

    const noteActivities = (lead.notes || []).map((note) => ({
      id: `note:${note.id}`,
      leadId: lead.id,
      leadName: lead.fullName,
      label: visibleNoteRoleLabel(note.authorRole),
      detail: note.content,
      timestamp: note.createdAt,
      tone: "note" as const,
    }))

    const eventActivities = (lead.events || [])
      .filter((event) => event.eventType === "lead_created" || event.eventType === "status_changed")
      .map((event) => ({
        id: `event:${event.id}`,
        leadId: lead.id,
        leadName: lead.fullName,
        label: event.eventType === "status_changed" ? "Status update" : "Lead created",
        detail: crmEventLabel(event),
        timestamp: event.createdAt,
        tone: "event" as const,
      }))

    return [...actionActivities, ...noteActivities, ...eventActivities]
  })
    .filter((activity) => Boolean(activity.timestamp))
    .sort((first, second) => timestampMs(second.timestamp) - timestampMs(first.timestamp))
    .slice(0, 6)
}

function activityToneClass(tone: ClientCrmRecentActivity["tone"]) {
  switch (tone) {
    case "action":
      return "bg-violet-300"
    case "note":
      return "bg-blue-300"
    default:
      return "bg-emerald-300"
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

function crmSuggestedNextAction(lead: ClientCrmLead) {
  if (lead.status === "won") {
    return "Prepare onboarding or service delivery handoff."
  }

  if (lead.status === "lost") {
    return "Keep the reason documented and archive from active follow-up."
  }

  if (lead.priority === "urgent") {
    return "Contact today and confirm the required next step."
  }

  switch (lead.status) {
    case "new_lead":
      return "Qualify the request and confirm contact details."
    case "contacted":
      return "Schedule the next conversation or appointment."
    case "appointment_scheduled":
      return "Prepare notes before the appointment."
    case "proposal_sent":
      return "Follow up on the proposal decision."
    default:
      return "Review the lead and add the next workspace note."
  }
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
