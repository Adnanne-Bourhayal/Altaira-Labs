"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ListTodo,
  LockKeyhole,
  RefreshCw,
} from "lucide-react"

type PortalModule = {
  moduleKey: string
  title: string
  description: string
  active: boolean
  locked: boolean
  status: string
}

type ProjectAsset = {
  id: string
  originalFilename: string
  assetType: string
  status: string
  externalUrl?: string | null
}

type PortalProject = {
  id: string
  projectKey: string
  name: string
  currentPhase: string
  stagingUrl?: string | null
  assets?: ProjectAsset[]
}

type ClientPortal = {
  client: {
    id: string
    name: string
    company: string
    email: string
  }
  onboardingCompleted: boolean
  contractApproved: boolean
  accessRole: string
  canEdit: boolean
  modules: PortalModule[]
  projects: PortalProject[]
}

type PreviewTask = {
  id: string
  title: string
  description?: string | null
  serviceKey: string
  serviceName?: string | null
  projectName?: string | null
  status: string
  ownerRole: string
  dueAt?: string | null
}

const openStatuses = new Set([
  "not_started",
  "in_progress",
  "submitted",
  "needs_review",
  "blocked",
])

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value?: string | null) {
  if (!value) {
    return "No deadline"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "No deadline"
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function AdminClientPreview() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [portal, setPortal] = useState<ClientPortal | null>(null)
  const [tasks, setTasks] = useState<PreviewTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const [portalResponse, tasksResponse] = await Promise.all([
        fetch(`/api/internal/client-portal/${params.id}`, { cache: "no-store" }),
        fetch(`/api/internal/clients/${params.id}/preview-tasks`, { cache: "no-store" }),
      ])

      if (portalResponse.status === 401 || tasksResponse.status === 401) {
        router.replace("/admin/login")
        return
      }

      const portalData = await portalResponse
        .json()
        .catch(() => ({ error: "Unexpected client preview response" }))
      const tasksData = await tasksResponse
        .json()
        .catch(() => ({ error: "Unexpected task preview response" }))

      if (!portalResponse.ok || !portalData?.client?.id) {
        throw new Error(
          portalData?.message || portalData?.error || "Could not load client preview"
        )
      }

      if (!tasksResponse.ok || !Array.isArray(tasksData)) {
        throw new Error(
          tasksData?.message || tasksData?.error || "Could not load preview tasks"
        )
      }

      setPortal(portalData)
      setTasks(tasksData)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load client preview"
      )
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    void loadPreview()
  }, [loadPreview])

  const activeModules = useMemo(
    () => portal?.modules.filter((module) => module.active) ?? [],
    [portal]
  )
  const openTasks = useMemo(
    () => tasks.filter((task) => openStatuses.has(task.status)),
    [tasks]
  )
  const clientTasks = useMemo(
    () => openTasks.filter((task) => task.ownerRole === "client"),
    [openTasks]
  )
  const assetCount =
    portal?.projects.reduce(
      (total, project) => total + (project.assets?.length ?? 0),
      0
    ) ?? 0

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f4f4] text-[#161616]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin text-[#0f62fe]" />
          Preparing client visibility
        </div>
      </main>
    )
  }

  if (error || !portal) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f4f4] p-6 text-[#161616]">
        <div className="w-full max-w-lg border border-red-200 bg-white p-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h1 className="mt-4 text-xl font-semibold">Preview unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link
            href={`/clients/${params.id}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f62fe]"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to client
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#161616]">
      <div className="sticky top-0 z-50 flex min-h-12 items-center justify-between gap-4 bg-[#0f62fe] px-4 py-2 text-white md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Eye className="h-4 w-4 shrink-0" />
          <p className="truncate text-sm font-semibold">
            Client preview: {portal.client.company}
          </p>
          <span className="hidden text-xs text-white/70 md:inline">
            You remain signed in as administrator. All actions are disabled.
          </span>
        </div>
        <Link
          href={`/clients/${portal.client.id}`}
          className="inline-flex h-8 shrink-0 items-center gap-2 border border-white/50 px-3 text-xs font-semibold transition hover:bg-white hover:text-[#0f62fe]"
        >
          Exit preview
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid min-h-[calc(100vh-48px)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-[#393939] bg-[#161616] px-4 py-6 text-white">
          <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-6">
            <Image
              src="/brand/favicon.png"
              alt=""
              width={34}
              height={34}
              className="h-9 w-9 object-contain brightness-0 invert"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold tracking-[0.16em]">
                ALTAIRA LABS
              </p>
              <p className="mt-1 truncate text-xs text-white/45">Client workspace</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1" aria-label="Client preview navigation">
            <PreviewNavItem icon={LayoutDashboard} label="Overview" active />
            {activeModules.map((module) => (
              <PreviewNavItem
                key={module.moduleKey}
                icon={FolderOpen}
                label={module.title}
                locked={module.locked}
              />
            ))}
            <PreviewNavItem icon={ListTodo} label="Tasks" />
            <PreviewNavItem icon={FileText} label="Resources" />
            <PreviewNavItem icon={CalendarDays} label="Calendar" />
          </nav>

          <div className="mt-8 border-t border-white/10 px-2 pt-5">
            <p className="text-xs text-white/35">Signed in client</p>
            <p className="mt-1 truncate text-sm font-medium">{portal.client.name}</p>
            <p className="mt-1 truncate text-xs text-white/45">{portal.client.email}</p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-8 md:px-8 xl:px-12">
          <div className="mx-auto max-w-[1380px]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">
              Client workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {portal.client.company}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Overview of contracted services, client actions and shared resources.
            </p>

            {!portal.contractApproved ? (
              <section className="mt-8 border border-slate-300 bg-white p-8">
                <LockKeyhole className="h-6 w-6 text-[#0f62fe]" />
                <h2 className="mt-5 text-2xl font-semibold">Workspace access is locked</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  The client must complete the required contract step before service tracks,
                  tasks and resources become available.
                </p>
              </section>
            ) : (
              <>
                <section className="mt-8 grid border-y border-slate-300 md:grid-cols-2 xl:grid-cols-4">
                  <PreviewMetric label="Active services" value={activeModules.length} />
                  <PreviewMetric label="Open tasks" value={openTasks.length} />
                  <PreviewMetric label="Your actions" value={clientTasks.length} />
                  <PreviewMetric label="Shared resources" value={assetCount} />
                </section>

                <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <section>
                    <div className="flex items-end justify-between gap-4 border-b border-slate-300 pb-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Contracted scope
                        </p>
                        <h2 className="mt-2 text-xl font-semibold">Service tracks</h2>
                      </div>
                      <span className="text-sm text-slate-500">
                        {activeModules.length} active
                      </span>
                    </div>

                    {activeModules.length === 0 ? (
                      <PreviewEmpty
                        title="No active service tracks"
                        text="Contracted services will appear here when they are assigned."
                      />
                    ) : (
                      <div className="divide-y divide-slate-300">
                        {activeModules.map((module) => {
                          const project = portal.projects.find(
                            (item) => item.projectKey === module.moduleKey
                          )
                          return (
                            <article
                              key={module.moduleKey}
                              className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_220px]"
                            >
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold">{module.title}</h3>
                                  {module.locked && (
                                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                  {module.description}
                                </p>
                              </div>
                              <div className="border-l border-slate-300 pl-5">
                                <p className="text-xs uppercase tracking-[0.13em] text-slate-400">
                                  Current phase
                                </p>
                                <p className="mt-2 text-sm font-semibold">
                                  {project
                                    ? humanize(project.currentPhase)
                                    : humanize(module.status)}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {project?.name || "Project setup pending"}
                                </p>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  <aside>
                    <div className="border border-[#393939] bg-[#161616] p-6 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78a9ff]">
                        Next actions
                      </p>
                      <h2 className="mt-3 text-xl font-semibold">What you need to do</h2>
                      {clientTasks.length === 0 ? (
                        <p className="mt-5 text-sm leading-6 text-white/50">
                          There are no client actions pending.
                        </p>
                      ) : (
                        <div className="mt-5 divide-y divide-white/10">
                          {clientTasks.slice(0, 5).map((task) => (
                            <div key={task.id} className="py-4 first:pt-0">
                              <p className="text-sm font-semibold">{task.title}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-white/45">
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatDate(task.dueAt)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border border-slate-300 bg-white p-6">
                      <CheckCircle2 className="h-5 w-5 text-[#0f62fe]" />
                      <h2 className="mt-4 font-semibold">Onboarding</h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {portal.onboardingCompleted
                          ? "Required onboarding is complete."
                          : "Required onboarding is still in progress."}
                      </p>
                    </div>
                  </aside>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function PreviewNavItem({
  icon: Icon,
  label,
  active = false,
  locked = false,
}: {
  icon: typeof LayoutDashboard
  label: string
  active?: boolean
  locked?: boolean
}) {
  return (
    <div
      className={`flex h-11 items-center gap-3 border-l-2 px-3 text-sm ${
        active
          ? "border-[#0f62fe] bg-[#262626] text-white"
          : "border-transparent text-white/55"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {locked && <LockKeyhole className="h-3.5 w-3.5 text-white/30" />}
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-slate-300 py-6 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function PreviewEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-b border-slate-300 py-8">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  )
}
