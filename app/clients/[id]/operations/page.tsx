"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft, BriefcaseBusiness, Calendar, CheckCircle2, Copy, FileText, KeyRound, Mail, MessageSquare, RefreshCw, Send, ShieldCheck, Wrench } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav"

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

type ClientInvitation = {
  id: string
  clientId: string
  email: string
  role: string
  status: string
  expiresAt: string
  acceptedAt: string | null
  revokedAt: string | null
  emailSent: boolean
  emailMessage: string | null
  invitationUrl: string | null
  createdAt: string
  updatedAt: string
}

type ClientCrmWebhookToken = {
  id: string
  clientId: string
  label: string
  tokenPrefix: string
  active: boolean
  apiKey?: string | null
  webhookUrl: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

type ClientCrmLeadNote = {
  id: string
  leadId: string
  content: string
  authorUsername?: string | null
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
  followUpActions?: ClientCrmFollowUpAction[]
  notes: ClientCrmLeadNote[]
  events: ClientCrmLeadEvent[]
  createdAt?: string | null
  updatedAt?: string | null
}

type OnboardingTask = {
  id: string
  title: string
  status: "pending" | "submitted" | "approved" | "rejected"
  required: boolean
  critical: boolean
  updatedAt?: string | null
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

type ClientProject = {
  id: string
  projectKey: string
  name: string
  currentPhase: string
  latestClientFeedback?: string | null
  revisionPendingAt?: string | null
  assets?: { id: string; status: "uploaded" | "approved" | "rejected"; uploadedAt?: string | null; reviewedAt?: string | null }[]
}

type ClientPortal = {
  contractApproved: boolean
  onboardingCompleted: boolean
  projects: ClientProject[]
}

type ClientHealthActivity = {
  id: string
  label: string
  detail: string
  timestamp?: string | null
  tone: "positive" | "warning" | "neutral"
}

const CLIENT_SERVICE_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

const CRM_LEAD_STATUSES = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "appointment_scheduled", label: "Appointment Scheduled" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
]

const CRM_LEAD_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
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

function crmStatusClass(status: string) {
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

function crmEventLabel(event: ClientCrmLeadEvent) {
  if (event.eventType === "lead_created") {
    return "Lead created"
  }

  if (event.eventType === "status_changed") {
    return `Status: ${event.fromStatus?.replaceAll("_", " ") || "unknown"} -> ${event.toStatus?.replaceAll("_", " ") || "unknown"}`
  }

  if (event.eventType === "note_added") {
    return "Note added"
  }

  return event.eventType.replaceAll("_", " ")
}

function buildClientHealthActivity(
  clientServices: ClientService[],
  invitations: ClientInvitation[],
  webhookTokens: ClientCrmWebhookToken[],
  crmLeads: ClientCrmLead[],
  onboardingDashboard: OnboardingDashboard | null,
  clientPortal: ClientPortal | null
) {
  const serviceActivity = clientServices.map((assignment) => ({
    id: `service:${assignment.id}`,
    label: "Service track",
    detail: `${assignment.service.name} is ${assignment.status.replaceAll("_", " ")}`,
    timestamp: assignment.updatedAt || assignment.createdAt,
    tone: assignment.status === "delivered" ? "positive" as const : "neutral" as const,
  }))

  const invitationActivity = invitations.slice(0, 3).map((invitation) => ({
    id: `invitation:${invitation.id}`,
    label: "Client access",
    detail: `${invitation.status.replaceAll("_", " ")} invitation for ${invitation.email}`,
    timestamp: invitation.updatedAt || invitation.acceptedAt || invitation.createdAt,
    tone: invitation.status === "accepted" ? "positive" as const : "neutral" as const,
  }))

  const webhookActivity = webhookTokens.slice(0, 3).map((token) => ({
    id: `webhook:${token.id}`,
    label: "CRM intake",
    detail: `${token.label} webhook is ${token.active ? "active" : "revoked"}`,
    timestamp: token.lastUsedAt || token.updatedAt || token.createdAt,
    tone: token.active ? "positive" as const : "warning" as const,
  }))

  const crmActivity = crmLeads.flatMap((lead) => {
    const latestFollowUp = [...(lead.followUpActions || [])]
      .sort((first, second) => timestampMs(second.updatedAt || second.createdAt) - timestampMs(first.updatedAt || first.createdAt))[0]

    return [
      {
        id: `lead:${lead.id}`,
        label: "CRM lead",
        detail: `${lead.fullName} is ${lead.status.replaceAll("_", " ")}`,
        timestamp: lead.updatedAt || lead.createdAt,
        tone: lead.priority === "urgent" ? "warning" as const : "neutral" as const,
      },
      latestFollowUp ? {
        id: `followup:${latestFollowUp.id}`,
        label: "Follow-up",
        detail: `${latestFollowUp.title} is ${latestFollowUp.status}`,
        timestamp: latestFollowUp.updatedAt || latestFollowUp.createdAt,
        tone: latestFollowUp.status === "open" ? "warning" as const : "positive" as const,
      } : null,
    ].filter(Boolean) as ClientHealthActivity[]
  })

  const onboardingActivity = onboardingDashboard?.tasks
    ?.filter((task) => task.submittedAt || task.approvedAt || task.rejectedAt || task.completedAt)
    .map((task) => ({
      id: `task:${task.id}`,
      label: "Onboarding",
      detail: `${task.title} is ${task.status}`,
      timestamp: task.rejectedAt || task.approvedAt || task.completedAt || task.submittedAt,
      tone: task.status === "rejected" ? "warning" as const : task.status === "approved" ? "positive" as const : "neutral" as const,
    })) ?? []

  const projectActivity = clientPortal?.projects
    ?.filter((project) => project.revisionPendingAt || project.latestClientFeedback)
    .map((project) => ({
      id: `project:${project.id}`,
      label: "Project track",
      detail: project.latestClientFeedback || `${project.name} is in ${project.currentPhase}`,
      timestamp: project.revisionPendingAt,
      tone: project.revisionPendingAt ? "warning" as const : "neutral" as const,
    })) ?? []

  return [
    ...serviceActivity,
    ...invitationActivity,
    ...webhookActivity,
    ...crmActivity,
    ...onboardingActivity,
    ...projectActivity,
  ]
    .filter((activity) => Boolean(activity.timestamp))
    .sort((first, second) => timestampMs(second.timestamp) - timestampMs(first.timestamp))
    .slice(0, 6)
}

function timestampMs(value?: string | null) {
  if (!value) {
    return 0
  }

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatCompactDate(value?: string | null) {
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

function healthToneClass(tone: ClientHealthActivity["tone"]) {
  if (tone === "positive") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
  }

  if (tone === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200"
  }

  return "border-white/10 bg-white/[0.04] text-white/55"
}

export default function ClientOperationsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [client, setClient] = useState<Client | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [clientServices, setClientServices] = useState<ClientService[]>([])
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [invitations, setInvitations] = useState<ClientInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [serviceNotes, setServiceNotes] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [assignmentError, setAssignmentError] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [addingNote, setAddingNote] = useState(false)
  const [noteError, setNoteError] = useState("")
  const [inviting, setInviting] = useState(false)
  const [invitationError, setInvitationError] = useState("")
  const [invitationNotice, setInvitationNotice] = useState("")
  const [latestInvitationUrl, setLatestInvitationUrl] = useState("")
  const [webhookTokens, setWebhookTokens] = useState<ClientCrmWebhookToken[]>([])
  const [creatingWebhook, setCreatingWebhook] = useState(false)
  const [webhookError, setWebhookError] = useState("")
  const [webhookNotice, setWebhookNotice] = useState("")
  const [latestWebhookKey, setLatestWebhookKey] = useState("")
  const [crmLeads, setCrmLeads] = useState<ClientCrmLead[]>([])
  const [onboardingDashboard, setOnboardingDashboard] = useState<OnboardingDashboard | null>(null)
  const [clientPortal, setClientPortal] = useState<ClientPortal | null>(null)
  const [crmActionId, setCrmActionId] = useState("")
  const [crmActionError, setCrmActionError] = useState("")
  const [crmActionNotice, setCrmActionNotice] = useState("")
  const [crmNoteDrafts, setCrmNoteDrafts] = useState<Record<string, string>>({})
  const [crmSearch, setCrmSearch] = useState("")
  const [crmStatusFilter, setCrmStatusFilter] = useState("all")
  const [crmPriorityFilter, setCrmPriorityFilter] = useState("all")
  const [showAllCrmLeads, setShowAllCrmLeads] = useState(false)

  const fetchClientData = useCallback(async () => {
    if (!id) {
      return
    }

    try {
      setLoading(true)
      setError("")

      const [
        clientResponse,
        servicesResponse,
        assignedResponse,
        notesResponse,
        invitationsResponse,
        webhooksResponse,
        crmLeadsResponse,
        onboardingResponse,
        portalResponse,
      ] = await Promise.all([
        fetch(`/api/internal/clients/${id}`, { cache: "no-store" }),
        fetch("/api/internal/services", { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/services`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/notes`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/invitations`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/crm-webhooks`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${id}/crm-leads`, { cache: "no-store" }),
        fetch(`/api/internal/onboarding/${id}`, { cache: "no-store" }),
        fetch(`/api/internal/client-portal/${id}`, { cache: "no-store" }),
      ])

      if ([clientResponse, servicesResponse, assignedResponse, notesResponse, invitationsResponse, webhooksResponse, crmLeadsResponse, onboardingResponse, portalResponse].some((response) => response.status === 401)) {
        router.replace("/admin/login")
        return
      }

      const clientData = await clientResponse.json().catch(() => ({ error: "Unexpected client response" }))
      const servicesData = await servicesResponse.json().catch(() => ({ error: "Unexpected services response" }))
      const assignedData = await assignedResponse.json().catch(() => ({ error: "Unexpected assigned services response" }))
      const notesData = await notesResponse.json().catch(() => ({ error: "Unexpected notes response" }))
      const invitationsData = await invitationsResponse.json().catch(() => ({ error: "Unexpected invitations response" }))
      const webhooksData = await webhooksResponse.json().catch(() => ({ error: "Unexpected CRM webhooks response" }))
      const crmLeadsData = await crmLeadsResponse.json().catch(() => ({ error: "Unexpected CRM leads response" }))
      const onboardingData = await onboardingResponse.json().catch(() => null)
      const portalData = await portalResponse.json().catch(() => null)

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

      if (!invitationsResponse.ok) {
        throw new Error(invitationsData?.message || invitationsData?.error || "Failed to fetch client invitations")
      }

      if (!webhooksResponse.ok) {
        throw new Error(webhooksData?.message || webhooksData?.error || "Failed to fetch CRM webhook tokens")
      }

      if (!crmLeadsResponse.ok) {
        throw new Error(crmLeadsData?.message || crmLeadsData?.error || "Failed to fetch client CRM leads")
      }

      setClient(clientData as Client)
      setServices(Array.isArray(servicesData) ? servicesData : [])
      setClientServices(Array.isArray(assignedData) ? assignedData : [])
      setNotes(Array.isArray(notesData) ? notesData : [])
      setInvitations(Array.isArray(invitationsData) ? invitationsData : [])
      setWebhookTokens(Array.isArray(webhooksData) ? webhooksData as ClientCrmWebhookToken[] : [])
      setCrmLeads(Array.isArray(crmLeadsData) ? crmLeadsData as ClientCrmLead[] : [])
      setOnboardingDashboard(onboardingResponse.ok ? onboardingData as OnboardingDashboard : null)
      setClientPortal(portalResponse.ok ? portalData as ClientPortal : null)
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

  const assignableServices = useMemo(() => {
    const assignedServiceIds = new Set(clientServices.map((assignment) => assignment.service.id))
    return services.filter((service) => service.active && !assignedServiceIds.has(service.id))
  }, [clientServices, services])

  const crmOpenCount = crmLeads.filter((lead) => !["won", "lost"].includes(lead.status)).length
  const crmUrgentCount = crmLeads.filter((lead) => lead.priority === "urgent").length
  const crmWonCount = crmLeads.filter((lead) => lead.status === "won").length
  const openFollowUpActionCount = crmLeads.reduce(
    (count, lead) => count + (lead.followUpActions || []).filter((action) => action.status === "open").length,
    0
  )
  const contractApproved = clientPortal?.contractApproved ?? onboardingDashboard?.contractApproved ?? false
  const onboardingCompleted = clientPortal?.onboardingCompleted ?? onboardingDashboard?.onboardingCompleted ?? false
  const activeServiceTracks = clientPortal?.projects?.length || clientServices.filter((assignment) => assignment.status !== "cancelled").length
  const pendingRequiredTasks = onboardingDashboard
    ? Math.max(onboardingDashboard.totalRequiredTasks - onboardingDashboard.completedRequiredTasks, 0)
    : null
  const submittedTasks = onboardingDashboard?.submittedTasks ?? 0
  const rejectedTasks = onboardingDashboard?.rejectedTasks ?? 0
  const acceptedInvitationCount = invitations.filter((invitation) => invitation.status === "accepted").length
  const activeWebhookCount = webhookTokens.filter((token) => token.active).length
  const healthWarnings = [
    !contractApproved,
    !onboardingCompleted,
    rejectedTasks > 0,
    crmUrgentCount > 0,
    openFollowUpActionCount > 0,
    acceptedInvitationCount === 0,
  ].filter(Boolean).length
  const healthActivities = useMemo(
    () => buildClientHealthActivity(clientServices, invitations, webhookTokens, crmLeads, onboardingDashboard, clientPortal),
    [clientPortal, clientServices, crmLeads, invitations, onboardingDashboard, webhookTokens]
  )
  const filteredCrmLeads = useMemo(() => {
    const normalizedSearch = crmSearch.trim().toLowerCase()

    return crmLeads.filter((lead) => {
      const haystack = [
        lead.fullName,
        lead.email,
        lead.phone,
        lead.source,
        lead.sectorType,
        ...Object.values(lead.sectorFields || {}),
        ...lead.notes.map((note) => note.content),
        ...(lead.events || []).map((event) => event.summary || event.eventType),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      const matchesStatus = crmStatusFilter === "all" || lead.status === crmStatusFilter
      const matchesPriority = crmPriorityFilter === "all" || lead.priority === crmPriorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [crmLeads, crmPriorityFilter, crmSearch, crmStatusFilter])
  const visibleCrmLeads = showAllCrmLeads ? filteredCrmLeads : filteredCrmLeads.slice(0, 6)

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
        router.replace("/admin/login")
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
      router.replace("/admin/login")
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

  const updateCrmLead = (updatedLead: ClientCrmLead) => {
    setCrmLeads((current) =>
      current.map((lead) => lead.id === updatedLead.id ? updatedLead : lead)
    )
  }

  const updateAdminCrmLeadStatus = async (leadId: string, status: string) => {
    try {
      setCrmActionId(`status:${leadId}`)
      setCrmActionError("")
      setCrmActionNotice("")

      const response = await fetch(`/api/internal/clients/${id}/crm-leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected CRM status response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update CRM lead status")
      }

      updateCrmLead(data as ClientCrmLead)
      setCrmActionNotice("CRM lead status updated.")
    } catch (err) {
      console.error(err)
      setCrmActionError(err instanceof Error ? err.message : "Could not update CRM lead status.")
    } finally {
      setCrmActionId("")
    }
  }

  const addAdminCrmLeadNote = async (event: React.FormEvent<HTMLFormElement>, leadId: string) => {
    event.preventDefault()

    const content = crmNoteDrafts[leadId]?.trim() || ""
    if (content.length < 2) {
      setCrmActionError("CRM note must contain at least 2 characters.")
      return
    }

    try {
      setCrmActionId(`note:${leadId}`)
      setCrmActionError("")
      setCrmActionNotice("")

      const response = await fetch(`/api/internal/clients/${id}/crm-leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected CRM note response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not add CRM lead note")
      }

      updateCrmLead(data as ClientCrmLead)
      setCrmNoteDrafts((current) => ({ ...current, [leadId]: "" }))
      setCrmActionNotice("CRM lead note added.")
    } catch (err) {
      console.error(err)
      setCrmActionError(err instanceof Error ? err.message : "Could not add CRM lead note.")
    } finally {
      setCrmActionId("")
    }
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
      setNoteError(err instanceof Error ? err.message : "Could not add note.")
    } finally {
      setAddingNote(false)
    }
  }

  const sendClientInvitation = async () => {
    try {
      setInviting(true)
      setInvitationError("")
      setInvitationNotice("")
      setLatestInvitationUrl("")

      const response = await fetch(`/api/internal/clients/${id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected invitation response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not create client invitation")
      }

      const invitation = data as ClientInvitation
      setInvitations((current) => [invitation, ...current])
      setLatestInvitationUrl(invitation.invitationUrl || "")
      setInvitationNotice(
        invitation.emailSent
          ? `Invitation sent to ${invitation.email}.`
          : invitation.emailMessage || "Invitation created, but email was not sent. Copy the activation link manually."
      )
    } catch (err) {
      console.error(err)
      setInvitationError(err instanceof Error ? err.message : "Could not create client invitation.")
    } finally {
      setInviting(false)
    }
  }

  const createCrmWebhookToken = async () => {
    try {
      setCreatingWebhook(true)
      setWebhookError("")
      setWebhookNotice("")
      setLatestWebhookKey("")

      const response = await fetch(`/api/internal/clients/${id}/crm-webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Website form" }),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected CRM webhook response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not create CRM webhook token")
      }

      const token = data as ClientCrmWebhookToken
      setWebhookTokens((current) => [token, ...current])
      setLatestWebhookKey(token.apiKey || "")
      setWebhookNotice("CRM webhook API key created. Copy it now; it will not be shown again.")
    } catch (err) {
      console.error(err)
      setWebhookError(err instanceof Error ? err.message : "Could not create CRM webhook token.")
    } finally {
      setCreatingWebhook(false)
    }
  }

  const revokeCrmWebhookToken = async (tokenId: string) => {
    try {
      setWebhookError("")
      setWebhookNotice("")

      const response = await fetch(`/api/internal/clients/${id}/crm-webhooks/${tokenId}/revoke`, {
        method: "PATCH",
      })

      const data = await response.json().catch(() => ({ error: "Unexpected CRM webhook revoke response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not revoke CRM webhook token")
      }

      setWebhookTokens((current) => current.map((token) => token.id === tokenId ? data as ClientCrmWebhookToken : token))
      setWebhookNotice("CRM webhook token revoked.")
    } catch (err) {
      console.error(err)
      setWebhookError(err instanceof Error ? err.message : "Could not revoke CRM webhook token.")
    }
  }

  const copyText = async (value: string) => {
    if (!value) {
      return
    }

    await navigator.clipboard.writeText(value)
    setWebhookNotice("Copied.")
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
        <AdminWorkspaceNav active="client" clientId={client.id} className="mb-6" />

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

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <h2 className="text-xl font-semibold">Client Health</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Operational readiness summary for this client workspace: access, contract, service tracks, onboarding,
                CRM follow-up and intake wiring.
              </p>
            </div>
            <span className={healthWarnings === 0 ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300" : "rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-200"}>
              {healthWarnings === 0 ? "Ready" : `${healthWarnings} attention ${healthWarnings === 1 ? "item" : "items"}`}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">Contract</p>
              <p className={contractApproved ? "mt-2 font-semibold text-emerald-200" : "mt-2 font-semibold text-amber-200"}>
                {contractApproved ? "Approved" : onboardingDashboard?.contractSubmitted ? "Submitted" : "Locked"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">Onboarding</p>
              <p className={onboardingCompleted ? "mt-2 font-semibold text-emerald-200" : "mt-2 font-semibold text-blue-200"}>
                {onboardingCompleted ? "Complete" : pendingRequiredTasks === null ? "Not loaded" : `${pendingRequiredTasks} pending`}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">Tracks</p>
              <p className="mt-2 font-semibold text-white/85">{activeServiceTracks}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">CRM Actions</p>
              <p className={openFollowUpActionCount > 0 ? "mt-2 font-semibold text-amber-200" : "mt-2 font-semibold text-emerald-200"}>
                {openFollowUpActionCount}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">Access</p>
              <p className={acceptedInvitationCount > 0 ? "mt-2 font-semibold text-emerald-200" : "mt-2 font-semibold text-amber-200"}>
                {acceptedInvitationCount > 0 ? "Accepted" : invitations.length > 0 ? "Invited" : "Not invited"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">Intake</p>
              <p className={activeWebhookCount > 0 ? "mt-2 font-semibold text-emerald-200" : "mt-2 font-semibold text-white/50"}>
                {activeWebhookCount > 0 ? `${activeWebhookCount} active` : "No key"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Action cues</p>
              <div className="mt-4 space-y-2 text-sm">
                {!contractApproved && (
                  <Link href={`/admin/onboarding/${client.id}`} className="block rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-100 hover:text-white">
                    Review or approve contract evidence
                  </Link>
                )}
                {submittedTasks > 0 && (
                  <Link href={`/admin/onboarding/${client.id}`} className="block rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-blue-100 hover:text-white">
                    {submittedTasks} submitted onboarding task{submittedTasks === 1 ? "" : "s"} need review
                  </Link>
                )}
                {rejectedTasks > 0 && (
                  <Link href={`/admin/onboarding/${client.id}`} className="block rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-100 hover:text-white">
                    {rejectedTasks} rejected onboarding task{rejectedTasks === 1 ? "" : "s"} still visible
                  </Link>
                )}
                {openFollowUpActionCount > 0 && (
                  <Link href={`/clients/${client.id}/crm`} className="block rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-violet-100 hover:text-white">
                    Close {openFollowUpActionCount} CRM follow-up action{openFollowUpActionCount === 1 ? "" : "s"}
                  </Link>
                )}
                {healthWarnings === 0 && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-100">
                    No immediate client health warnings.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Recent workspace activity</p>
                <span className="text-xs text-white/30">{healthActivities.length} shown</span>
              </div>
              {healthActivities.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-white/15 px-3 py-3 text-sm text-white/35">
                  No recent operational activity was found for this client yet.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {healthActivities.map((activity) => (
                    <div key={activity.id} className={`rounded-lg border px-3 py-3 text-sm ${healthToneClass(activity.tone)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{activity.label}</p>
                          <p className="mt-2 line-clamp-2 text-white/85">{activity.detail}</p>
                        </div>
                        <span className="shrink-0 text-[11px] opacity-60">{formatCompactDate(activity.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-violet-300" />
                    <h2 className="text-xl font-semibold">Client CRM Overview</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Admin-only read view of this client&apos;s private CRM pipeline. This does not impersonate the client.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/clients/${client.id}/workspace`}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:text-white"
                  >
                    Command Center
                  </Link>
                  <Link
                    href={`/clients/${client.id}/crm`}
                    className="inline-flex items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 hover:text-white"
                  >
                    Open CRM
                  </Link>
                  <Link
                    href={`/admin/onboarding/${client.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/60 hover:text-white"
                  >
                    Project workspace
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/35">Total</p>
                  <p className="mt-2 text-2xl font-semibold">{crmLeads.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/35">Open</p>
                  <p className="mt-2 text-2xl font-semibold text-blue-200">{crmOpenCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/35">Urgent</p>
                  <p className="mt-2 text-2xl font-semibold text-red-200">{crmUrgentCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/35">Won</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">{crmWonCount}</p>
                </div>
              </div>

              {crmActionError && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {crmActionError}
                </div>
              )}

              {crmActionNotice && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {crmActionNotice}
                </div>
              )}

              {crmLeads.length > 0 && (
                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
                  <input
                    value={crmSearch}
                    onChange={(event) => setCrmSearch(event.target.value)}
                    placeholder="Search CRM leads, source, sector fields or notes..."
                    className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
                  />
                  <select
                    value={crmStatusFilter}
                    onChange={(event) => setCrmStatusFilter(event.target.value)}
                    className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="all">All statuses</option>
                    {CRM_LEAD_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={crmPriorityFilter}
                    onChange={(event) => setCrmPriorityFilter(event.target.value)}
                    className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="all">All priorities</option>
                    {CRM_LEAD_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setCrmSearch("")
                      setCrmStatusFilter("all")
                      setCrmPriorityFilter("all")
                      setShowAllCrmLeads(false)
                    }}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/60 hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              )}

              {crmLeads.length === 0 ? (
                <div className="mt-5 rounded-xl border border-white/10 bg-[#0b1220] p-4 text-sm text-white/40">
                  No private CRM leads stored for this client yet.
                </div>
              ) : filteredCrmLeads.length === 0 ? (
                <div className="mt-5 rounded-xl border border-white/10 bg-[#0b1220] p-4 text-sm text-white/40">
                  No CRM leads match the current filters.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {visibleCrmLeads.map((lead) => (
                    <div key={lead.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-semibold">{lead.fullName}</h3>
                          <p className="mt-1 text-sm text-white/45">
                            {[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact detail"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={lead.status}
                            disabled={crmActionId === `status:${lead.id}`}
                            onChange={(event) => void updateAdminCrmLeadStatus(lead.id, event.target.value)}
                            className={`rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-50 ${crmStatusClass(lead.status)}`}
                          >
                            {CRM_LEAD_STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                          <span className={lead.priority === "urgent" ? "rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-300" : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60"}>
                            {lead.priority}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Source</p>
                          <p className="mt-2 text-white/70">{lead.source?.replaceAll("_", " ") || "unknown"}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Sector</p>
                          <p className="mt-2 text-white/70">{lead.sectorType?.replaceAll("_", " ") || "custom"}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Created</p>
                          <p className="mt-2 text-white/70">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "Unknown"}</p>
                        </div>
                      </div>

                      {Object.keys(lead.sectorFields || {}).length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {Object.entries(lead.sectorFields).slice(0, 4).map(([key, value]) => (
                            <span key={key} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-100">
                              {key.replaceAll("_", " ")}: {value}
                            </span>
                          ))}
                        </div>
                      )}

                      {lead.notes.length > 0 && (
                        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/55">
                          Latest note: {lead.notes[lead.notes.length - 1].content}
                        </p>
                      )}

                      {(lead.events || []).length > 0 && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Recent timeline</p>
                          <div className="mt-3 space-y-2">
                            {[...(lead.events || [])].slice(-4).reverse().map((event) => (
                              <div key={event.id} className="border-l border-violet-400/40 pl-3 text-sm">
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                  <p className="font-medium text-white/75">{crmEventLabel(event)}</p>
                                  <p className="text-xs text-white/30">
                                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : "Unknown time"}
                                  </p>
                                </div>
                                <p className="mt-1 text-xs text-white/40">
                                  {(event.actorUsername || event.actorRole || "system").replaceAll("_", " ")}
                                  {event.summary ? ` · ${event.summary}` : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <form onSubmit={(event) => void addAdminCrmLeadNote(event, lead.id)} className="mt-4 flex flex-col gap-3">
                        <textarea
                          value={crmNoteDrafts[lead.id] || ""}
                          onChange={(event) => setCrmNoteDrafts((current) => ({ ...current, [lead.id]: event.target.value }))}
                          placeholder="Add an admin CRM note..."
                          rows={2}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
                        />
                        <button
                          disabled={crmActionId === `note:${lead.id}` || (crmNoteDrafts[lead.id] || "").trim().length < 2}
                          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white disabled:opacity-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {crmActionId === `note:${lead.id}` ? "Adding..." : "Add CRM Note"}
                        </button>
                      </form>
                    </div>
                  ))}
                  {filteredCrmLeads.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCrmLeads((current) => !current)}
                      className="inline-flex rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/60 hover:text-white"
                    >
                      {showAllCrmLeads ? "Show latest 6" : `Show all ${filteredCrmLeads.length} CRM leads`}
                    </button>
                  )}
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
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-300" />
                  <h2 className="text-lg font-semibold">Client Access</h2>
                </div>
                <p className="text-sm text-white/40 mb-4">
                  Invite this client to activate their private workspace and complete onboarding.
                </p>

                {invitationError && (
                  <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {invitationError}
                  </div>
                )}
                {invitationNotice && (
                  <div className="mb-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                    {invitationNotice}
                  </div>
                )}

                <button
                  type="button"
                  onClick={sendClientInvitation}
                  disabled={inviting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {inviting ? "Sending invitation..." : "Send client invitation"}
                </button>

                {latestInvitationUrl && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-[#0b1220] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Activation link</p>
                    <a href={latestInvitationUrl} className="mt-2 block break-all text-sm text-blue-200 hover:text-white">
                      {latestInvitationUrl}
                    </a>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {invitations.slice(0, 3).map((invitation) => (
                    <div key={invitation.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-white/75">{invitation.email}</span>
                        <span className={statusClass(invitation.status)}>
                          {invitation.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-white/35">
                        {invitation.emailSent ? "Email sent" : invitation.emailMessage || "Email not sent"} · expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {invitations.length === 0 && (
                    <p className="text-sm text-white/35">No client invitations yet.</p>
                  )}
                </div>
              </section>

              <section className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-5 h-5 text-violet-300" />
                  <h2 className="text-lg font-semibold">CRM Webhooks</h2>
                </div>
                <p className="text-sm text-white/40 mb-4">
                  Generate a private API key so this client&apos;s website forms can send leads into their CRM.
                </p>

                {webhookError && (
                  <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {webhookError}
                  </div>
                )}
                {webhookNotice && (
                  <div className="mb-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                    {webhookNotice}
                  </div>
                )}

                <button
                  type="button"
                  onClick={createCrmWebhookToken}
                  disabled={creatingWebhook}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {creatingWebhook ? "Creating API key..." : "Create CRM webhook key"}
                </button>

                {latestWebhookKey && (
                  <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-100/60">Copy now</p>
                    <p className="mt-2 break-all rounded-lg bg-[#050810] p-3 font-mono text-xs text-violet-100">
                      {latestWebhookKey}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText(latestWebhookKey)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy API key
                    </button>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Webhook endpoint</p>
                  <p className="mt-2 break-all font-mono text-xs text-white/60">
                    {webhookTokens[0]?.webhookUrl || "/api/v1/client-crm/webhooks/leads"}
                  </p>
                  <p className="mt-2 text-xs text-white/35">
                    Send JSON with header <span className="font-mono text-white/60">X-Altaira-Webhook-Key</span>.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {webhookTokens.slice(0, 4).map((token) => (
                    <div key={token.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-white/75">{token.label}</span>
                        <span className={token.active ? "text-emerald-300" : "text-white/35"}>
                          {token.active ? "active" : "revoked"}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-xs text-white/35">{token.tokenPrefix}...</p>
                      <p className="mt-2 text-xs text-white/35">
                        {token.lastUsedAt ? `Last used ${new Date(token.lastUsedAt).toLocaleString()}` : "Not used yet"}
                      </p>
                      {token.active && (
                        <button
                          type="button"
                          onClick={() => revokeCrmWebhookToken(token.id)}
                          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-300 hover:text-red-200"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Revoke token
                        </button>
                      )}
                    </div>
                  ))}
                  {webhookTokens.length === 0 && (
                    <p className="text-sm text-white/35">No CRM webhook keys yet.</p>
                  )}
                </div>
              </section>

              <section className="border-t border-white/10 pt-6">
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
                    {assignableServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  {assignableServices.length === 0 && (
                    <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      All active services are already assigned to this client.
                    </p>
                  )}
                  <textarea
                    value={serviceNotes}
                    onChange={(event) => setServiceNotes(event.target.value)}
                    placeholder="Notes or scope for this service..."
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
                  />
                  <button
                    disabled={assigning || assignableServices.length === 0}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {assigning ? "Assigning..." : "Assign Service"}
                  </button>
                </form>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-white/45 text-sm mb-2">
                    <FileText className="w-4 h-4" />
                    Assignment model
                  </div>
                  <p className="text-sm text-white/45">
                    A client can have one or more services. Each assignment has its own delivery status.
                  </p>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
