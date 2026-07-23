"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { type AdminClientSummary } from "@/lib/admin-client-summary"

type AdminProject = {
  id: string
  clientId: string
  clientName: string
  clientCompany: string
  serviceName?: string | null
  projectKey: string
  name: string
  currentPhase: string
  reviewPending: boolean
  updatedAt?: string | null
}

type WorkspaceTask = {
  id: string
  clientId: string
  clientCompany: string
  projectId?: string | null
  projectName?: string | null
  serviceName?: string | null
  serviceKey: string
  title: string
  status: string
  priority: string
  ownerRole: string
  dueAt?: string | null
}

type AdminAction = {
  sourceId: string
  actionType: string
  title: string
  clientId: string
  clientCompany: string
  projectId?: string | null
  projectName?: string | null
  serviceName?: string | null
  actionAt?: string | null
}

type AttentionItem = {
  id: string
  label: string
  context: string
  href: string
  dueAt?: string | null
  kind: "blocked" | "overdue" | "review"
}

const openStatuses = new Set([
  "not_started",
  "in_progress",
  "submitted",
  "needs_review",
  "blocked",
])

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export function AdminDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [tasks, setTasks] = useState<WorkspaceTask[]>([])
  const [clients, setClients] = useState<AdminClientSummary[]>([])
  const [actions, setActions] = useState<AdminAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const responses = await Promise.all([
        fetch("/api/internal/client-projects", { cache: "no-store" }),
        fetch("/api/internal/workspace-tasks", { cache: "no-store" }),
        fetch("/api/internal/clients/admin-summaries", { cache: "no-store" }),
        fetch("/api/internal/admin-actions", { cache: "no-store" }),
      ])

      if (responses.some((response) => response.status === 401)) {
        router.replace("/admin/login")
        return
      }

      const payloads = await Promise.all(
        responses.map((response) =>
          response.json().catch(() => ({ error: "Unexpected dashboard response" }))
        )
      )

      const failedIndex = responses.findIndex((response) => !response.ok)
      if (failedIndex >= 0) {
        const data = payloads[failedIndex]
        throw new Error(
          data?.message || data?.error || "Could not load the admin dashboard"
        )
      }

      if (payloads.some((payload) => !Array.isArray(payload))) {
        throw new Error("Dashboard services returned an unexpected response")
      }

      setProjects(payloads[0])
      setTasks(payloads[1])
      setClients(payloads[2])
      setActions(payloads[3])
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load the admin dashboard"
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const openTasks = useMemo(
    () => tasks.filter((task) => openStatuses.has(task.status)),
    [tasks]
  )

  const attention = useMemo(
    () => buildAttentionItems(openTasks, actions),
    [actions, openTasks]
  )

  const activeProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (first, second) =>
            timestamp(second.updatedAt) - timestamp(first.updatedAt)
        )
        .slice(0, 6),
    [projects]
  )

  const metrics = [
    {
      label: "Projects",
      value: projects.length,
      note: projects.length === 0 ? "No active projects" : "Active workspaces",
      icon: FolderKanban,
    },
    {
      label: "Open tasks",
      value: openTasks.length,
      note:
        openTasks.length === 0
          ? "Nothing pending"
          : `${openTasks.filter((task) => task.ownerRole === "admin").length} owned by Altaira`,
      icon: ListTodo,
    },
    {
      label: "Clients",
      value: clients.length,
      note: clients.length === 0 ? "No verified clients" : "Persisted client records",
      icon: Users,
    },
    {
      label: "Attention",
      value: attention.length,
      note: attention.length === 0 ? "No urgent attention" : "Blocked, overdue or submitted",
      icon: ShieldAlert,
    },
  ]

  return (
    <AdminShell>
      <main className="px-4 py-10 md:px-8 md:py-12 xl:px-12">
        <div className="mx-auto max-w-[1480px]">
          <header className="flex flex-col gap-5 border-b border-slate-300 pb-8 dark:border-white/15 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">
                Admin workspace
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#161616] md:text-4xl dark:text-white">
                Overview
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Open work, immediate attention and the next operational step.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex h-10 w-fit items-center gap-2 border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-white/20 dark:text-white/70"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </header>

          {error && (
            <div className="mt-7 flex gap-3 border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Dashboard unavailable</p>
                <p className="mt-1 text-sm opacity-75">{error}</p>
              </div>
            </div>
          )}

          <section
            className="mt-8 grid border border-[#393939] bg-[#161616] text-white sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Workspace summary"
          >
            {metrics.map((metric, index) => (
              <Metric
                key={metric.label}
                {...metric}
                loading={loading}
                last={index === metrics.length - 1}
              />
            ))}
          </section>

          <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_390px]">
            <section>
              <SectionHeading
                eyebrow="Delivery"
                title="Active projects"
                count={projects.length}
                href="/admin/projects"
                action="Open projects"
              />

              {!loading && activeProjects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No active projects"
                  text="A real project will appear after a client receives a contracted service track."
                  href="/clients"
                  action="Open clients"
                />
              ) : (
                <div className="divide-y divide-[#393939] border border-[#393939] bg-[#161616] text-white">
                  {activeProjects.map((project) => {
                    const nextTask = nextTaskForProject(project.id, openTasks)
                    return (
                      <Link
                        key={project.id}
                        href={`/clients/${project.clientId}/workspace`}
                        className="grid gap-5 px-6 py-6 transition hover:bg-[#262626] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{project.name}</p>
                          <p className="mt-1 truncate text-sm text-white/45">
                            {project.clientCompany}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.13em] text-white/35">
                            Next action
                          </p>
                          <p className="mt-1 truncate text-sm text-white/75">
                            {nextTask?.title ||
                              (project.reviewPending
                                ? "Review client feedback"
                                : "No next action recorded")}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/40" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <aside>
              <SectionHeading
                eyebrow="Today"
                title="Needs attention"
                count={attention.length}
                href="/admin/tasks"
                action="Open tasks"
              />

              {!loading && attention.length === 0 ? (
                <div className="border border-slate-300 bg-white p-7 dark:border-white/15 dark:bg-[#262626]">
                  <CheckCircle2 className="h-5 w-5 text-[#0f62fe]" />
                  <p className="mt-5 font-semibold dark:text-white">No urgent attention</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    There are no blocked, overdue or submitted review items.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-300 border-y border-slate-300 dark:divide-white/15 dark:border-white/15">
                  {attention.slice(0, 6).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block py-5 transition hover:pl-2"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 ${
                            item.kind === "blocked"
                              ? "bg-red-600"
                              : item.kind === "overdue"
                                ? "bg-amber-500"
                                : "bg-[#0f62fe]"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold dark:text-white">{item.label}</p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {item.context}
                          </p>
                          {item.dueAt && (
                            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDate(item.dueAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </AdminShell>
  )
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
  loading,
  last,
}: {
  label: string
  value: number
  note: string
  icon: typeof FolderKanban
  loading: boolean
  last: boolean
}) {
  return (
    <article className={`min-h-[150px] p-5 ${last ? "" : "border-b border-[#393939] sm:border-r xl:border-b-0"}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
          {label}
        </p>
        <Icon className="h-[18px] w-[18px] text-[#78a9ff]" />
      </div>
      <p className="mt-7 text-3xl font-semibold">{loading ? "—" : value}</p>
      <p className="mt-2 text-sm text-white/40">{loading ? "Loading current data" : note}</p>
    </article>
  )
}

function SectionHeading({
  eyebrow,
  title,
  count,
  href,
  action,
}: {
  eyebrow: string
  title: string
  count: number
  href: string
  action: string
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight dark:text-white">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">{count}</span>
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f62fe]"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  text,
  href,
  action,
}: {
  icon: typeof FolderKanban
  title: string
  text: string
  href: string
  action: string
}) {
  return (
    <div className="flex min-h-[280px] flex-col justify-between border border-[#393939] bg-[#161616] p-7 text-white">
      <div>
        <Icon className="h-6 w-6 text-[#78a9ff]" />
        <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/50">{text}</p>
      </div>
      <Link
        href={href}
        className="mt-8 inline-flex w-fit items-center gap-2 border border-white/25 px-4 py-3 text-sm font-semibold transition hover:border-[#0f62fe] hover:bg-[#0f62fe]"
      >
        {action}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function buildAttentionItems(
  tasks: WorkspaceTask[],
  actions: AdminAction[]
): AttentionItem[] {
  const now = Date.now()
  const taskItems = tasks
    .filter(
      (task) =>
        task.status === "blocked" ||
        (task.dueAt && timestamp(task.dueAt) < now)
    )
    .map((task) => ({
      id: `task:${task.id}`,
      label: task.title,
      context: `${task.clientCompany} · ${task.serviceName || humanize(task.serviceKey)}`,
      href: `/admin/tasks?client=${task.clientId}`,
      dueAt: task.dueAt,
      kind:
        task.status === "blocked"
          ? ("blocked" as const)
          : ("overdue" as const),
    }))

  const reviewItems = actions.map((action) => ({
    id: `review:${action.actionType}:${action.sourceId}`,
    label: action.title,
    context: `${action.clientCompany}${action.serviceName ? ` · ${action.serviceName}` : ""}`,
    href:
      action.actionType === "onboarding_review"
        ? `/admin/onboarding/${action.clientId}`
        : `/clients/${action.clientId}/workspace`,
    dueAt: action.actionAt,
    kind: "review" as const,
  }))

  return [...taskItems, ...reviewItems].sort((first, second) => {
    const kindOrder = { blocked: 0, overdue: 1, review: 2 }
    const kindDifference = kindOrder[first.kind] - kindOrder[second.kind]
    if (kindDifference !== 0) {
      return kindDifference
    }
    return timestamp(first.dueAt) - timestamp(second.dueAt)
  })
}

function nextTaskForProject(projectId: string, tasks: WorkspaceTask[]) {
  return [...tasks]
    .filter((task) => task.projectId === projectId)
    .sort((first, second) => {
      const priorityDifference =
        (priorityOrder[first.priority] ?? 9) -
        (priorityOrder[second.priority] ?? 9)
      if (priorityDifference !== 0) {
        return priorityDifference
      }
      return timestamp(first.dueAt) - timestamp(second.dueAt)
    })[0]
}

function timestamp(value?: string | null) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER
  }
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable"
  }
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
