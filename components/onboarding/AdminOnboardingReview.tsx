"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, Copy, Download, ExternalLink, FileText, Link2, RefreshCw, RotateCcw, Save, Send, X } from "lucide-react"
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav"

type OnboardingTask = {
  id: string
  clientId: string
  clientServiceId: string | null
  serviceKey: string
  sectorType: string
  taskKey: string
  title: string
  description: string
  taskType: "signature" | "file_upload" | "preferences_form"
  status: "pending" | "submitted" | "approved" | "rejected"
  required: boolean
  critical: boolean
  sortOrder: number
  dataJson?: string | null
  fileMetadataJson?: string | null
  signatureFullName?: string | null
  signatureDocumentId?: string | null
  signatureConsent: boolean
  adminFeedback?: string | null
  submittedAt?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  completedAt?: string | null
}

type OnboardingFileMetadata = {
  id?: string
  originalFilename?: string
  name?: string
  contentType?: string
  sizeBytes?: number
  size?: number
  checksumSha256?: string
  createdAt?: string
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
  contractSubmittedAt?: string | null
  contractApprovedAt?: string | null
  client: {
    id: string
    name: string
    company: string
    email: string
    sectorType?: string | null
  }
  tasks: OnboardingTask[]
}

type ProjectPhase = "requirements" | "design" | "development" | "review" | "launch"

type ProjectPhaseDefinition = {
  value: ProjectPhase
  label: string
}

type AdminServiceOperationsGuide = {
  minimumScope: string[]
  advancedScope: string[]
  adminChecklist: string[]
}

type AdminDeliveryHandoffGuide = {
  clientHandoff: string[]
  adminVerification: string[]
  futureBoundary: string[]
}

type ServiceReviewerItem = {
  label: string
  value: string
  status: "ready" | "review" | "missing"
  note: string
}

type ClientProject = {
  id: string
  clientServiceId?: string | null
  projectKey: string
  name: string
  currentPhase: ProjectPhase
  stagingUrl?: string | null
  latestClientFeedback?: string | null
  revisionPendingAt?: string | null
  assets?: ClientProjectAsset[]
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

type ClientProjectConfigSnapshot = {
  id: string
  projectId: string
  clientId: string
  serviceKey: string
  artifactType: string
  label: string
  configJson: string
  createdByUsername?: string | null
  createdAt?: string | null
}

type ServiceConfigSnapshotPayload = {
  label: string
  artifactType: string
  configJson: string
}

type ClientPortal = {
  contractApproved: boolean
  onboardingCompleted: boolean
  projects: ClientProject[]
}

const projectPhaseOptions: ProjectPhaseDefinition[] = [
  { value: "requirements", label: "Requirements" },
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "review", label: "Review" },
  { value: "launch", label: "Launch" },
]

const projectPhaseOptionsByKey: Record<string, ProjectPhaseDefinition[]> = {
  web_seo: [
    { value: "requirements", label: "Content handoff" },
    { value: "design", label: "Visual structure" },
    { value: "development", label: "Build" },
    { value: "review", label: "SEO and review" },
    { value: "launch", label: "Launch" },
  ],
  booking: [
    { value: "requirements", label: "Onboarding completed" },
    { value: "design", label: "Rules configuration" },
    { value: "development", label: "Widget build" },
    { value: "review", label: "Booking test phase" },
    { value: "launch", label: "Web integration" },
  ],
  crm: [
    { value: "requirements", label: "Fields and catalogue" },
    { value: "design", label: "Data model" },
    { value: "development", label: "Contact migration" },
    { value: "review", label: "Form integration" },
    { value: "launch", label: "Workspace delivery" },
  ],
  automation: [
    { value: "requirements", label: "Goals and channels" },
    { value: "design", label: "API and webhook setup" },
    { value: "development", label: "Trigger build" },
    { value: "review", label: "Sending tests" },
    { value: "launch", label: "Production active" },
  ],
  dashboard: [
    { value: "requirements", label: "Roles and KPIs" },
    { value: "design", label: "View architecture" },
    { value: "development", label: "Permissions and data" },
    { value: "review", label: "Internal testing" },
    { value: "launch", label: "Panel delivery" },
  ],
}

export default function AdminOnboardingReview({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<OnboardingDashboard | null>(null)
  const [portal, setPortal] = useState<ClientPortal | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionTaskId, setActionTaskId] = useState<string | null>(null)
  const [projectActionId, setProjectActionId] = useState<string | null>(null)
  const [assetActionId, setAssetActionId] = useState<string | null>(null)
  const [snapshotActionId, setSnapshotActionId] = useState<string | null>(null)
  const [configSnapshotsByProjectId, setConfigSnapshotsByProjectId] = useState<Record<string, ClientProjectConfigSnapshot[]>>({})
  const [configSnapshotsLoadingProjectId, setConfigSnapshotsLoadingProjectId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [feedbackTask, setFeedbackTask] = useState<OnboardingTask | null>(null)
  const [copiedPromptTaskId, setCopiedPromptTaskId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [projectForm, setProjectForm] = useState({
    name: "Service project",
    currentPhase: "requirements" as ProjectPhase,
    stagingUrl: "",
  })
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const progress = useMemo(() => {
    if (!dashboard || dashboard.totalRequiredTasks === 0) {
      return 0
    }

    return Math.round((dashboard.completedRequiredTasks / dashboard.totalRequiredTasks) * 100)
  }, [dashboard])

  const selectedProject = useMemo(() => {
    if (!portal || portal.projects.length === 0) {
      return null
    }

    return portal.projects.find((project) => project.id === selectedProjectId) || portal.projects[0]
  }, [portal, selectedProjectId])

  const syncProjectForm = useCallback((nextPortal: ClientPortal) => {
    const nextProject = nextPortal.projects.find((project) => project.id === selectedProjectId) || nextPortal.projects[0]

    if (!nextProject) {
      setProjectForm({
        name: "Service project",
        currentPhase: "requirements",
        stagingUrl: "",
      })
      return
    }

    setSelectedProjectId(nextProject.id)
    setProjectForm({
      name: nextProject.name || "Service project",
      currentPhase: nextProject.currentPhase || "requirements",
      stagingUrl: nextProject.stagingUrl || "",
    })
  }, [selectedProjectId])

  const fetchDashboard = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const response = await fetch(`/api/internal/onboarding/${clientId}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected onboarding response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load onboarding.")
      }

      setDashboard(data as OnboardingDashboard)

      const portalResponse = await fetch(`/api/internal/client-portal/${clientId}`, { cache: "no-store" })
      const portalData = await portalResponse.json().catch(() => ({ error: "Unexpected client portal response" }))

      if (portalResponse.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!portalResponse.ok) {
        throw new Error(portalData?.message || portalData?.error || "Could not load client portal projects.")
      }

      const nextPortal = portalData as ClientPortal
      setPortal(nextPortal)
      syncProjectForm(nextPortal)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load onboarding.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [clientId, router, syncProjectForm])

  const fetchProjectConfigSnapshots = useCallback(async (projectId: string) => {
    setConfigSnapshotsLoadingProjectId(projectId)

    try {
      const response = await fetch(`/api/internal/client-projects/${projectId}/config-snapshots`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({ error: "Unexpected configuration snapshot response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load configuration snapshots.")
      }

      setConfigSnapshotsByProjectId((current) => ({
        ...current,
        [projectId]: Array.isArray(data) ? data as ClientProjectConfigSnapshot[] : [],
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load configuration snapshots.")
    } finally {
      setConfigSnapshotsLoadingProjectId((current) => current === projectId ? null : current)
    }
  }, [router])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    if (selectedProject?.id) {
      void fetchProjectConfigSnapshots(selectedProject.id)
    }
  }, [fetchProjectConfigSnapshots, selectedProject?.id])

  function selectProject(project: ClientProject) {
    setSelectedProjectId(project.id)
    setProjectForm({
      name: project.name || "Service project",
      currentPhase: project.currentPhase || "requirements",
      stagingUrl: project.stagingUrl || "",
    })
    setError("")
    setNotice("")
  }

  async function generateTasks() {
    await runDashboardAction(async () => {
      const response = await fetch(`/api/internal/onboarding/${clientId}`, {
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

      setDashboard(data as OnboardingDashboard)
      setNotice("Onboarding tasks generated or reused.")
    })
  }

  async function approveTask(taskId: string) {
    setActionTaskId(taskId)
    setError("")
    setNotice("")

    try {
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

      await fetchDashboard(true)
      setNotice("Task approved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve task.")
    } finally {
      setActionTaskId(null)
    }
  }

  async function rejectTask() {
    if (!feedbackTask) {
      return
    }

    if (feedback.trim().length < 4) {
      setError("Add clear feedback before rejecting a task.")
      return
    }

    setActionTaskId(feedbackTask.id)
    setError("")
    setNotice("")

    try {
      const response = await fetch(`/api/internal/onboarding/tasks/${feedbackTask.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected rejection response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not reject task.")
      }

      setFeedbackTask(null)
      setFeedback("")
      await fetchDashboard(true)
      setNotice("Task rejected and reopened for the client.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject task.")
    } finally {
      setActionTaskId(null)
    }
  }

  async function copyTaskPrompt(task: OnboardingTask) {
    if (!dashboard) {
      setError("Could not build prompt because the onboarding dashboard is not loaded.")
      return
    }

    const prompt = buildImplementationPrompt(task, dashboard)

    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPromptTaskId(task.id)
      setNotice("Implementation prompt copied.")
      setError("")
      window.setTimeout(() => setCopiedPromptTaskId(null), 2500)
    } catch {
      setError("Could not copy prompt. Select the prompt text manually if clipboard access is blocked.")
    }
  }

  async function updateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProject) {
      setError("No client project track exists yet. Assign an active service first.")
      return
    }

    setProjectActionId(selectedProject.id)
    setError("")
    setNotice("")

    try {
      const response = await fetch(`/api/internal/client-projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectForm),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected project update response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not update project.")
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
      setProjectForm({
        name: updatedProject.name,
        currentPhase: updatedProject.currentPhase,
        stagingUrl: updatedProject.stagingUrl || "",
      })
      setNotice("Project status updated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update project.")
    } finally {
      setProjectActionId(null)
    }
  }

  async function approveProjectAsset(assetId: string) {
    setAssetActionId(assetId)
    setError("")
    setNotice("")

    try {
      const response = await fetch(`/api/internal/client-project-assets/${assetId}/approve`, {
        method: "PATCH",
      })
      const data = await response.json().catch(() => ({ error: "Unexpected project asset approval response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not approve project asset.")
      }

      updateProjectAsset(data as ClientProjectAsset)
      setNotice("Project asset approved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve project asset.")
    } finally {
      setAssetActionId(null)
    }
  }

  async function rejectProjectAsset(asset: ClientProjectAsset) {
    const feedbackText = window.prompt("Feedback for the client", asset.adminFeedback || "")

    if (feedbackText === null) {
      return
    }

    if (feedbackText.trim().length < 4) {
      setError("Add clear feedback before rejecting a project asset.")
      return
    }

    setAssetActionId(asset.id)
    setError("")
    setNotice("")

    try {
      const response = await fetch(`/api/internal/client-project-assets/${asset.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback: feedbackText }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected project asset rejection response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not reject project asset.")
      }

      updateProjectAsset(data as ClientProjectAsset)
      setNotice("Project asset rejected with feedback.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject project asset.")
    } finally {
      setAssetActionId(null)
    }
  }

  async function saveProjectConfigSnapshot(payload: ServiceConfigSnapshotPayload) {
    if (!selectedProject) {
      setError("Select a project track before saving a configuration snapshot.")
      return
    }

    setSnapshotActionId(selectedProject.id)
    setError("")
    setNotice("")

    try {
      const response = await fetch(`/api/internal/client-projects/${selectedProject.id}/config-snapshots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected configuration snapshot save response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not save configuration snapshot.")
      }

      const createdSnapshot = data as ClientProjectConfigSnapshot
      setConfigSnapshotsByProjectId((current) => ({
        ...current,
        [selectedProject.id]: [
          createdSnapshot,
          ...(current[selectedProject.id] ?? []),
        ],
      }))
      setNotice("Configuration snapshot saved for this service track.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save configuration snapshot.")
    } finally {
      setSnapshotActionId(null)
    }
  }

  function updateProjectAsset(updatedAsset: ClientProjectAsset) {
    setPortal((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        projects: current.projects.map((project) => {
          if (project.id !== updatedAsset.projectId) {
            return project
          }

          return {
            ...project,
            assets: (project.assets ?? []).map((asset) => asset.id === updatedAsset.id ? updatedAsset : asset),
          }
        }),
      }
    })
  }

  async function runDashboardAction(action: () => Promise<void>) {
    setActionTaskId("dashboard")
    setError("")
    setNotice("")

    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dashboard action failed.")
    } finally {
      setActionTaskId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 border border-white/10 bg-white/[0.03] p-6 text-white/60">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-300" />
          Loading onboarding review...
        </div>
      </main>
    )
  }

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <BackLinks clientId={clientId} />
          <div className="mt-6 flex gap-3 border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <h1 className="font-semibold">Could not load onboarding</h1>
              <p className="mt-1 text-sm text-red-100/80">{error || "No onboarding workspace was returned."}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <BackLinks clientId={dashboard.client.id} />

        <section className="mt-6 border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-300">Admin onboarding review</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">{dashboard.client.company}</h1>
              <p className="mt-3 text-white/45">{dashboard.client.name} · {dashboard.client.email}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/35">
                Sector: {dashboard.client.sectorType || "not set"} · Workspace: {dashboard.status}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/[0.07] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={generateTasks}
                disabled={actionTaskId === "dashboard"}
                className="inline-flex items-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Generate / reuse tasks
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Metric label="Required" value={dashboard.totalRequiredTasks} />
            <Metric label="Approved" value={dashboard.completedRequiredTasks} />
            <Metric label="Submitted" value={dashboard.submittedTasks} />
            <Metric label="Rejected" value={dashboard.rejectedTasks} />
          </div>

          <div className="mt-6 border border-white/10 bg-[#0b1220] p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white/80">Required approval progress</span>
              <span className="font-semibold text-blue-200">{progress}%</span>
            </div>
            <div className="mt-3 h-2 bg-white/10">
              <div className="h-full bg-gradient-to-r from-blue-600 to-violet-600" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {error && (
            <div className="mt-5 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {notice && (
            <div className="mt-5 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </div>
          )}
        </section>

        <section className="mt-6 border border-white/10 bg-white/[0.03] p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Service project tracks</p>
              <h2 className="mt-3 text-2xl font-semibold">Client project control</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Select any active service track to update its phase, review client feedback and manage uploaded
                materials or links. The client only sees tracks that belong to their own workspace.
              </p>

              {portal && portal.projects.length > 0 && (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {portal.projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => selectProject(project)}
                      className={`border p-4 text-left transition ${
                        selectedProject?.id === project.id
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-white/10 bg-[#0b1220] hover:border-white/20"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                        {projectModuleTitle(project.projectKey)}
                      </p>
                      <h3 className="mt-2 font-semibold">{project.name}</h3>
                      <p className="mt-2 text-xs text-white/40">
                        {project.currentPhase} · {project.assets?.length ?? 0} materials
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selectedProject ? (
                <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <DataBox label="Current phase" value={projectPhaseLabel(selectedProject.currentPhase, selectedProject.projectKey)} />
                  <DataBox label="Revision pending" value={formatDate(selectedProject.revisionPendingAt)} />
                  <DataBox label="Project key" value={selectedProject.projectKey} />
                  <DataBox label="Client service" value={selectedProject.clientServiceId || "Not linked"} />
                </div>
              ) : (
                <div className="mt-5 border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
                  No project track exists yet. Assign an active service to this client, then refresh this page.
                </div>
              )}

              {selectedProject?.latestClientFeedback && (
                <div className="mt-5 border border-violet-500/20 bg-violet-500/10 p-4 text-sm leading-6 text-violet-100">
                  <span className="font-semibold">Latest client feedback:</span> {selectedProject.latestClientFeedback}
                </div>
              )}

              {selectedProject?.stagingUrl && (
                <Link
                  href={selectedProject.stagingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-blue-500/20"
                >
                  Open project URL
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}

              {selectedProject && (
                <>
                  <AdminServiceOperationsBlock projectKey={selectedProject.projectKey} />
                  <AdminPhaseGateChecklistBlock project={selectedProject} />
                  <AdminDeliveryHandoffBlock project={selectedProject} />
                  <AdminServiceDataSummaryBlock projectKey={selectedProject.projectKey} tasks={dashboard.tasks} />
                  <AdminServiceReviewerBlock
                    projectKey={selectedProject.projectKey}
                    tasks={dashboard.tasks}
                    onSaveSnapshot={saveProjectConfigSnapshot}
                    savingSnapshot={snapshotActionId === selectedProject.id}
                  />
                  <ProjectConfigSnapshotsBlock
                    snapshots={configSnapshotsByProjectId[selectedProject.id] ?? []}
                    loading={configSnapshotsLoadingProjectId === selectedProject.id}
                  />
                </>
              )}

              {selectedProject && (
                <div className="mt-6 border border-white/10 bg-[#0b1220] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Project materials</h3>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Files and links uploaded by the client for the selected{" "}
                        {projectModuleTitle(selectedProject.projectKey)} track. Download files, open links, approve
                        usable material or reject unclear material with feedback.
                      </p>
                    </div>
                    <span className="border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                      {selectedProject.assets?.length ?? 0} items
                    </span>
                  </div>

                  {selectedProject.assets && selectedProject.assets.length > 0 ? (
                    <div className="mt-5 grid gap-3">
                      {selectedProject.assets.map((asset) => (
                        <div key={asset.id} className="border border-white/10 bg-[#050810] p-4">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
                                {asset.assetType.replaceAll("_", " ")} · {asset.externalUrl ? "external link" : formatBytes(asset.sizeBytes)} · {asset.status}
                              </p>
                              {asset.notes && <p className="mt-2 text-sm leading-6 text-white/50">{asset.notes}</p>}
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
                                <p className="mt-2 border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
                                  Feedback: {asset.adminFeedback}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!asset.externalUrl && (
                                <Link
                                  href={`/api/internal/client-project-assets/${asset.id}/download`}
                                  className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.07]"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => approveProjectAsset(asset.id)}
                                disabled={assetActionId === asset.id}
                                className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectProjectAsset(asset)}
                                disabled={assetActionId === asset.id}
                                className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
                      No project materials or links uploaded yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={updateProject} className="border border-white/10 bg-[#0b1220] p-5">
              <h3 className="text-lg font-semibold">Update selected track</h3>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white/70">Project name</span>
                  <input
                    value={projectForm.name}
                    onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
                    disabled={!selectedProject || projectActionId === selectedProject.id}
                    className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white/70">Current phase</span>
                  <select
                    value={projectForm.currentPhase}
                    onChange={(event) => setProjectForm((current) => ({ ...current, currentPhase: event.target.value as ProjectPhase }))}
                    disabled={!selectedProject || projectActionId === selectedProject.id}
                    className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {projectPhaseOptionsFor(selectedProject?.projectKey).map((phase) => (
                      <option key={phase.value} value={phase.value}>{phase.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white/70">Staging URL</span>
                  <input
                    type="url"
                    value={projectForm.stagingUrl}
                    onChange={(event) => setProjectForm((current) => ({ ...current, stagingUrl: event.target.value }))}
                    disabled={!selectedProject || projectActionId === selectedProject.id}
                    placeholder="https://preview.example.com"
                    className="border border-white/10 bg-[#050810] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!selectedProject || projectActionId === selectedProject.id}
                  className="inline-flex items-center justify-center gap-2 border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {projectActionId === selectedProject?.id ? "Saving..." : "Save project"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {dashboard.tasks.map((task) => (
            <article key={task.id} className="border border-white/10 bg-white/[0.03] p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    {task.critical && <span className="border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Critical</span>}
                    {task.required && <span className="border border-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Required</span>}
                    <span className="border border-white/10 px-2 py-1 text-xs uppercase tracking-[0.16em] text-white/35">{task.taskType.replace("_", " ")}</span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold">{task.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">{task.description}</p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <DataBox label="Service key" value={task.serviceKey || "general"} />
                    <DataBox label="Sector" value={task.sectorType || "not set"} />
                    <DataBox label="Submitted" value={formatDate(task.submittedAt)} />
                    <DataBox label="Approved" value={formatDate(task.approvedAt)} />
                  </div>

                  {task.taskType === "signature" && (
                    <div className="mt-5 border border-white/10 bg-[#0b1220] p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                        <FileText className="h-4 w-4 text-blue-300" />
                        Signature evidence
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <DataBox label="Full name" value={task.signatureFullName || "Not submitted"} />
                        <DataBox label="DNI/CIF/NIE" value={task.signatureDocumentId || "Not submitted"} />
                        <DataBox label="Consent" value={task.signatureConsent ? "Accepted" : "Not accepted"} />
                      </div>
                    </div>
                  )}

                  {task.fileMetadataJson && <FileMetadataBlock value={task.fileMetadataJson} />}
                  {task.dataJson && <StructuredTaskDataBlock value={task.dataJson} />}
                  {task.status !== "pending" && task.taskType !== "signature" && (
                    <ImplementationPromptBlock
                      task={task}
                      dashboard={dashboard}
                      copied={copiedPromptTaskId === task.id}
                      onCopy={() => copyTaskPrompt(task)}
                    />
                  )}

                  {task.adminFeedback && (
                    <div className="mt-5 border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                      <span className="font-semibold">Admin feedback:</span> {task.adminFeedback}
                    </div>
                  )}
                </div>

                <div className="border border-white/10 bg-[#0b1220] p-5">
                  <h3 className="text-lg font-semibold">Review action</h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Approve submitted work or reject it with clear feedback so the client can correct it.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={() => approveTask(task.id)}
                      disabled={actionTaskId === task.id || task.status !== "submitted"}
                      className="inline-flex items-center justify-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Check className="h-4 w-4" />
                      Approve submitted task
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackTask(task)
                        setFeedback(task.adminFeedback || "")
                        setError("")
                      }}
                      disabled={actionTaskId === task.id || task.status === "pending"}
                      className="inline-flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <X className="h-4 w-4" />
                      Reject with feedback
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {feedbackTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4">
          <div className="w-full max-w-xl border border-white/10 bg-[#080d19] p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Reject task</p>
                <h2 className="mt-2 text-2xl font-semibold">{feedbackTask.title}</h2>
              </div>
              <button type="button" onClick={() => setFeedbackTask(null)} className="grid h-10 w-10 place-items-center border border-white/10 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-6 grid gap-2">
              <span className="text-sm font-semibold text-white/70">Feedback for client</span>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={5}
                className="border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400/60"
                placeholder="Explain what the client needs to correct..."
              />
            </label>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setFeedbackTask(null)} className="border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/10">
                Cancel
              </button>
              <button
                type="button"
                onClick={rejectTask}
                disabled={actionTaskId === feedbackTask.id}
                className="inline-flex items-center justify-center gap-2 border border-red-500 bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {actionTaskId === feedbackTask.id ? "Rejecting..." : "Send rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function BackLinks({ clientId }: { clientId: string }) {
  return (
    <AdminWorkspaceNav active="onboarding" clientId={clientId} />
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 bg-[#0b1220] p-4">
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.16em] text-white/40">{label}</div>
    </div>
  )
}

function AdminServiceOperationsBlock({ projectKey }: { projectKey: string }) {
  const guide = adminServiceOperationsGuide(projectKey)

  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-3">
      <div className="border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Minimum scope</p>
        <div className="mt-3 grid gap-2">
          {guide.minimumScope.map((item) => (
            <p key={item} className="text-sm leading-6 text-blue-50/75">{item}</p>
          ))}
        </div>
      </div>
      <div className="border border-violet-500/20 bg-violet-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">Advanced scope</p>
        <div className="mt-3 grid gap-2">
          {guide.advancedScope.map((item) => (
            <p key={item} className="text-sm leading-6 text-violet-50/75">{item}</p>
          ))}
        </div>
      </div>
      <div className="border border-white/10 bg-[#0b1220] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Admin checklist</p>
        <div className="mt-3 grid gap-2">
          {guide.adminChecklist.map((item) => (
            <p key={item} className="text-sm leading-6 text-white/60">{item}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminPhaseGateChecklistBlock({ project }: { project: ClientProject }) {
  const checklist = phaseGateChecklist(project.projectKey, project.currentPhase)

  return (
    <div className="mt-5 border border-white/10 bg-[#050810] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Phase gate checklist</p>
          <h3 className="mt-2 text-lg font-semibold">
            Before moving {projectModuleTitle(project.projectKey)} past {projectPhaseLabel(project.currentPhase, project.projectKey)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Operational checklist for the admin before changing this service track phase. It is guidance only; the phase
            switch stays manual so the operator keeps control.
          </p>
        </div>
        <span className="border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
          {project.currentPhase}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {checklist.map((item) => (
          <div key={item} className="flex gap-3 border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/65">
            <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminDeliveryHandoffBlock({ project }: { project: ClientProject }) {
  const guide = adminDeliveryHandoffGuide(project.projectKey)
  const launched = project.currentPhase === "launch"

  return (
    <div className="mt-5 border border-blue-500/20 bg-blue-500/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Delivery handoff control</p>
          <h3 className="mt-2 text-lg font-semibold">{projectModuleTitle(project.projectKey)} final handoff map</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Admin-only guide for what the client should receive, what must be checked before handoff and what should
            stay explicitly outside the first delivery.
          </p>
        </div>
        <span className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${launched ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100" : "border-white/10 text-white/40"}`}>
          {launched ? "launch phase" : "not launched"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <AdminDeliveryColumn title="Client handoff" items={guide.clientHandoff} tone="blue" />
        <AdminDeliveryColumn title="Admin verification" items={guide.adminVerification} tone="emerald" />
        <AdminDeliveryColumn title="Future boundary" items={guide.futureBoundary} tone="violet" />
      </div>
    </div>
  )
}

function AdminDeliveryColumn({ title, items, tone }: { title: string; items: string[]; tone: "blue" | "emerald" | "violet" }) {
  const toneClass = {
    blue: "text-blue-200",
    emerald: "text-emerald-200",
    violet: "text-violet-200",
  }[tone]

  return (
    <div className="border border-white/10 bg-[#050810] p-4">
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${toneClass}`}>{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-white/65">
            <Check className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminServiceDataSummaryBlock({ projectKey, tasks }: { projectKey: string; tasks: OnboardingTask[] }) {
  const serviceTasks = tasks.filter((task) => task.serviceKey === projectKey && task.status !== "pending")
  const taskData = serviceTasks
    .map((task) => ({ task, data: parseJsonObject(task.dataJson) }))
    .filter((entry): entry is { task: OnboardingTask; data: Record<string, unknown> } => Boolean(entry.data))
  const providedKeys = new Set(taskData.flatMap((entry) => Object.keys(entry.data)))
  const expectedFields = serviceExpectedFields(projectKey)
  const missingFields = expectedFields.filter((field) => !providedKeys.has(field))

  return (
    <div className="mt-5 border border-white/10 bg-[#0b1220] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Extracted service data</p>
          <h3 className="mt-2 text-lg font-semibold">{projectModuleTitle(projectKey)} review summary</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Consolidated from submitted onboarding tasks for this service track.
          </p>
        </div>
        <span className="border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
          {taskData.length} submitted forms
        </span>
      </div>

      {missingFields.length > 0 ? (
        <div className="mt-4 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <span className="font-semibold">Still useful to confirm:</span>{" "}
          {missingFields.map(humanizeKey).join(", ")}
        </div>
      ) : (
        <div className="mt-4 border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          The main expected fields for this track are present in submitted onboarding data.
        </div>
      )}

      {taskData.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {taskData.map(({ task, data }) => (
            <div key={task.id} className="border border-white/10 bg-[#050810] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{task.taskKey}</p>
                  <h4 className="mt-1 font-semibold text-white/85">{task.title}</h4>
                </div>
                <StatusBadge status={task.status} />
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {Object.entries(data)
                  .filter(([, value]) => value !== null && value !== undefined && value !== "")
                  .map(([key, value]) => (
                    <DataBox key={`${task.id}-${key}`} label={humanizeKey(key)} value={formatStructuredValue(value)} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 border border-white/10 bg-white/[0.02] p-4 text-sm text-white/45">
          No submitted structured forms yet for this service track.
        </div>
      )}
    </div>
  )
}

function AdminServiceReviewerBlock({
  projectKey,
  tasks,
  onSaveSnapshot,
  savingSnapshot = false,
}: {
  projectKey: string
  tasks: OnboardingTask[]
  onSaveSnapshot?: (payload: ServiceConfigSnapshotPayload) => void
  savingSnapshot?: boolean
}) {
  const [copiedConfig, setCopiedConfig] = useState(false)

  if (!supportsServiceReviewer(projectKey)) {
    return null
  }

  const data = collectServiceData(projectKey, tasks)
  const items = serviceReviewerItems(projectKey, data)
  const artifact = buildServiceConfigArtifact(projectKey, data, items)
  const artifactJson = JSON.stringify(artifact, null, 2)
  const reviewerMeta = serviceReviewerMeta(projectKey)
  const artifactLabel = `${reviewerMeta.title} configuration preview`
  const readyCount = items.filter((item) => item.status === "ready").length
  const missingCount = items.filter((item) => item.status === "missing").length
  const reviewCount = items.filter((item) => item.status === "review").length
  const nextAction = missingCount === 0
    ? "The track has enough structured information to move into technical modelling after admin review."
    : "Keep this track in review and ask the client to complete the missing business information."

  return (
    <div className="mt-5 border border-white/10 bg-[#050810] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            {reviewerMeta.eyebrow}
          </p>
          <h3 className="mt-2 text-lg font-semibold">
            {reviewerMeta.heading}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/45">{nextAction}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <ReviewerCount label="Ready" value={readyCount} tone="ready" />
          <ReviewerCount label="Review" value={reviewCount} tone="review" />
          <ReviewerCount label="Missing" value={missingCount} tone="missing" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className={`border p-4 ${reviewerStatusClass(item.status)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{item.label}</p>
                <p className="mt-2 break-words text-sm font-semibold">{item.value}</p>
              </div>
              {item.status === "ready" ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            </div>
            <p className="mt-3 text-sm leading-6 opacity-75">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Derived technical artifact
            </p>
            <h4 className="mt-2 font-semibold text-blue-50">
              {reviewerMeta.title} configuration JSON
            </h4>
            <p className="mt-2 text-sm leading-6 text-blue-50/70">
              Copy this as an implementation handoff or save it as an internal snapshot. It is generated from reviewed
              onboarding fields and does not execute integrations or change client-facing data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(artifactJson)
                  setCopiedConfig(true)
                  window.setTimeout(() => setCopiedConfig(false), 2500)
                } catch {
                  setCopiedConfig(false)
                }
              }}
              className="inline-flex items-center justify-center gap-2 border border-blue-300/30 bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-50 hover:bg-blue-500/30"
            >
              <Copy className="h-4 w-4" />
              {copiedConfig ? "Copied" : "Copy JSON"}
            </button>
            {onSaveSnapshot && (
              <button
                type="button"
                onClick={() => onSaveSnapshot({
                  label: artifactLabel,
                  artifactType: artifact.artifactType,
                  configJson: artifactJson,
                })}
                disabled={savingSnapshot}
                className="inline-flex items-center justify-center gap-2 border border-violet-300/30 bg-violet-500/20 px-3 py-2 text-sm font-semibold text-violet-50 hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingSnapshot ? "Saving..." : "Save snapshot"}
              </button>
            )}
          </div>
        </div>
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words border border-white/10 bg-[#050810] p-4 text-xs leading-5 text-blue-50/65">
          {artifactJson}
        </pre>
      </div>
    </div>
  )
}

function ProjectConfigSnapshotsBlock({
  snapshots,
  loading,
}: {
  snapshots: ClientProjectConfigSnapshot[]
  loading: boolean
}) {
  return (
    <div className="mt-5 border border-white/10 bg-[#050810] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Internal configuration snapshots
          </p>
          <h3 className="mt-2 text-lg font-semibold">Saved technical versions</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Admin-only history of derived service configuration artifacts. These snapshots document planning decisions;
            they do not execute integrations or change client-facing data.
          </p>
        </div>
        <span className="border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
          {loading ? "Loading" : `${snapshots.length} saved`}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-300" />
          Loading saved snapshots...
        </div>
      ) : snapshots.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {snapshots.map((snapshot) => (
            <details key={snapshot.id} className="border border-white/10 bg-[#0b1220] p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-white/90">{snapshot.label}</h4>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">
                      {snapshot.artifactType.replaceAll("_", " ")} · {snapshot.serviceKey} · {formatDate(snapshot.createdAt)}
                    </p>
                  </div>
                  <span className="border border-white/10 px-3 py-2 text-xs text-white/40">
                    {snapshot.createdByUsername || "admin"}
                  </span>
                </div>
              </summary>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words border border-white/10 bg-[#050810] p-4 text-xs leading-5 text-white/55">
                {formatJson(snapshot.configJson)}
              </pre>
            </details>
          ))}
        </div>
      ) : (
        <div className="mt-4 border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
          No configuration snapshots saved yet. Use Save snapshot from a service reviewer once the submitted fields look
          coherent.
        </div>
      )}
    </div>
  )
}

function ReviewerCount({ label, value, tone }: { label: string; value: number; tone: ServiceReviewerItem["status"] }) {
  return (
    <div className={`min-w-20 border px-3 py-2 ${reviewerStatusClass(tone)}`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="uppercase tracking-[0.14em] opacity-70">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: OnboardingTask["status"] }) {
  const styles = {
    pending: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    submitted: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    rejected: "border-red-500/30 bg-red-500/10 text-red-200",
  }

  return (
    <span className={`border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styles[status]}`}>
      {status}
    </span>
  )
}

function DataBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-3">
      <div className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-2 break-words text-sm text-white/75">{value}</div>
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

function projectPhaseOptionsFor(projectKey?: string | null) {
  if (!projectKey) {
    return projectPhaseOptions
  }

  return projectPhaseOptionsByKey[projectKey] ?? projectPhaseOptions
}

function projectPhaseLabel(phase: ProjectPhase, projectKey?: string | null) {
  return projectPhaseOptionsFor(projectKey).find((item) => item.value === phase)?.label || phase
}

function phaseGateChecklist(projectKey: string, phase: ProjectPhase) {
  const generic = genericPhaseGateChecklist(phase)
  const serviceSpecific = servicePhaseGateChecklist(projectKey, phase)
  return serviceSpecific.length > 0 ? serviceSpecific : generic
}

function genericPhaseGateChecklist(phase: ProjectPhase) {
  switch (phase) {
    case "requirements":
      return [
        "Critical contract/signature tasks are submitted and approved.",
        "Required forms contain enough business context for implementation.",
        "Missing client evidence has been rejected with clear feedback.",
        "Scope is separated into first delivery and future work.",
      ]
    case "design":
      return [
        "Client requirements have been translated into a concrete service structure.",
        "Staging/design expectations are clear enough for review.",
        "Any required files or links are approved or explicitly marked as pending.",
        "The next implementation step is documented for the operator.",
      ]
    case "development":
      return [
        "Implementation work has a clear checklist and owner.",
        "Client-facing changes are safe to show in staging.",
        "Internal-only notes and credentials are not exposed to the client.",
        "Validation steps are known before moving to review.",
      ]
    case "review":
      return [
        "Client feedback has been reviewed and answered.",
        "Known defects or missing assets are documented.",
        "The staging/demo path is usable for the client.",
        "Launch handoff items are prepared or clearly blocked.",
      ]
    case "launch":
      return [
        "Final handoff notes are ready.",
        "Client-facing links and manuals are accurate.",
        "Admin-only implementation details remain private.",
        "Future work is separated from the delivered scope.",
      ]
  }
}

function servicePhaseGateChecklist(projectKey: string, phase: ProjectPhase) {
  if (projectKey === "booking") {
    switch (phase) {
      case "requirements":
        return [
          "Booking contract/SLA is approved.",
          "Opening hours, slot duration, capacity and minimum notice are complete.",
          "Resources such as tables, rooms, doctors, advisors or vehicles are clearly listed.",
          "Cancellation, delay and deposit policies are written in client-facing language.",
        ]
      case "design":
        return [
          "Slot rules have been mapped into a coherent booking model.",
          "Widget visual expectations are clear enough for staging.",
          "Calendar/payment integrations are separated from the minimum launch path.",
          "Ambiguous capacity or resource rules have admin feedback.",
        ]
      case "development":
        return [
          "Booking widget build can use approved rules without guesswork.",
          "Confirmation email content has policy text available.",
          "Test scenarios cover full capacity, cancellation edge cases and minimum notice.",
          "Advanced sync/payment scope is not silently included.",
        ]
      case "review":
        return [
          "Client can test a booking path in staging or a controlled demo.",
          "Feedback on widget style and reservation flow has been captured.",
          "Known booking edge cases are listed before launch.",
          "Manuals or admin access notes are drafted.",
        ]
      case "launch":
        return [
          "Booking handoff includes widget link/embed notes and usage instructions.",
          "Client knows how to change operational policies after delivery.",
          "Launch message separates active booking features from future integrations.",
          "Support or follow-up action is scheduled if needed.",
        ]
    }
  }

  if (projectKey === "crm") {
    switch (phase) {
      case "requirements":
        return [
          "CRM data custody agreement is approved.",
          "Service catalogue, base price context and lead stages are submitted.",
          "Required contact fields and sector-specific fields are clear.",
          "Web forms, lead sources and import files are reviewed.",
        ]
      case "design":
        return [
          "CRM field model is mapped before forms or imports are connected.",
          "Manual lead-to-client conversion is defined as the first delivery path.",
          "Admin-only notes are separated from client-visible notes.",
          "Migration risks are documented if CSV/Excel files were uploaded.",
        ]
      case "development":
        return [
          "Client list/detail, notes and status workflow can be tested.",
          "Webhook or form intake is only enabled when token/security context is clear.",
          "Search and filters are validated against realistic client data.",
          "Service history remains future scope unless explicitly included.",
        ]
      case "review":
        return [
          "Client can review CRM layout and sample lead records.",
          "Field names and status labels match the client's daily language.",
          "Follow-up actions and internal notes behave predictably.",
          "Any imported data has been checked before client handoff.",
        ]
      case "launch":
        return [
          "Client receives clear instructions for lead intake and status updates.",
          "Admin confirms no private migration notes are exposed.",
          "Webhook/token handling is documented if enabled.",
          "Future automation and service history upgrades are separated.",
        ]
    }
  }

  if (projectKey === "automation") {
    switch (phase) {
      case "requirements":
        return [
          "Automated messaging/GDPR agreement is approved.",
          "Email, WhatsApp or SMS channels are described without exposing passwords.",
          "Brand tone and preferred/banned wording are submitted.",
          "Priority recipes are selected: no-shows, reviews, loyalty, reminders or follow-up.",
        ]
      case "design":
        return [
          "Minimum Resend email flows are separated from WhatsApp/SMS advanced scope.",
          "Message templates match the client's tone and sector.",
          "Testing recipient/channel is defined before any live send.",
          "Any API credential need is documented as a secure handoff, not a form field.",
        ]
      case "development":
        return [
          "Trigger/action logic has a safe test path.",
          "Email templates are reviewed before sending to real customers.",
          "Automation failure behavior is written down.",
          "Advanced channels remain disabled until credentials and consent are confirmed.",
        ]
      case "review":
        return [
          "Client can review a simulated message or controlled test send.",
          "Timing and content of reminders are confirmed.",
          "Admin has checked that no mass-send path is active accidentally.",
          "Feedback is captured before production activation.",
        ]
      case "launch":
        return [
          "Client receives the active flow list and what each one does.",
          "Rollback or pause instructions are documented.",
          "Advanced WhatsApp/SMS options are listed as future work if not delivered.",
          "First post-launch monitoring action is scheduled.",
        ]
    }
  }

  if (projectKey === "dashboard") {
    switch (phase) {
      case "requirements":
        return [
          "Dashboard confidentiality/software-use agreement is approved.",
          "Staff roles, permissions, protocols and KPI definitions are submitted.",
          "Historical data uploads are reviewed before migration planning.",
          "Owner/admin visibility is separated from employee visibility.",
        ]
      case "design":
        return [
          "Admin view, customer record, service-assigned view and internal notes are mapped.",
          "Role boundaries are clear before implementation.",
          "KPI cards and data sources are prioritized for a first delivery.",
          "Realtime/Kanban/media features are marked as advanced unless included.",
        ]
      case "development":
        return [
          "Static operational tables and notes can be tested first.",
          "Staff access assumptions are checked against the permission model.",
          "Uploaded history files are not exposed publicly.",
          "Client mockup feedback is prepared before review.",
        ]
      case "review":
        return [
          "Owner can review dashboard mockups or staging views.",
          "Permissions and sensitive metrics are checked before launch.",
          "Internal notes behavior is clear for daily operations.",
          "Data migration questions are documented.",
        ]
      case "launch":
        return [
          "Client receives dashboard usage instructions and role notes.",
          "Admin confirms sensitive metrics are not visible to wrong roles.",
          "Future Kanban/realtime/media upgrades are documented separately.",
          "Handoff includes how to request changes to protocols or KPIs.",
        ]
    }
  }

  if (projectKey === "web_seo") {
    switch (phase) {
      case "requirements":
        return [
          "Web/SEO agreement is approved.",
          "Brand assets, required pages, SEO keywords and domain/hosting context are submitted.",
          "Legal/trust content is available or explicitly marked as pending.",
          "Public lead flow must remain protected during visual work.",
        ]
      case "design":
        return [
          "Site structure maps to the real offer and target sectors.",
          "Brand visuals and imagery are approved for staging.",
          "Domain/hosting owner is known before launch planning.",
          "Future SEO/content clusters are separated from first launch.",
        ]
      case "development":
        return [
          "Pages and contact forms can be built without missing core copy.",
          "Public lead capture stays connected to backend/Resend.",
          "Legal links and privacy text are not broken.",
          "Responsive layout is checked before review.",
        ]
      case "review":
        return [
          "Client can review staging pages, copy and lead form.",
          "Image placeholders or missing assets are documented.",
          "SEO headings and service messaging match the business.",
          "Launch blockers are separated from nice-to-have changes.",
        ]
      case "launch":
        return [
          "Client receives public URL, contact-flow notes and basic update instructions.",
          "Lead form is tested after launch.",
          "Domain/hosting changes are documented.",
          "Future content and SEO improvements are separated.",
        ]
    }
  }

  return []
}

function adminServiceOperationsGuide(projectKey: string): AdminServiceOperationsGuide {
  switch (projectKey) {
    case "booking":
      return {
        minimumScope: [
          "Local slot engine with daily/weekly availability and capacity rules.",
          "Automatic reservation confirmation by email when a slot is free.",
          "Basic public booking widget staging before launch.",
        ],
        advancedScope: [
          "Google/Apple calendar sync, Stripe deposits and manual pre-approval.",
          "Database locking/concurrency controls to avoid double-booking.",
          "WhatsApp/SMS reminder cascade and cancellation follow-up as later upsell.",
        ],
        adminChecklist: [
          "Validate opening hours, capacity and resources.",
          "Reject unclear policies with exact feedback.",
          "Move to testing only when slot rules and widget staging are coherent.",
        ],
      }
    case "crm":
      return {
        minimumScope: [
          "Client list/detail with date, name and status filters.",
          "Internal notes and manual lead-to-client workflow.",
          "Simple indexed search and sector-specific lead fields.",
        ],
        advancedScope: [
          "Service history, event timeline and automated lead-to-client conversion.",
          "Webhook-driven lead intake from external forms and successful actions.",
          "Role-aware visibility and richer follow-up timeline later.",
        ],
        adminChecklist: [
          "Confirm service catalogue and sector-specific fields.",
          "Review uploaded CSV/Excel before migration.",
          "Keep admin-only notes private unless explicitly shared with the client.",
        ],
      }
    case "automation":
      return {
        minimumScope: [
          "Webhook to backend to Resend email flow.",
          "Immediate confirmation email and 24-hour reminder email.",
          "Manual review before any real customer automation.",
        ],
        advancedScope: [
          "WhatsApp Business, SMS and cross-system webhooks.",
          "Sector recipes for clinics, restaurants and car dealers.",
          "Staging simulation to the owner's phone/email.",
        ],
        adminChecklist: [
          "Validate sender/channel access before implementation.",
          "Use the copied prompt to draft HTML templates safely.",
          "Separate minimum email flows from future WhatsApp/SMS scope.",
        ],
      }
    case "dashboard":
      return {
        minimumScope: [
          "Simple owner/admin view with static operational tables.",
          "Flat customer record and shared internal notes.",
          "Role-based staff access foundation for owner, manager and employee views.",
        ],
        advancedScope: [
          "Kanban service-assigned view, realtime updates and richer media files.",
          "KPI dashboards with data-source integrations and historical imports.",
          "Mentions/notifications in internal notes later.",
        ],
        adminChecklist: [
          "Validate staff roles and permission expectations.",
          "Review protocols before modelling the workspace.",
          "Avoid exposing owner metrics to employee views.",
        ],
      }
    case "web_seo":
      return {
        minimumScope: [
          "Professional service pages and public lead form.",
          "Basic local SEO structure and trust/legal content.",
          "Responsive frontend connected to backend lead storage and contact notifications.",
        ],
        advancedScope: [
          "More content clusters, analytics and richer landing pages.",
          "Sector-specific image/content production.",
          "A/B testing and advanced SEO later.",
        ],
        adminChecklist: [
          "Confirm logo, photos and service offer before build.",
          "Review page copy against the client's real sector.",
          "Keep lead capture working during visual changes.",
        ],
      }
    default:
      return {
        minimumScope: [
          "Confirm the exact service outcome.",
          "Collect files, links and decision notes.",
          "Move phases only after real review.",
        ],
        advancedScope: [
          "Deeper integrations after MVP validation.",
          "Extra automation only when there is a clear operational need.",
          "More roles and dashboards later.",
        ],
        adminChecklist: [
          "Review submitted data.",
          "Ask for missing details.",
          "Keep scope practical for the current client.",
        ],
      }
  }
}

function adminDeliveryHandoffGuide(projectKey: string): AdminDeliveryHandoffGuide {
  switch (projectKey) {
    case "booking":
      return {
        clientHandoff: [
          "Booking widget/test link, admin access notes and usage manual.",
          "Confirmed opening hours, slot duration, resources, capacity and cancellation policy.",
          "Embed or web integration notes for the public reservation path.",
        ],
        adminVerification: [
          "Run test bookings for normal, full-capacity and minimum-notice cases.",
          "Confirm cancellation/delay policy text matches the client's submitted wording.",
          "Keep Google Calendar, Apple Calendar and Stripe listed as optional future scope unless delivered.",
        ],
        futureBoundary: [
          "Calendar sync, Stripe deposits and WhatsApp/SMS reminders.",
          "Advanced locking/concurrency implementation if not part of first delivery.",
          "Customer-side booking analytics and advanced reporting.",
        ],
      }
    case "crm":
      return {
        clientHandoff: [
          "CRM workspace with client list/detail, lead statuses, notes and follow-up flow.",
          "Field catalogue and sector-specific labels approved for daily use.",
          "Import or external form connection notes, including what is manual in v1.",
        ],
        adminVerification: [
          "Check client-visible CRM data does not include admin-only notes.",
          "Validate manual lead-to-client flow before promising automation.",
          "Confirm uploaded CSV/Excel imports are reviewed before handoff.",
        ],
        futureBoundary: [
          "Automated lead-to-client conversion after payments/bookings.",
          "Service history, employee activity timeline and richer CRM permissions.",
          "Advanced webhooks and cross-system synchronization.",
        ],
      }
    case "automation":
      return {
        clientHandoff: [
          "Active automation list, trigger/action explanation and approved message templates.",
          "Controlled test-send result or staging notes.",
          "Pause, rollback and post-launch monitoring instructions.",
        ],
        adminVerification: [
          "Confirm only approved flows can reach real customers.",
          "Check tone, consent assumptions and channel ownership before activation.",
          "Keep API credentials out of client-visible fields and screenshots.",
        ],
        futureBoundary: [
          "WhatsApp Business API, Twilio SMS and external billing software webhooks.",
          "Sector recipes such as birthday loyalty, review requests and finance follow-up.",
          "Mass-send controls and advanced segmentation.",
        ],
      }
    case "dashboard":
      return {
        clientHandoff: [
          "Owner/admin dashboard view, staff role notes and basic operating guide.",
          "KPI definitions, data source notes and internal protocol section.",
          "Mockup or staging review summary before delivery.",
        ],
        adminVerification: [
          "Confirm sensitive metrics are not visible to employee-level users.",
          "Validate staff roles and protocols with the owner.",
          "Document any historical data that was not migrated.",
        ],
        futureBoundary: [
          "Realtime Kanban, WebSocket updates and richer employee workflows.",
          "Customer record multimedia attachments.",
          "Advanced BI, dashboards and staff notifications.",
        ],
      }
    case "web_seo":
      return {
        clientHandoff: [
          "Public website pages, service pages and tested contact/lead form.",
          "Basic SEO structure, metadata notes and local keyword context.",
          "Launch checklist for domain, hosting, legal pages and future changes.",
        ],
        adminVerification: [
          "Submit a test lead after staging or production handoff.",
          "Check images, legal links, responsive layout and CTA clarity.",
          "Confirm public copy matches the real offer and target sectors.",
        ],
        futureBoundary: [
          "Advanced SEO content calendar and analytics.",
          "A/B testing and conversion optimization.",
          "More sector pages or multilingual expansion.",
        ],
      }
    default:
      return {
        clientHandoff: [
          "Final client-facing links or documents.",
          "Scope summary and support notes.",
          "Confirmed next action after delivery.",
        ],
        adminVerification: [
          "Check delivery notes match approved scope.",
          "Confirm private implementation details are not exposed.",
          "Record what remains unresolved.",
        ],
        futureBoundary: [
          "Advanced integrations.",
          "Additional service modules.",
          "Production hardening tasks.",
        ],
      }
  }
}

function serviceExpectedFields(projectKey: string) {
  switch (projectKey) {
    case "booking":
      return [
        "opening_days",
        "slot_duration",
        "capacity_rules",
        "minimum_notice",
        "bookable_units",
        "cancellation_policy",
        "delay_policy",
      ]
    case "crm":
      return [
        "service_catalogue",
        "base_prices",
        "pipeline_stages",
        "required_contact_fields",
        "sector_specific_fields",
        "web_forms_to_connect",
        "lead_sources",
        "intake_notifications",
      ]
    case "automation":
      return [
        "email_channel",
        "whatsapp_channel",
        "sms_channel",
        "tone_of_voice",
        "reduce_no_shows",
        "google_reviews",
        "birthday_loyalty",
        "main_goal",
      ]
    case "dashboard":
      return [
        "staff_roles",
        "permission_expectations",
        "daily_protocols",
        "exception_handling",
        "internal_notes_context",
        "kpis",
        "data_sources",
      ]
    case "web_seo":
      return [
        "required_pages",
        "competitor_websites",
        "seo_keywords",
        "domain_owner",
        "hosting_context",
        "technical_contact",
      ]
    default:
      return ["notes", "businessRules"]
  }
}

function collectServiceData(projectKey: string, tasks: OnboardingTask[]) {
  return tasks
    .filter((task) => task.serviceKey === projectKey && task.status !== "pending")
    .reduce<Record<string, unknown>>((current, task) => {
      const data = parseJsonObject(task.dataJson)

      if (!data) {
        return current
      }

      return {
        ...current,
        ...data,
      }
    }, {})
}

function bookingReviewerItems(data: Record<string, unknown>): ServiceReviewerItem[] {
  return [
    reviewerItem({
      label: "Opening schedule",
      value: data.opening_days,
      readyNote: "The developer can start modelling available days and hour windows.",
      missingNote: "Booking cannot be configured safely without opening days and hours.",
    }),
    reviewerItem({
      label: "Slot duration",
      value: data.slot_duration,
      readyNote: "Slots can be generated around this duration or turn structure.",
      missingNote: "Ask whether appointments/reservations use 30, 45, 60 minute slots or fixed turns.",
    }),
    reviewerItem({
      label: "Capacity rules",
      value: data.capacity_rules,
      readyNote: "Capacity constraints can be used to avoid overbooking.",
      missingNote: "Ask for maximum occupancy per slot, table, room, doctor or advisor.",
    }),
    reviewerItem({
      label: "Minimum notice",
      value: data.minimum_notice,
      readyNote: "The booking flow can block last-minute requests according to this rule.",
      missingNote: "Confirm how far in advance users must book.",
    }),
    reviewerItem({
      label: "Bookable units",
      value: data.bookable_units,
      readyNote: "Resources can be mapped as tables, rooms, doctors, vehicles or advisors.",
      missingNote: "Ask what concrete resources the booking engine must reserve.",
    }),
    reviewerItem({
      label: "Cancellation policy",
      value: data.cancellation_policy,
      readyNote: "This text can be reused in automated confirmation/cancellation emails.",
      missingNote: "Ask for the cancellation deadline and client-facing policy wording.",
    }),
    reviewerItem({
      label: "External integrations",
      value: bookingIntegrationValue(data),
      readyNote: "Integration preferences are explicit; separate core scope from later integrations.",
      missingNote: "No external integrations were selected. Keep the first version local unless client confirms otherwise.",
      optional: true,
    }),
  ]
}

function crmReviewerItems(data: Record<string, unknown>): ServiceReviewerItem[] {
  return [
    reviewerItem({
      label: "Service catalogue",
      value: data.service_catalogue,
      readyNote: "Client services/products can be linked to CRM records.",
      missingNote: "Ask what services/products the business sells before modelling service history.",
    }),
    reviewerItem({
      label: "Base prices",
      value: data.base_prices,
      readyNote: "Pricing ranges can support service history and commercial context.",
      missingNote: "Prices are missing. This can be optional for MVP but should be confirmed for service history.",
      optional: true,
    }),
    reviewerItem({
      label: "Pipeline stages",
      value: data.pipeline_stages,
      readyNote: "Statuses can be mapped to the CRM workflow.",
      missingNote: "Ask for the real operational stages used by the business.",
    }),
    reviewerItem({
      label: "Required contact fields",
      value: data.required_contact_fields,
      readyNote: "Forms and CRM records can use these fields as the minimum contact model.",
      missingNote: "Ask which fields are mandatory for daily follow-up.",
    }),
    reviewerItem({
      label: "Sector-specific fields",
      value: data.sector_specific_fields,
      readyNote: "The CRM can capture sector context instead of generic notes only.",
      missingNote: "Ask for sector-specific fields such as treatment, vehicle model, guest count or request type.",
    }),
    reviewerItem({
      label: "Forms or sources to connect",
      value: data.web_forms_to_connect,
      readyNote: "Lead intake sources can be wired to the CRM or webhook flow.",
      missingNote: "Ask which public forms or channels should feed this CRM.",
    }),
    reviewerItem({
      label: "Lead sources",
      value: data.lead_sources,
      readyNote: "The CRM can preserve where each contact came from.",
      missingNote: "Ask which campaigns, pages or referral sources should be tracked.",
      optional: true,
    }),
    reviewerItem({
      label: "Intake notifications",
      value: data.intake_notifications,
      readyNote: "Notification routing can be planned before connecting forms.",
      missingNote: "Ask who should receive alerts when a new lead enters the CRM.",
      optional: true,
    }),
  ]
}

function webSeoReviewerItems(data: Record<string, unknown>): ServiceReviewerItem[] {
  return [
    reviewerItem({
      label: "Required pages",
      value: data.required_pages,
      readyNote: "The site map can be planned around the client's real offer.",
      missingNote: "Ask which pages are required before creating the site structure.",
    }),
    reviewerItem({
      label: "Competitor references",
      value: data.competitor_websites,
      readyNote: "References help set commercial expectations without copying another brand.",
      missingNote: "Ask for reference websites or competitors in the local market.",
      optional: true,
    }),
    reviewerItem({
      label: "SEO keywords",
      value: data.seo_keywords,
      readyNote: "Initial local SEO terms can guide headings, service pages and blog ideas.",
      missingNote: "Ask for the services, cities and search terms the business wants to target.",
    }),
    reviewerItem({
      label: "Domain context",
      value: data.domain_owner || data.hosting_context || data.technical_contact,
      readyNote: "Domain and hosting access risk can be planned before launch.",
      missingNote: "Ask who controls the domain, hosting, DNS or current website.",
    }),
    reviewerItem({
      label: "Technical owner",
      value: data.technical_contact,
      readyNote: "There is a clear person or team to coordinate launch access with.",
      missingNote: "Ask who controls technical accounts before launch planning.",
      optional: true,
    }),
  ]
}

function automationReviewerItems(data: Record<string, unknown>): ServiceReviewerItem[] {
  return [
    reviewerItem({
      label: "Email channel",
      value: data.email_channel,
      readyNote: "Minimum Resend/email automations can be scoped around this sender context.",
      missingNote: "Ask which email sender or corporate mailbox should be used.",
    }),
    reviewerItem({
      label: "WhatsApp context",
      value: data.whatsapp_channel,
      readyNote: "WhatsApp can be treated as an explicit advanced integration scope.",
      missingNote: "No WhatsApp context provided. Keep this outside MVP unless confirmed.",
      optional: true,
    }),
    reviewerItem({
      label: "SMS context",
      value: data.sms_channel,
      readyNote: "SMS can be treated as an explicit advanced integration scope.",
      missingNote: "No SMS context provided. Keep this outside MVP unless confirmed.",
      optional: true,
    }),
    reviewerItem({
      label: "Tone of voice",
      value: data.tone_of_voice,
      readyNote: "Message templates can be drafted in the client's real tone.",
      missingNote: "Ask how the business speaks to customers before writing automations.",
    }),
    reviewerItem({
      label: "Preferred phrases",
      value: data.preferred_phrases,
      readyNote: "Reusable wording can be included in email templates.",
      missingNote: "No preferred wording provided. Use simple neutral copy first.",
      optional: true,
    }),
    reviewerItem({
      label: "Automation goals",
      value: automationGoalsValue(data),
      readyNote: "Priority flows are explicit enough to design a minimum recipe set.",
      missingNote: "Ask what should be automated first: no-shows, reviews, loyalty or follow-up.",
    }),
  ]
}

function dashboardReviewerItems(data: Record<string, unknown>): ServiceReviewerItem[] {
  return [
    reviewerItem({
      label: "Staff roles",
      value: data.staff_roles,
      readyNote: "The dashboard can be modelled around the team structure.",
      missingNote: "Ask for roles, departments and who needs access.",
    }),
    reviewerItem({
      label: "Permission expectations",
      value: data.permission_expectations,
      readyNote: "Owner, manager and employee visibility can be separated early.",
      missingNote: "Ask what each role should be allowed to see or edit.",
    }),
    reviewerItem({
      label: "Daily protocols",
      value: data.daily_protocols,
      readyNote: "Operational notes can become internal guidance inside the dashboard.",
      missingNote: "Ask for recurring rules that guide daily work.",
    }),
    reviewerItem({
      label: "Exception handling",
      value: data.exception_handling,
      readyNote: "Edge cases can be represented as admin-only notes or workflow states.",
      missingNote: "No exception handling provided. Confirm before modelling advanced workflows.",
      optional: true,
    }),
    reviewerItem({
      label: "KPIs",
      value: data.kpis,
      readyNote: "The dashboard can prioritize the metrics the owner actually checks.",
      missingNote: "Ask which KPIs matter for the owner or manager.",
    }),
    reviewerItem({
      label: "Data sources",
      value: data.data_sources,
      readyNote: "Migration/integration planning can start from the known sources.",
      missingNote: "Ask where the current operational data lives.",
    }),
  ]
}

function supportsServiceReviewer(projectKey: string) {
  return ["web_seo", "booking", "crm", "automation", "dashboard"].includes(projectKey)
}

function serviceReviewerItems(projectKey: string, data: Record<string, unknown>) {
  switch (projectKey) {
    case "web_seo":
      return webSeoReviewerItems(data)
    case "booking":
      return bookingReviewerItems(data)
    case "crm":
      return crmReviewerItems(data)
    case "automation":
      return automationReviewerItems(data)
    case "dashboard":
      return dashboardReviewerItems(data)
    default:
      return []
  }
}

function serviceReviewerMeta(projectKey: string) {
  switch (projectKey) {
    case "web_seo":
      return {
        eyebrow: "Web and SEO reviewer",
        heading: "Operational readiness for digital presence",
        title: "Web and SEO",
      }
    case "booking":
      return {
        eyebrow: "Booking rules reviewer",
        heading: "Operational readiness for reservation logic",
        title: "Booking",
      }
    case "crm":
      return {
        eyebrow: "CRM catalogue reviewer",
        heading: "Operational readiness for lead management",
        title: "CRM",
      }
    case "automation":
      return {
        eyebrow: "Automation flow reviewer",
        heading: "Operational readiness for messaging workflows",
        title: "Automation",
      }
    case "dashboard":
      return {
        eyebrow: "Dashboard operations reviewer",
        heading: "Operational readiness for internal management",
        title: "Dashboard",
      }
    default:
      return {
        eyebrow: "Service reviewer",
        heading: "Operational readiness",
        title: projectModuleTitle(projectKey),
      }
  }
}

function reviewerItem({
  label,
  value,
  readyNote,
  missingNote,
  optional = false,
}: {
  label: string
  value: unknown
  readyNote: string
  missingNote: string
  optional?: boolean
}): ServiceReviewerItem {
  const hasValue = hasMeaningfulValue(value)

  return {
    label,
    value: hasValue ? formatStructuredValue(value) : "Not provided",
    status: hasValue ? "ready" : optional ? "review" : "missing",
    note: hasValue ? readyNote : missingNote,
  }
}

function bookingIntegrationValue(data: Record<string, unknown>) {
  const integrations = [
    data.google_calendar ? "Google Calendar" : "",
    data.apple_calendar ? "Apple Calendar" : "",
    data.stripe_deposits ? "Stripe deposits" : "",
    hasMeaningfulValue(data.integration_notes) ? `Notes: ${formatStructuredValue(data.integration_notes)}` : "",
  ].filter(Boolean)

  return integrations.join(", ")
}

function automationGoalsValue(data: Record<string, unknown>) {
  const goals = [
    data.reduce_no_shows ? "Reduce no-shows" : "",
    data.google_reviews ? "Request Google reviews" : "",
    data.birthday_loyalty ? "Birthday or loyalty messages" : "",
    hasMeaningfulValue(data.main_goal) ? `Main goal: ${formatStructuredValue(data.main_goal)}` : "",
  ].filter(Boolean)

  return goals.join(", ")
}

function hasMeaningfulValue(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return true
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return Boolean(value)
}

function reviewerStatusClass(status: ServiceReviewerItem["status"]) {
  switch (status) {
    case "ready":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
    case "review":
      return "border-amber-500/25 bg-amber-500/10 text-amber-100"
    case "missing":
      return "border-red-500/25 bg-red-500/10 text-red-100"
  }
}

function buildServiceConfigArtifact(projectKey: string, data: Record<string, unknown>, items: ServiceReviewerItem[]) {
  const readiness = {
    ready: items.filter((item) => item.status === "ready").map((item) => item.label),
    review: items.filter((item) => item.status === "review").map((item) => item.label),
    missing: items.filter((item) => item.status === "missing").map((item) => item.label),
  }

  const baseArtifact = {
    serviceTrack: projectKey,
    generatedFrom: "admin_onboarding_review",
    readiness,
  }

  switch (projectKey) {
    case "web_seo":
      return {
        ...baseArtifact,
        artifactType: "web_seo_configuration_preview",
        siteStructure: {
          requiredPages: splitArtifactList(data.required_pages),
          competitorReferences: splitArtifactList(data.competitor_websites),
          seoKeywords: splitArtifactList(data.seo_keywords),
          localSmeOffer: normalizeArtifactValue(data.local_sme_offer),
        },
        technicalAccess: {
          domainOwner: normalizeArtifactValue(data.domain_owner),
          hostingContext: normalizeArtifactValue(data.hosting_context),
          analyticsOrSearchConsole: normalizeArtifactValue(data.analytics_or_search_console),
          technicalContact: normalizeArtifactValue(data.technical_contact),
        },
        implementationNotes: [
          "Use this as a planning artifact only; it does not publish website content.",
          "Confirm brand assets and trust/legal content before launch.",
          "Keep public lead capture working during visual or copy changes.",
        ],
        nextAdminAction: readiness.missing.length === 0
          ? "Review the Web/SEO preview and move the track to Visual structure or Build when approved."
          : "Ask the client to complete missing pages, keywords or domain context before implementation.",
        rawSubmittedData: data,
      }
    case "booking":
      return {
        ...baseArtifact,
        artifactType: "booking_configuration_preview",
        bookingRules: {
          openingSchedule: normalizeArtifactValue(data.opening_days),
          slotDuration: normalizeArtifactValue(data.slot_duration),
          capacityRules: normalizeArtifactValue(data.capacity_rules),
          minimumNotice: normalizeArtifactValue(data.minimum_notice),
        },
        resources: {
          bookableUnits: normalizeArtifactValue(data.bookable_units),
          constraints: normalizeArtifactValue(data.resource_constraints),
        },
        policies: {
          cancellation: normalizeArtifactValue(data.cancellation_policy),
          delayOrCourtesyMargin: normalizeArtifactValue(data.delay_policy),
          depositOrPayment: normalizeArtifactValue(data.deposit_policy),
        },
        integrations: {
          googleCalendar: Boolean(data.google_calendar),
          appleCalendar: Boolean(data.apple_calendar),
          stripeDeposits: Boolean(data.stripe_deposits),
          notes: normalizeArtifactValue(data.integration_notes),
        },
        implementationNotes: [
          "Use this as a planning artifact only; it does not create reservations.",
          "Keep the first implementation local unless external integrations are explicitly approved.",
          "Validate slot generation manually before moving the project to testing.",
        ],
        nextAdminAction: readiness.missing.length === 0
          ? "Review the derived rules and move the Booking track to Rules configuration or Widget build when approved."
          : "Ask the client to complete the missing Booking information before technical modelling.",
        rawSubmittedData: data,
      }
    case "crm":
      return {
        ...baseArtifact,
        artifactType: "crm_configuration_preview",
        catalogue: {
          servicesOrProducts: normalizeArtifactValue(data.service_catalogue),
          basePrices: normalizeArtifactValue(data.base_prices),
        },
        pipeline: {
          stages: splitArtifactList(data.pipeline_stages),
          rawStages: normalizeArtifactValue(data.pipeline_stages),
        },
        contactModel: {
          requiredFields: splitArtifactList(data.required_contact_fields),
          sectorSpecificFields: splitArtifactList(data.sector_specific_fields),
          formsOrSourcesToConnect: splitArtifactList(data.web_forms_to_connect),
          leadSources: splitArtifactList(data.lead_sources),
          intakeNotifications: normalizeArtifactValue(data.intake_notifications),
          webhookContext: normalizeArtifactValue(data.webhook_context),
        },
        implementationNotes: [
          "Use this as a planning artifact only; it does not mutate CRM tables.",
          "Map required fields before connecting public forms or webhooks.",
          "Keep admin-only notes private unless a field is explicitly intended for the client workspace.",
        ],
        nextAdminAction: readiness.missing.length === 0
          ? "Review the CRM configuration preview and move the track to Data model when approved."
          : "Ask the client to complete the missing CRM catalogue or field information before modelling.",
        rawSubmittedData: data,
      }
    case "automation":
      return {
        ...baseArtifact,
        artifactType: "automation_configuration_preview",
        channels: {
          email: normalizeArtifactValue(data.email_channel),
          whatsapp: normalizeArtifactValue(data.whatsapp_channel),
          sms: normalizeArtifactValue(data.sms_channel),
        },
        messageStyle: {
          toneOfVoice: normalizeArtifactValue(data.tone_of_voice),
          preferredPhrases: normalizeArtifactValue(data.preferred_phrases),
          bannedPhrases: normalizeArtifactValue(data.banned_phrases),
        },
        goals: {
          reduceNoShows: Boolean(data.reduce_no_shows),
          googleReviews: Boolean(data.google_reviews),
          birthdayLoyalty: Boolean(data.birthday_loyalty),
          mainGoal: normalizeArtifactValue(data.main_goal),
        },
        suggestedMinimumFlows: [
          "Immediate confirmation email through Resend.",
          "24-hour reminder email before an appointment/reservation.",
          "Manual admin review before activating real customer automations.",
        ],
        implementationNotes: [
          "Use this as a planning artifact only; it does not send messages.",
          "Treat WhatsApp/SMS as advanced scope unless the client explicitly confirms channels.",
          "Draft templates from brand tone before enabling production flows.",
        ],
        nextAdminAction: readiness.missing.length === 0
          ? "Review the automation preview and move the track to API and webhook setup when approved."
          : "Ask the client to complete channels, tone or automation goal before implementation.",
        rawSubmittedData: data,
      }
    case "dashboard":
      return {
        ...baseArtifact,
        artifactType: "dashboard_configuration_preview",
        accessModel: {
          staffRoles: normalizeArtifactValue(data.staff_roles),
          permissionExpectations: normalizeArtifactValue(data.permission_expectations),
        },
        operationsModel: {
          dailyProtocols: normalizeArtifactValue(data.daily_protocols),
          exceptionHandling: normalizeArtifactValue(data.exception_handling),
          internalNotesContext: normalizeArtifactValue(data.internal_notes_context),
        },
        reportingModel: {
          kpis: splitArtifactList(data.kpis),
          dataSources: splitArtifactList(data.data_sources),
          reportingFrequency: normalizeArtifactValue(data.reporting_frequency),
        },
        implementationNotes: [
          "Use this as a planning artifact only; it does not create staff accounts.",
          "Separate owner/admin metrics from employee views before implementation.",
          "Review historical data uploads before any migration.",
        ],
        nextAdminAction: readiness.missing.length === 0
          ? "Review the dashboard preview and move the track to View architecture when approved."
          : "Ask the client to complete staff roles, permissions, KPIs or data sources before modelling.",
        rawSubmittedData: data,
      }
    default:
      return {
        ...baseArtifact,
        artifactType: "service_configuration_preview",
        rawSubmittedData: data,
      }
  }
}

function normalizeArtifactValue(value: unknown) {
  return hasMeaningfulValue(value) ? formatStructuredValue(value) : null
}

function splitArtifactList(value: unknown) {
  if (!hasMeaningfulValue(value)) {
    return []
  }

  return formatStructuredValue(value)
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function JsonBlock({ label, value }: { label: string; value: string }) {
  return (
    <details className="mt-5 border border-white/10 bg-[#0b1220] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-white/80">{label}</summary>
      <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/55">
        {formatJson(value)}
      </pre>
    </details>
  )
}

function StructuredTaskDataBlock({ value }: { value: string }) {
  const data = parseJsonObject(value)

  if (!data) {
    return <JsonBlock label="Submitted data" value={value} />
  }

  const entries = Object.entries(data).filter(([, entryValue]) => {
    return entryValue !== null && entryValue !== undefined && entryValue !== ""
  })

  if (entries.length === 0) {
    return <JsonBlock label="Submitted data" value={value} />
  }

  return (
    <div className="mt-5 border border-white/10 bg-[#0b1220] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
        <FileText className="h-4 w-4 text-violet-300" />
        Submitted fields
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(([key, entryValue]) => (
          <DataBox key={key} label={humanizeKey(key)} value={formatStructuredValue(entryValue)} />
        ))}
      </div>
      <details className="mt-4 border border-white/10 bg-white/[0.02] p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
          Raw JSON
        </summary>
        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/45">
          {formatJson(value)}
        </pre>
      </details>
    </div>
  )
}

function ImplementationPromptBlock({
  task,
  dashboard,
  copied,
  onCopy,
}: {
  task: OnboardingTask
  dashboard: OnboardingDashboard
  copied: boolean
  onCopy: () => void
}) {
  const prompt = buildImplementationPrompt(task, dashboard)
  const preview = prompt.split("\n").slice(0, 14).join("\n")

  return (
    <div className="mt-5 border border-violet-500/20 bg-violet-500/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-violet-100">Implementation prompt</div>
          <p className="mt-1 text-sm leading-6 text-violet-100/65">
            Consolidated prompt for this {projectModuleTitle(task.serviceKey)} track. Use it as a handoff to the
            developer or AI assistant after review.
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 border border-violet-400/30 bg-violet-500/20 px-3 py-2 text-sm font-semibold text-violet-50 hover:bg-violet-500/30"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap break-words border border-white/10 bg-[#050810] p-4 text-xs leading-5 text-white/60">
        {preview}
      </pre>
    </div>
  )
}

function FileMetadataBlock({ value }: { value: string }) {
  const files = parseFileMetadata(value)

  if (files.length === 0) {
    return <JsonBlock label="File metadata" value={value} />
  }

  return (
    <div className="mt-5 border border-white/10 bg-[#0b1220] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
        <Download className="h-4 w-4 text-blue-300" />
        Uploaded files
      </div>
      <div className="grid gap-3">
        {files.map((file, index) => {
          const filename = file.originalFilename || file.name || `Uploaded file ${index + 1}`
          const size = file.sizeBytes ?? file.size

          return (
            <div key={file.id || `${filename}-${index}`} className="flex flex-col gap-3 border border-white/10 bg-white/[0.02] p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-white/80">{filename}</div>
                <div className="mt-1 text-xs text-white/40">
                  {file.contentType || "unknown type"} · {formatBytes(size)} · {formatDate(file.createdAt)}
                </div>
              </div>

              {file.id ? (
                <a
                  href={`/api/internal/onboarding/files/${file.id}/download`}
                  className="inline-flex items-center justify-center gap-2 border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-100 hover:bg-blue-500/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              ) : (
                <span className="border border-white/10 px-3 py-2 text-xs text-white/35">Legacy metadata only</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function parseFileMetadata(value: string): OnboardingFileMetadata[] {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed as OnboardingFileMetadata[] : []
  } catch {
    return []
  }
}

function parseJsonObject(value?: string | null): Record<string, unknown> | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return null
  }

  return null
}

function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
}

function formatStructuredValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (typeof value === "number") {
    return String(value)
  }

  if (typeof value === "string") {
    return value || "Not provided"
  }

  if (Array.isArray(value)) {
    return value.map(formatStructuredValue).join(", ")
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value)
  }

  return "Not provided"
}

function buildImplementationPrompt(task: OnboardingTask, dashboard: OnboardingDashboard): string {
  const serviceTasks = dashboard.tasks.filter((candidate) => {
    return candidate.serviceKey === task.serviceKey && candidate.status !== "pending"
  })
  const tasksForPrompt = serviceTasks.length > 0 ? serviceTasks : [task]
  const client = dashboard.client
  const taskBlocks = tasksForPrompt.map((candidate) => {
    const data = parseJsonObject(candidate.dataJson)
    const files = candidate.fileMetadataJson ? parseFileMetadata(candidate.fileMetadataJson) : []
    const dataLines = data ? Object.entries(data)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .map(([key, value]) => `  - ${humanizeKey(key)}: ${formatStructuredValue(value)}`)
      .join("\n") : "  - No structured fields submitted."
    const fileLines = files.length > 0
      ? files.map((file) => `  - ${file.originalFilename || file.name || file.id || "Uploaded file"} (${file.contentType || "unknown type"})`).join("\n")
      : "  - No file metadata submitted."

    return [
      `Task: ${candidate.title}`,
      `Task key: ${candidate.taskKey}`,
      `Status: ${candidate.status}`,
      "Structured fields:",
      dataLines,
      "Files:",
      fileLines,
    ].join("\n")
  }).join("\n\n")

  return [
    `Act as a senior product architect and implementation engineer for the Altaira Labs ${projectModuleTitle(task.serviceKey)} service track.`,
    "",
    "Client context:",
    `- Company: ${client.company}`,
    `- Contact: ${client.name} <${client.email}>`,
    `- Sector: ${client.sectorType || task.sectorType || "not set"}`,
    `- Service track: ${task.serviceKey || "general"}`,
    "",
    servicePromptInstruction(task.serviceKey),
    "",
    "Onboarding evidence submitted by the client:",
    taskBlocks,
    "",
    "Return a practical implementation handoff with:",
    "1. confirmed requirements",
    "2. missing or risky information to ask the client",
    "3. implementation steps",
    "4. validation checks",
    "5. client-facing delivery notes",
  ].join("\n")
}

function servicePromptInstruction(serviceKey: string) {
  switch (serviceKey) {
    case "booking":
      return [
        "Design the Booking System implementation.",
        "Focus on opening hours, slot duration, capacity, resources/spaces, cancellation policy, staging widget feedback and launch readiness.",
        "Include the minimum local slot engine, email confirmation and widget staging separately from advanced calendar sync, Stripe deposits, manual pre-approval, double-booking controls and WhatsApp/SMS reminders.",
        "Return a practical slot model and validation checklist before suggesting any external integration.",
      ].join("\n")
    case "crm":
      return [
        "Design the CRM / Lead Management implementation.",
        "Focus on client records, service catalogue, lead statuses, sector-specific fields, follow-up notes, import needs and lead-to-client workflow.",
        "Keep the first version simple enough for a local SME: client list/detail, internal notes, manual lead-to-client conversion and indexed search.",
        "Separate that from advanced service history, event timeline, webhook intake, automated conversion and role-aware visibility.",
      ].join("\n")
    case "automation":
      return [
        "Design the Workflow Automation implementation.",
        "Focus on channels, sender identity, brand tone, automation goals, minimum Resend flows and future WhatsApp/SMS options.",
        "Generate copy and technical notes that can be reviewed before sending anything to real customers.",
        "Separate minimum flows, such as immediate confirmation and 24-hour reminders, from advanced recipes for clinics, restaurants and car dealers.",
      ].join("\n")
    case "dashboard":
      return [
        "Design the Management Dashboard implementation.",
        "Focus on roles, permissions, operational protocols, KPI definitions, historical data migration and internal notes.",
        "Separate owner/admin visibility from employee/service-assigned visibility.",
        "Keep the first version to static operational tables, customer records and internal notes, then describe the upgrade path to Kanban, realtime updates, richer media files and staff notifications.",
      ].join("\n")
    case "web_seo":
      return [
        "Design the Professional Website and SEO implementation.",
        "Focus on site structure, service pages, brand assets, local SEO keywords, trust/legal content and the public lead flow.",
        "Keep the first version commercial, fast and easy for the client to maintain.",
      ].join("\n")
    default:
      return "Design a practical implementation plan for this service track using the submitted onboarding evidence."
  }
}

function formatBytes(value?: number) {
  if (!value || value < 0) {
    return "unknown size"
  }

  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not set"
  }

  return new Date(value).toLocaleString()
}
