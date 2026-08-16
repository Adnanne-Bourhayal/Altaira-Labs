"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutGrid,
  Link2,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Send,
  Upload,
  UserRound,
  X,
} from "lucide-react"
import Logo from "@/components/Logo"
import ClientOnboardingWorkspace from "@/components/onboarding/ClientOnboardingWorkspace"
import { uploadFileDirectly } from "@/lib/client-direct-upload"

type WorkspaceTab = "summary" | "company" | "services" | "onboarding" | "documents"
type ProjectPhase = "requirements" | "design" | "development" | "review" | "launch"
type ReviewStatus = "uploaded" | "approved" | "rejected"
type OnboardingStatus = "pending" | "submitted" | "approved" | "rejected"

type ClientPortalModule = {
  moduleKey: string
  title: string
  description: string
  active: boolean
  locked: boolean
  status: string
  clientServiceId?: string | null
  serviceName?: string | null
}

type ProjectAsset = {
  id: string
  projectId: string
  clientId: string
  assetType: string
  notes?: string | null
  originalFilename: string
  contentType?: string | null
  sizeBytes: number
  externalUrl?: string | null
  status: ReviewStatus
  adminFeedback?: string | null
  uploadedAt?: string | null
  reviewedAt?: string | null
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
  assets?: ProjectAsset[]
}

type ClientPortal = {
  workspaceId: string
  workspaceName: string
  workspaceStatus: string
  client: {
    id: string
    name: string
    company: string
    email: string
    phone?: string | null
    status?: string | null
    sectorType?: string | null
    createdAt?: string | null
  }
  onboardingCompleted: boolean
  contractApproved: boolean
  accessRole: "admin" | "client_user" | "viewer"
  canEdit: boolean
  modules: ClientPortalModule[]
  projects: ClientProject[]
}

type OnboardingTask = {
  id: string
  serviceKey: string
  title: string
  description: string
  taskType: "signature" | "file_upload" | "preferences_form"
  status: OnboardingStatus
  required: boolean
  critical: boolean
  fileMetadataJson?: string | null
  adminFeedback?: string | null
  submittedAt?: string | null
  approvedAt?: string | null
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
  tasks: OnboardingTask[]
}

type OnboardingFile = {
  id: string
  originalFilename: string
  contentType?: string
  sizeBytes?: number
  createdAt?: string
}

type WorkspaceDocument = {
  id: string
  source: "project" | "onboarding" | "agreement"
  name: string
  serviceKey: string
  status: ReviewStatus | OnboardingStatus
  sizeBytes?: number
  externalUrl?: string | null
  downloadUrl?: string | null
  adminFeedback?: string | null
  createdAt?: string | null
  assetId?: string
}

type ClientWorkspaceShellProps = {
  workspaceId: string
  clientId?: string
  preview?: boolean
}

const tabs: Array<{ key: WorkspaceTab; label: string }> = [
  { key: "summary", label: "Resumen" },
  { key: "company", label: "Mi empresa" },
  { key: "services", label: "Mis servicios" },
  { key: "onboarding", label: "Onboarding" },
  { key: "documents", label: "Documentos" },
]

const phaseLabels: Record<string, Array<{ value: ProjectPhase; label: string }>> = {
  web_seo: [
    { value: "requirements", label: "Contenido" },
    { value: "design", label: "Diseño" },
    { value: "development", label: "Desarrollo" },
    { value: "review", label: "Revisión" },
    { value: "launch", label: "Lanzamiento" },
  ],
  booking: [
    { value: "requirements", label: "Reglas" },
    { value: "design", label: "Widget" },
    { value: "development", label: "Configuración" },
    { value: "review", label: "Pruebas" },
    { value: "launch", label: "Integración" },
  ],
  crm: [
    { value: "requirements", label: "Campos" },
    { value: "design", label: "Modelo" },
    { value: "development", label: "Migración" },
    { value: "review", label: "Integración" },
    { value: "launch", label: "Entrega" },
  ],
  automation: [
    { value: "requirements", label: "Objetivos" },
    { value: "design", label: "Conexiones" },
    { value: "development", label: "Flujos" },
    { value: "review", label: "Pruebas" },
    { value: "launch", label: "Activación" },
  ],
  dashboard: [
    { value: "requirements", label: "KPIs" },
    { value: "design", label: "Vistas" },
    { value: "development", label: "Datos" },
    { value: "review", label: "Validación" },
    { value: "launch", label: "Entrega" },
  ],
}

export function ClientWorkspaceShell({ workspaceId, clientId, preview = false }: ClientWorkspaceShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab") as WorkspaceTab | null
  const activeTab = tabs.some((tab) => tab.key === requestedTab) ? requestedTab! : "summary"
  const isAdmin = Boolean(clientId)
  const canManage = isAdmin && !preview

  const [portal, setPortal] = useState<ClientPortal | null>(null)
  const [onboarding, setOnboarding] = useState<OnboardingDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [assetType, setAssetType] = useState("general")
  const [assetNotes, setAssetNotes] = useState("")
  const [assetFiles, setAssetFiles] = useState<File[]>([])
  const [linkLabel, setLinkLabel] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [rejectTarget, setRejectTarget] = useState<{ type: "task" | "asset"; id: string } | null>(null)
  const [rejectFeedback, setRejectFeedback] = useState("")
  const [projectForm, setProjectForm] = useState({
    name: "",
    currentPhase: "requirements" as ProjectPhase,
    stagingUrl: "",
  })

  async function loadWorkspace(manual = false) {
    if (manual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError("")

    const portalEndpoint = isAdmin
      ? `/api/internal/client-portal/${clientId}`
      : "/api/client/portal"
    const onboardingEndpoint = isAdmin
      ? `/api/internal/onboarding/${clientId}`
      : "/api/client/onboarding"

    try {
      const [portalResponse, onboardingResponse] = await Promise.all([
        fetch(portalEndpoint, { cache: "no-store" }),
        fetch(onboardingEndpoint, { cache: "no-store" }),
      ])

      if (portalResponse.status === 401 || onboardingResponse.status === 401) {
        router.replace(isAdmin ? "/admin/login" : "/client/login")
        return
      }

      const portalData = await portalResponse.json().catch(() => ({ error: "Unexpected portal response" }))
      const onboardingData = await onboardingResponse.json().catch(() => ({ error: "Unexpected onboarding response" }))

      if (!portalResponse.ok) {
        throw new Error(portalData?.message || portalData?.error || "Could not load workspace.")
      }

      if (!onboardingResponse.ok) {
        throw new Error(onboardingData?.message || onboardingData?.error || "Could not load onboarding.")
      }

      if (portalData.workspaceId !== workspaceId || onboardingData.workspaceId !== workspaceId) {
        throw new Error("This workspace does not belong to the authenticated account.")
      }

      const nextPortal = portalData as ClientPortal
      setPortal(nextPortal)
      setOnboarding(onboardingData as OnboardingDashboard)

      const activeModules = nextPortal.modules.filter((module) => module.active)
      const nextServiceKey = selectedServiceKey && activeModules.some((module) => module.moduleKey === selectedServiceKey)
        ? selectedServiceKey
        : activeModules[0]?.moduleKey ?? null
      setSelectedServiceKey(nextServiceKey)

      const nextProject = nextPortal.projects.find((project) => project.projectKey === nextServiceKey)
      if (nextProject) {
        setProjectForm({
          name: nextProject.name,
          currentPhase: nextProject.currentPhase,
          stagingUrl: nextProject.stagingUrl || "",
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workspace.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, clientId])

  const activeModules = useMemo(
    () => portal?.modules.filter((module) => module.active) ?? [],
    [portal]
  )
  const selectedModule = activeModules.find((module) => module.moduleKey === selectedServiceKey) ?? activeModules[0]
  const selectedProject = portal?.projects.find((project) => project.projectKey === selectedModule?.moduleKey) ?? null
  const requiredTasks = onboarding?.tasks.filter((task) => task.required) ?? []
  const approvedRequired = requiredTasks.filter((task) => task.status === "approved").length
  const progress = requiredTasks.length === 0 ? 0 : Math.round((approvedRequired / requiredTasks.length) * 100)
  const nextTask = useMemo(() => {
    if (!onboarding) {
      return null
    }

    if (canManage) {
      return onboarding.tasks.find((task) => task.status === "submitted")
        ?? onboarding.tasks.find((task) => task.status === "rejected")
        ?? null
    }

    return onboarding.tasks.find((task) => task.status === "rejected")
      ?? onboarding.tasks.find((task) => task.status === "pending")
      ?? null
  }, [canManage, onboarding])
  const documents = useMemo(
    () => buildDocuments(portal, onboarding, isAdmin),
    [isAdmin, onboarding, portal]
  )

  function changeTab(tab: WorkspaceTab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function selectService(moduleKey: string) {
    setSelectedServiceKey(moduleKey)
    const project = portal?.projects.find((item) => item.projectKey === moduleKey)
    if (project) {
      setProjectForm({
        name: project.name,
        currentPhase: project.currentPhase,
        stagingUrl: project.stagingUrl || "",
      })
    }
    setNotice("")
    setError("")
  }

  async function signOut() {
    await fetch(isAdmin ? "/api/admin/auth/logout" : "/api/client/auth/logout", { method: "POST" }).catch(() => undefined)
    router.replace(isAdmin ? "/admin/login" : "/client/login")
  }

  async function updateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManage || !selectedProject) return

    await runAction(selectedProject.id, async () => {
      const response = await fetch(`/api/internal/client-projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectForm),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected project response" }))
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not update project.")
      setNotice("Service track updated.")
      await loadWorkspace(true)
    })
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isAdmin || preview || !selectedProject || feedback.trim().length < 8) {
      setError("Add a clear feedback note before sending.")
      return
    }

    await runAction(selectedProject.id, async () => {
      const response = await fetch(`/api/client/portal/projects/${selectedProject.id}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected feedback response" }))
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not send feedback.")
      setFeedback("")
      setNotice("Feedback sent to Altaira Labs.")
      await loadWorkspace(true)
    })
  }

  async function uploadAssets(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isAdmin || preview || !selectedProject || assetFiles.length === 0) {
      setError("Choose at least one file before uploading.")
      return
    }

    await runAction(`upload-${selectedProject.id}`, async () => {
      let directUploadStarted = false

      for (const file of assetFiles) {
        const receipt = await uploadFileDirectly(
          file,
          `/api/client/portal/projects/${selectedProject.id}/assets/upload-url`,
          assetType,
        )

        if (!receipt) {
          if (directUploadStarted) {
            throw new Error("Secure storage became unavailable during the upload. Please try again.")
          }
          await uploadAssetsMultipart(selectedProject.id)
          break
        }

        directUploadStarted = true
        const response = await fetch(`/api/client/portal/projects/${selectedProject.id}/assets/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...receipt, notes: assetNotes }),
        })
        const data = await response.json().catch(() => ({ error: "Unexpected upload response" }))
        if (!response.ok) throw new Error(data?.message || data?.error || "Could not confirm secure file upload.")
      }

      setAssetFiles([])
      setAssetNotes("")
      setNotice("Files uploaded for review.")
      await loadWorkspace(true)
    })
  }

  async function uploadAssetsMultipart(projectId: string) {
    const formData = new FormData()
    assetFiles.forEach((file) => formData.append("files", file))
    formData.append("assetType", assetType)
    formData.append("notes", assetNotes)

    const response = await fetch(`/api/client/portal/projects/${projectId}/assets`, {
      method: "POST",
      body: formData,
    })
    const data = await response.json().catch(() => ({ error: "Unexpected upload response" }))
    if (!response.ok) throw new Error(data?.message || data?.error || "Could not upload files.")
  }

  async function saveLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isAdmin || preview || !selectedProject || !linkLabel.trim() || !linkUrl.trim()) {
      setError("Add a label and a valid URL.")
      return
    }

    await runAction(`link-${selectedProject.id}`, async () => {
      const response = await fetch(`/api/client/portal/projects/${selectedProject.id}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: linkLabel,
          url: linkUrl,
          assetType: "external_link",
          notes: assetNotes,
        }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected link response" }))
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not save link.")
      setLinkLabel("")
      setLinkUrl("")
      setNotice("Project link saved.")
      await loadWorkspace(true)
    })
  }

  async function reviewTask(taskId: string, approve: boolean, reviewFeedback = "") {
    if (!canManage) return
    await runAction(taskId, async () => {
      const response = await fetch(
        `/api/internal/onboarding/tasks/${taskId}/${approve ? "approve" : "reject"}`,
        {
          method: "PATCH",
          headers: approve ? undefined : { "Content-Type": "application/json" },
          body: approve ? undefined : JSON.stringify({ feedback: reviewFeedback }),
        }
      )
      const data = await response.json().catch(() => ({ error: "Unexpected review response" }))
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not review onboarding task.")
      setRejectTarget(null)
      setRejectFeedback("")
      setNotice(approve ? "Onboarding item approved." : "Feedback sent to the client.")
      await loadWorkspace(true)
    })
  }

  async function reviewAsset(assetId: string, approve: boolean, reviewFeedback = "") {
    if (!canManage) return
    await runAction(assetId, async () => {
      const response = await fetch(
        `/api/internal/client-project-assets/${assetId}/${approve ? "approve" : "reject"}`,
        {
          method: "PATCH",
          headers: approve ? undefined : { "Content-Type": "application/json" },
          body: approve ? undefined : JSON.stringify({ feedback: reviewFeedback }),
        }
      )
      const data = await response.json().catch(() => ({ error: "Unexpected review response" }))
      if (!response.ok) throw new Error(data?.message || data?.error || "Could not review document.")
      setRejectTarget(null)
      setRejectFeedback("")
      setNotice(approve ? "Document approved." : "Document returned with feedback.")
      await loadWorkspace(true)
    })
  }

  async function runAction(id: string, action: () => Promise<void>) {
    setActionId(id)
    setError("")
    setNotice("")
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action could not be completed.")
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f4f4] px-6">
        <div className="inline-flex items-center gap-3 border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600">
          <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
          Loading private workspace...
        </div>
      </main>
    )
  }

  if (!portal || !onboarding) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f4f4] px-6">
        <div className="max-w-xl border border-red-200 bg-white p-7">
          <p className="font-semibold text-slate-950">Workspace unavailable</p>
          <p className="mt-2 text-sm leading-6 text-red-700">{error || "Could not load this workspace."}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-slate-950">
      {preview && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
          <span>Vista como cliente: los controles internos y datos privados están ocultos.</span>
          <Link href={`/clients/${portal.client.id}`} className="inline-flex items-center gap-2 border border-white/40 px-3 py-2 hover:bg-white/10">
            Exit preview
            <X className="h-4 w-4" />
          </Link>
        </div>
      )}

      <header className="border-b border-white/10 bg-[#090b12] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-5 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href={`/clients/${portal.client.id}`}
                className="hidden items-center gap-2 border border-white/15 px-4 py-2 text-sm text-white/70 hover:text-white sm:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
                Client CRM
              </Link>
            )}
            <button
              type="button"
              onClick={() => void loadWorkspace(true)}
              className="grid h-10 w-10 place-items-center border border-white/15 text-white/70 hover:text-white"
              title="Refresh workspace"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {!preview && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="grid h-10 w-10 place-items-center border border-white/15 text-white/70 hover:text-white"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-5 pt-8 lg:px-8">
          <div className="flex flex-col gap-5 pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                {canManage ? "Admin workspace" : "Client workspace"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {portal.client.company || portal.client.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {portal.workspaceName} · {humanize(portal.workspaceStatus)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`border px-3 py-2 font-semibold ${
                portal.contractApproved
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}>
                {portal.contractApproved ? "Agreement approved" : "Onboarding gate active"}
              </span>
            </div>
          </div>

          <nav className="flex overflow-x-auto" aria-label="Workspace sections">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => changeTab(tab.key)}
                className={`shrink-0 border-x border-t px-5 py-4 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        )}
        {notice && (
          <div className="mb-5 border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{notice}</div>
        )}

        {activeTab === "summary" && (
          <WorkspaceSummary
            portal={portal}
            onboarding={onboarding}
            progress={progress}
            nextTask={nextTask}
            onOpenTab={changeTab}
          />
        )}

        {activeTab === "company" && <CompanyPanel portal={portal} />}

        {activeTab === "services" && (
          <ServicesPanel
            portal={portal}
            modules={activeModules}
            selectedModule={selectedModule}
            selectedProject={selectedProject}
            projectForm={projectForm}
            setProjectForm={setProjectForm}
            canManage={canManage}
            canClientEdit={!isAdmin && !preview && portal.canEdit && portal.contractApproved}
            actionId={actionId}
            feedback={feedback}
            setFeedback={setFeedback}
            assetType={assetType}
            setAssetType={setAssetType}
            assetNotes={assetNotes}
            setAssetNotes={setAssetNotes}
            setAssetFiles={setAssetFiles}
            linkLabel={linkLabel}
            setLinkLabel={setLinkLabel}
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            onSelectService={selectService}
            onUpdateProject={updateProject}
            onSubmitFeedback={submitFeedback}
            onUploadAssets={uploadAssets}
            onSaveLink={saveLink}
          />
        )}

        {activeTab === "onboarding" && (
          isAdmin ? (
            <AdminOnboardingPanel
              onboarding={onboarding}
              readOnly={preview}
              actionId={actionId}
              onApprove={(taskId) => void reviewTask(taskId, true)}
              onReject={(taskId) => {
                setRejectTarget({ type: "task", id: taskId })
                setRejectFeedback("")
              }}
            />
          ) : (
            <ClientOnboardingWorkspace embedded />
          )
        )}

        {activeTab === "documents" && (
          <DocumentsPanel
            documents={documents}
            canManage={canManage}
            actionId={actionId}
            onApprove={(assetId) => void reviewAsset(assetId, true)}
            onReject={(assetId) => {
              setRejectTarget({ type: "asset", id: assetId })
              setRejectFeedback("")
            }}
          />
        )}
      </section>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg border border-slate-300 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Review feedback</p>
                <h2 className="mt-2 text-xl font-semibold">Explain what needs correction</h2>
              </div>
              <button type="button" onClick={() => setRejectTarget(null)} className="grid h-9 w-9 place-items-center border border-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={rejectFeedback}
              onChange={(event) => setRejectFeedback(event.target.value)}
              rows={5}
              className="mt-5 w-full border border-slate-300 p-3 text-sm outline-none focus:border-blue-600"
              placeholder="Give the client a clear, actionable correction."
            />
            <button
              type="button"
              disabled={rejectFeedback.trim().length < 4 || actionId === rejectTarget.id}
              onClick={() => {
                if (rejectTarget.type === "task") {
                  void reviewTask(rejectTarget.id, false, rejectFeedback)
                } else {
                  void reviewAsset(rejectTarget.id, false, rejectFeedback)
                }
              }}
              className="mt-4 inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send feedback
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

function WorkspaceSummary({
  portal,
  onboarding,
  progress,
  nextTask,
  onOpenTab,
}: {
  portal: ClientPortal
  onboarding: OnboardingDashboard
  progress: number
  nextTask: OnboardingTask | null
  onOpenTab: (tab: WorkspaceTab) => void
}) {
  const activeModules = portal.modules.filter((module) => module.active)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
      <div className="grid gap-6">
        <section className="border border-slate-200 bg-white p-7">
          <div className="grid gap-7 lg:grid-cols-[1fr_300px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Resumen</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your project workspace</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                One place for contracted services, required actions, review status and delivery material.
              </p>
            </div>
            <div className="border-l-2 border-blue-600 pl-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Approved onboarding</span>
                <span className="font-semibold text-blue-700">{progress}%</span>
              </div>
              <div className="mt-3 h-2 bg-slate-200">
                <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {onboarding.completedRequiredTasks} of {onboarding.totalRequiredTasks} required items approved
              </p>
            </div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active scope</p>
              <h2 className="mt-2 text-xl font-semibold">Contracted services</h2>
            </div>
            <button type="button" onClick={() => onOpenTab("services")} className="text-sm font-semibold text-blue-700">
              Open services
            </button>
          </div>
          <div className="grid sm:grid-cols-2">
            {activeModules.length === 0 ? (
              <EmptyState title="No active services" detail="The workspace has no contracted service tracks yet." />
            ) : activeModules.map((module) => {
              const project = portal.projects.find((item) => item.projectKey === module.moduleKey)
              return (
                <button
                  key={module.moduleKey}
                  type="button"
                  onClick={() => onOpenTab("services")}
                  className="border-b border-r border-slate-200 p-6 text-left transition hover:bg-slate-50"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{humanize(module.moduleKey)}</p>
                  <h3 className="mt-3 font-semibold">{module.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {project ? `Current phase: ${phaseLabel(project.projectKey, project.currentPhase)}` : "Project track pending"}
                  </p>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      <aside className="grid content-start gap-6">
        <section className="border border-slate-900 bg-[#0b0d14] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Next action</p>
          {nextTask ? (
            <>
              <h2 className="mt-4 text-xl font-semibold">{nextTask.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                {nextTask.status === "submitted"
                  ? "Waiting for Altaira Labs review."
                  : nextTask.status === "rejected"
                    ? nextTask.adminFeedback || "A correction is required."
                    : "This information is required before the project can continue."}
              </p>
              <button
                type="button"
                onClick={() => onOpenTab("onboarding")}
                className="mt-6 inline-flex items-center gap-2 bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Open onboarding
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-xl font-semibold">No pending action</h2>
              <p className="mt-2 text-sm text-white/55">There is nothing requiring attention right now.</p>
            </>
          )}
        </section>

        <section className="border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace status</p>
          <div className="mt-5 grid gap-4 text-sm">
            <SummaryRow label="Agreement" value={portal.contractApproved ? "Approved" : onboarding.contractSubmitted ? "Under review" : "Pending"} />
            <SummaryRow label="Onboarding" value={portal.onboardingCompleted ? "Complete" : `${onboarding.totalRequiredTasks - onboarding.completedRequiredTasks} pending`} />
            <SummaryRow label="Documents" value={`${portal.projects.flatMap((project) => project.assets ?? []).length} project items`} />
          </div>
        </section>
      </aside>
    </div>
  )
}

function CompanyPanel({ portal }: { portal: ClientPortal }) {
  const company = portal.client.company || portal.client.name
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Mi empresa</p>
          <h2 className="mt-3 text-3xl font-semibold">{company}</h2>
          <p className="mt-3 text-sm text-slate-500">The business profile linked to this private workspace.</p>
        </div>
        <dl className="grid md:grid-cols-2">
          <CompanyDatum icon={UserRound} label="Primary contact" value={portal.client.name || "Not provided"} />
          <CompanyDatum icon={Building2} label="Company" value={company} />
          <CompanyDatum icon={MessageSquareText} label="Email" value={portal.client.email || "Not provided"} />
          <CompanyDatum icon={LayoutGrid} label="Sector" value={humanize(portal.client.sectorType || "not_provided")} />
          <CompanyDatum icon={MessageSquareText} label="Phone" value={portal.client.phone || "Not provided"} />
          <CompanyDatum icon={CheckCircle2} label="Client status" value={humanize(portal.client.status || "not_provided")} />
        </dl>
      </section>
      <aside className="border border-slate-900 bg-[#0b0d14] p-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Data quality</p>
        <h2 className="mt-4 text-xl font-semibold">Keep the project context current</h2>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Business and sector information controls the onboarding questions and the service configuration.
        </p>
        <p className="mt-7 border-t border-white/10 pt-5 text-sm text-white/55">
          Corrections can be submitted from the onboarding business profile task.
        </p>
      </aside>
    </div>
  )
}

function ServicesPanel({
  portal,
  modules,
  selectedModule,
  selectedProject,
  projectForm,
  setProjectForm,
  canManage,
  canClientEdit,
  actionId,
  feedback,
  setFeedback,
  assetType,
  setAssetType,
  assetNotes,
  setAssetNotes,
  setAssetFiles,
  linkLabel,
  setLinkLabel,
  linkUrl,
  setLinkUrl,
  onSelectService,
  onUpdateProject,
  onSubmitFeedback,
  onUploadAssets,
  onSaveLink,
}: {
  portal: ClientPortal
  modules: ClientPortalModule[]
  selectedModule?: ClientPortalModule
  selectedProject: ClientProject | null
  projectForm: { name: string; currentPhase: ProjectPhase; stagingUrl: string }
  setProjectForm: (value: { name: string; currentPhase: ProjectPhase; stagingUrl: string }) => void
  canManage: boolean
  canClientEdit: boolean
  actionId: string | null
  feedback: string
  setFeedback: (value: string) => void
  assetType: string
  setAssetType: (value: string) => void
  assetNotes: string
  setAssetNotes: (value: string) => void
  setAssetFiles: (value: File[]) => void
  linkLabel: string
  setLinkLabel: (value: string) => void
  linkUrl: string
  setLinkUrl: (value: string) => void
  onSelectService: (key: string) => void
  onUpdateProject: (event: React.FormEvent<HTMLFormElement>) => void
  onSubmitFeedback: (event: React.FormEvent<HTMLFormElement>) => void
  onUploadAssets: (event: React.FormEvent<HTMLFormElement>) => void
  onSaveLink: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  if (modules.length === 0) {
    return <EmptyState title="No active services" detail="Only contracted services appear in the client workspace." />
  }

  const phases = phaseLabels[selectedProject?.projectKey || ""] ?? phaseLabels.web_seo
  const currentIndex = Math.max(0, phases.findIndex((phase) => phase.value === selectedProject?.currentPhase))

  return (
    <div className="grid gap-6">
      <section className="border border-slate-200 bg-white">
        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max">
            {modules.map((module) => (
              <button
                key={module.moduleKey}
                type="button"
                onClick={() => onSelectService(module.moduleKey)}
                className={`border-r border-slate-200 px-5 py-4 text-sm font-semibold ${
                  selectedModule?.moduleKey === module.moduleKey
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {module.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 p-7 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{humanize(selectedModule?.moduleKey || "")}</p>
            <h2 className="mt-3 text-3xl font-semibold">{selectedProject?.name || selectedModule?.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{selectedModule?.description}</p>

            <div className="mt-8 grid gap-2 sm:grid-cols-5">
              {phases.map((phase, index) => (
                <div
                  key={phase.value}
                  className={`border px-3 py-4 text-sm ${
                    index < currentIndex
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : index === currentIndex
                        ? "border-blue-600 bg-blue-50 font-semibold text-blue-800"
                        : "border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="block text-xs">{index + 1}</span>
                  <span className="mt-2 block">{phase.label}</span>
                </div>
              ))}
            </div>

            {selectedProject?.latestClientFeedback && (
              <div className="mt-6 border-l-2 border-violet-600 bg-violet-50 px-5 py-4 text-sm text-violet-950">
                <span className="font-semibold">Latest feedback:</span> {selectedProject.latestClientFeedback}
              </div>
            )}

            {selectedProject?.stagingUrl && (
              <Link
                href={selectedProject.stagingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 border border-slate-950 px-4 py-3 text-sm font-semibold hover:bg-slate-950 hover:text-white"
              >
                Open staging
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>

          {canManage ? (
            <form onSubmit={onUpdateProject} className="border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Admin controls</p>
              <label className="mt-5 grid gap-2 text-sm font-semibold">
                Project name
                <input
                  value={projectForm.name}
                  onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
                  className="border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-600"
                />
              </label>
              <label className="mt-4 grid gap-2 text-sm font-semibold">
                Current phase
                <select
                  value={projectForm.currentPhase}
                  onChange={(event) => setProjectForm({ ...projectForm, currentPhase: event.target.value as ProjectPhase })}
                  className="border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-600"
                >
                  {phases.map((phase) => <option key={phase.value} value={phase.value}>{phase.label}</option>)}
                </select>
              </label>
              <label className="mt-4 grid gap-2 text-sm font-semibold">
                Staging URL
                <input
                  value={projectForm.stagingUrl}
                  onChange={(event) => setProjectForm({ ...projectForm, stagingUrl: event.target.value })}
                  className="border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-600"
                />
              </label>
              <button
                type="submit"
                disabled={!selectedProject || actionId === selectedProject?.id}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Save track
              </button>
            </form>
          ) : (
            <div className="border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Your role</p>
              <h3 className="mt-3 font-semibold">{portal.canEdit ? "Client editor" : "Read-only viewer"}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You can see project status and approved resources. Client editors can submit feedback and materials.
              </p>
            </div>
          )}
        </div>
      </section>

      {!canManage && selectedProject && (
        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={onSubmitFeedback} className="border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Review / feedback</p>
            <h3 className="mt-3 text-xl font-semibold">Send a change request</h3>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              disabled={!canClientEdit}
              rows={5}
              className="mt-5 w-full border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100"
              placeholder="Explain what should change and where."
            />
            <button
              type="submit"
              disabled={!canClientEdit || actionId === selectedProject.id}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-45"
            >
              <Send className="h-4 w-4" />
              Send feedback
            </button>
          </form>

          <div className="grid gap-6">
            <form onSubmit={onUploadAssets} className="border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Materials</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  value={assetType}
                  onChange={(event) => setAssetType(event.target.value)}
                  disabled={!canClientEdit}
                  className="border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="general">General</option>
                  <option value="brand_logo">Brand / logo</option>
                  <option value="website_copy">Website content</option>
                  <option value="booking_rules">Booking rules</option>
                  <option value="crm_import">CRM import</option>
                  <option value="workflow_map">Workflow map</option>
                  <option value="dashboard_metrics">Dashboard metrics</option>
                </select>
                <input
                  type="file"
                  multiple
                  disabled={!canClientEdit}
                  onChange={(event) => setAssetFiles(Array.from(event.target.files ?? []))}
                  className="border border-slate-300 p-2 text-sm"
                />
              </div>
              <input
                value={assetNotes}
                onChange={(event) => setAssetNotes(event.target.value)}
                disabled={!canClientEdit}
                placeholder="Short note for Altaira Labs"
                className="mt-3 w-full border border-slate-300 px-3 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={!canClientEdit || actionId === `upload-${selectedProject.id}`}
                className="mt-4 inline-flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-45"
              >
                <Upload className="h-4 w-4" />
                Upload files
              </button>
            </form>

            <form onSubmit={onSaveLink} className="border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Shared link</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={linkLabel}
                  onChange={(event) => setLinkLabel(event.target.value)}
                  disabled={!canClientEdit}
                  placeholder="Link label"
                  className="border border-slate-300 px-3 py-2.5 text-sm"
                />
                <input
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  disabled={!canClientEdit}
                  type="url"
                  placeholder="https://"
                  className="border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!canClientEdit || actionId === `link-${selectedProject.id}`}
                className="mt-4 inline-flex items-center gap-2 border border-slate-950 px-4 py-3 text-sm font-semibold disabled:opacity-45"
              >
                <Link2 className="h-4 w-4" />
                Save link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminOnboardingPanel({
  onboarding,
  readOnly,
  actionId,
  onApprove,
  onReject,
}: {
  onboarding: OnboardingDashboard
  readOnly: boolean
  actionId: string | null
  onApprove: (taskId: string) => void
  onReject: (taskId: string) => void
}) {
  const [serviceKey, setServiceKey] = useState("general")
  const serviceKeys = Array.from(new Set(onboarding.tasks.map((task) => task.serviceKey)))
  const tasks = onboarding.tasks.filter((task) => task.serviceKey === serviceKey)

  return (
    <div className="grid gap-6">
      <section className="border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Onboarding review</p>
            <h2 className="mt-3 text-2xl font-semibold">Client submissions by service</h2>
            <p className="mt-2 text-sm text-slate-500">{onboarding.submittedTasks} items waiting · {onboarding.rejectedTasks} returned</p>
          </div>
          <select value={serviceKey} onChange={(event) => setServiceKey(event.target.value)} className="border border-slate-300 bg-white px-4 py-3 text-sm">
            {serviceKeys.map((key) => <option key={key} value={key}>{humanize(key)}</option>)}
          </select>
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        {tasks.length === 0 ? (
          <EmptyState title="No onboarding items" detail="This service has no generated checklist items." />
        ) : tasks.map((task) => (
          <div key={task.id} className="grid gap-4 border-b border-slate-200 p-5 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{task.title}</h3>
                {task.critical && <span className="border border-blue-200 px-2 py-1 text-[10px] font-semibold uppercase text-blue-700">Critical</span>}
                <StatusLabel status={task.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
              {task.adminFeedback && <p className="mt-3 text-sm text-red-700">Feedback: {task.adminFeedback}</p>}
            </div>
            {!readOnly && task.status === "submitted" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actionId === task.id}
                  onClick={() => onReject(task.id)}
                  className="border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Return
                </button>
                <button
                  type="button"
                  disabled={actionId === task.id}
                  onClick={() => onApprove(task.id)}
                  className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

function DocumentsPanel({
  documents,
  canManage,
  actionId,
  onApprove,
  onReject,
}: {
  documents: WorkspaceDocument[]
  canManage: boolean
  actionId: string | null
  onApprove: (assetId: string) => void
  onReject: (assetId: string) => void
}) {
  const [filter, setFilter] = useState("all")
  const serviceKeys = Array.from(new Set(documents.map((document) => document.serviceKey)))
  const visibleDocuments = filter === "all" ? documents : documents.filter((document) => document.serviceKey === filter)

  return (
    <div className="grid gap-6">
      <section className="border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Documentos</p>
            <h2 className="mt-3 text-2xl font-semibold">Files, agreements and shared resources</h2>
            <p className="mt-2 text-sm text-slate-500">Only material associated with this client workspace is shown.</p>
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-slate-300 bg-white px-4 py-3 text-sm">
            <option value="all">All services</option>
            {serviceKeys.map((key) => <option key={key} value={key}>{humanize(key)}</option>)}
          </select>
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_150px_130px_220px] border-b border-slate-200 bg-slate-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/60 md:grid">
          <span>Document</span>
          <span>Service</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {visibleDocuments.length === 0 ? (
          <EmptyState title="No documents yet" detail="Uploaded files and shared links will appear here." />
        ) : visibleDocuments.map((document) => (
          <div key={`${document.source}-${document.id}`} className="grid gap-4 border-b border-slate-200 p-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_150px_130px_220px] md:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {document.externalUrl ? <Link2 className="h-4 w-4 text-violet-700" /> : <FileText className="h-4 w-4 text-blue-700" />}
                <p className="truncate font-semibold">{document.name}</p>
              </div>
              <p className="mt-2 text-xs text-slate-500">{humanize(document.source)}{document.sizeBytes ? ` · ${formatBytes(document.sizeBytes)}` : ""}</p>
              {document.adminFeedback && <p className="mt-2 text-sm text-red-700">{document.adminFeedback}</p>}
            </div>
            <span className="text-sm text-slate-600">{humanize(document.serviceKey)}</span>
            <StatusLabel status={document.status} />
            <div className="flex flex-wrap gap-2">
              {document.externalUrl && (
                <Link href={document.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold">
                  Open
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              {document.downloadUrl && (
                <a href={document.downloadUrl} className="inline-flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold">
                  Download
                  <Download className="h-4 w-4" />
                </a>
              )}
              {canManage && document.source === "project" && document.assetId && document.status === "uploaded" && (
                <>
                  <button type="button" onClick={() => onReject(document.assetId!)} className="border border-slate-300 px-3 py-2 text-sm font-semibold">Return</button>
                  <button
                    type="button"
                    disabled={actionId === document.assetId}
                    onClick={() => onApprove(document.assetId!)}
                    className="bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function CompanyDatum({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="border-b border-r border-slate-200 p-6">
      <Icon className="h-5 w-5 text-blue-700" />
      <dt className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-2 font-semibold">{value}</dd>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  )
}

function StatusLabel({ status }: { status: string }) {
  const tone = status === "approved"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "rejected"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "submitted" || status === "uploaded"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-slate-200 bg-slate-50 text-slate-600"

  return <span className={`w-fit border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}>{humanize(status)}</span>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="col-span-full px-7 py-14 text-center">
      <FolderOpen className="mx-auto h-6 w-6 text-blue-600" />
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  )
}

function buildDocuments(
  portal: ClientPortal | null,
  onboarding: OnboardingDashboard | null,
  isAdmin: boolean
): WorkspaceDocument[] {
  if (!portal || !onboarding) return []

  const projectDocuments = portal.projects.flatMap((project) =>
    (project.assets ?? []).map((asset): WorkspaceDocument => ({
      id: asset.id,
      source: "project",
      name: asset.originalFilename,
      serviceKey: project.projectKey,
      status: asset.status,
      sizeBytes: asset.sizeBytes,
      externalUrl: asset.externalUrl,
      downloadUrl: asset.externalUrl
        ? null
        : isAdmin
          ? `/api/internal/client-project-assets/${asset.id}/download`
          : `/api/client/portal/assets/${asset.id}/download`,
      adminFeedback: asset.adminFeedback,
      createdAt: asset.uploadedAt,
      assetId: asset.id,
    }))
  )

  const onboardingDocuments = onboarding.tasks.flatMap((task) =>
    parseOnboardingFiles(task.fileMetadataJson).map((file): WorkspaceDocument => ({
      id: file.id,
      source: "onboarding",
      name: file.originalFilename,
      serviceKey: task.serviceKey,
      status: task.status,
      sizeBytes: file.sizeBytes,
      downloadUrl: isAdmin
        ? `/api/internal/onboarding/files/${file.id}/download`
        : `/api/client/onboarding/files/${file.id}/download`,
      adminFeedback: task.adminFeedback,
      createdAt: file.createdAt,
    }))
  )

  const agreements = onboarding.tasks
    .filter((task) => task.taskType === "signature" && task.status !== "pending")
    .map((task): WorkspaceDocument => ({
      id: task.id,
      source: "agreement",
      name: task.title,
      serviceKey: task.serviceKey,
      status: task.status,
      adminFeedback: task.adminFeedback,
      createdAt: task.approvedAt || task.submittedAt,
    }))

  return [...agreements, ...onboardingDocuments, ...projectDocuments]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
}

function parseOnboardingFiles(value?: string | null): OnboardingFile[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is OnboardingFile =>
      Boolean(item && typeof item.id === "string" && typeof item.originalFilename === "string")
    )
  } catch {
    return []
  }
}

function phaseLabel(projectKey: string, phase: ProjectPhase) {
  return (phaseLabels[projectKey] ?? []).find((item) => item.value === phase)?.label ?? humanize(phase)
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
