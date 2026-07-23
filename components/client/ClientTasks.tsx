"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckSquare2,
  Clock3,
  FileSignature,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquarePlus,
  Search,
  Send,
  X,
} from "lucide-react"

type ClientPortal = {
  client: {
    name: string
    company: string
    email: string
  }
  canEdit: boolean
  projects: Array<{
    id: string
    projectKey: string
    name: string
    latestClientFeedback?: string | null
    revisionPendingAt?: string | null
  }>
}

type ClientTask = {
  id: string
  clientId: string
  clientName: string
  clientCompany: string
  serviceKey: string
  serviceName: string | null
  projectId: string | null
  projectName: string | null
  title: string
  description: string | null
  status: string
  priority: string
  ownerRole: "admin" | "client"
  visibility: "client_visible"
  createdByUsername: string | null
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

export default function ClientTasks({ initialService }: { initialService: string }) {
  const router = useRouter()
  const [portal, setPortal] = useState<ClientPortal | null>(null)
  const [tasks, setTasks] = useState<ClientTask[]>([])
  const [serviceFilter, setServiceFilter] = useState(initialService)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const [portalResponse, tasksResponse] = await Promise.all([
        fetch("/api/client/portal", { cache: "no-store" }),
        fetch("/api/client/tasks", { cache: "no-store" }),
      ])

      if (portalResponse.status === 401 || tasksResponse.status === 401) {
        router.replace("/client/login")
        return
      }

      const [portalData, taskData] = await Promise.all([
        portalResponse.json().catch(() => null),
        tasksResponse.json().catch(() => null),
      ])

      if (!portalResponse.ok) {
        throw new Error(portalData?.message || portalData?.error || "Could not load client workspace")
      }
      if (!tasksResponse.ok) {
        throw new Error(taskData?.message || taskData?.error || "Could not load client tasks")
      }
      if (!portalData || !Array.isArray(taskData)) {
        throw new Error("The client workspace returned an unexpected response")
      }

      setPortal(portalData as ClientPortal)
      setTasks(taskData as ClientTask[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load client tasks")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  const serviceOptions = useMemo(() => {
    const options = new Map<string, string>()
    tasks.forEach((task) => {
      options.set(task.serviceKey, task.serviceName || serviceLabel(task.serviceKey))
    })
    return Array.from(options, ([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [tasks])

  const visibleTasks = useMemo(
    () => tasks.filter((task) => {
      const query = search.trim().toLowerCase()
      if (serviceFilter !== "all" && task.serviceKey !== serviceFilter) return false
      if (statusFilter !== "all" && task.status !== statusFilter) return false
      if (dateFilter === "scheduled" && !task.dueAt) return false
      if (dateFilter === "unscheduled" && task.dueAt) return false
      if (dateFilter === "overdue" && (!task.dueAt || new Date(task.dueAt).getTime() >= Date.now())) return false
      if (query && ![
        task.id,
        task.title,
        task.description,
        task.projectName,
      ].some((value) => value?.toLowerCase().includes(query))) return false
      return true
    }),
    [dateFilter, search, serviceFilter, statusFilter, tasks]
  )

  const groups = useMemo(() => {
    const grouped = new Map<string, ClientTask[]>()
    visibleTasks.forEach((task) => {
      const current = grouped.get(task.serviceKey) || []
      current.push(task)
      grouped.set(task.serviceKey, current)
    })
    return Array.from(grouped, ([serviceKey, items]) => ({
      serviceKey,
      label: items[0]?.serviceName || serviceLabel(serviceKey),
      items,
    }))
  }, [visibleTasks])

  const signOut = async () => {
    await fetch("/api/client/auth/logout", { method: "POST" })
    router.push("/client/login")
    router.refresh()
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050810] text-white">
        <div className="flex items-center gap-3 text-sm text-white/55">
          <Loader2 className="h-4 w-4 animate-spin text-[#7eb6ff]" />
          Loading your tasks
        </div>
      </main>
    )
  }

  if (!portal) {
    return (
      <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          {error || "Client tasks unavailable."}
        </div>
      </main>
    )
  }

  const clientActionCount = tasks.filter((task) =>
    task.ownerRole === "client" && !["submitted", "approved", "completed"].includes(task.status)
  ).length
  const altairaActionCount = tasks.filter((task) => task.ownerRole === "admin").length

  return (
    <main className="min-h-screen bg-[#050810] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-[#080d19] px-5 py-6">
          <Link href="/client/dashboard" className="inline-flex items-center gap-3">
            <Image
              src="/brand/favicon.png"
              alt=""
              width={34}
              height={34}
              className="h-9 w-9 object-contain brightness-0 invert"
            />
            <span className="text-sm font-semibold tracking-[0.18em]">ALTAIRA LABS</span>
          </Link>

          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7eb6ff]">Client workspace</p>
            <h1 className="mt-3 text-xl font-semibold">{portal.client.company || portal.client.name}</h1>
            <p className="mt-2 break-all text-sm text-white/40">{portal.client.email}</p>
          </div>

          <nav className="mt-10 grid gap-2" aria-label="Client workspace navigation">
            <ClientNavLink href="/client/dashboard" label="Overview" icon={LayoutDashboard} />
            <ClientNavLink href="/client/tasks" label="Tasks" icon={CheckSquare2} active />
            <ClientNavLink href="/onboarding" label="Onboarding" icon={FileSignature} />
          </nav>

          <div className="mt-8 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-8 md:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-[1280px]">
            <Link
              href="/client/dashboard"
              className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Workspace overview
            </Link>

            <header className="mt-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b5cf6]">Workspace activity</p>
                <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Tasks</h2>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  Read-only delivery tasks for your active service tracks.
                </p>
              </div>
              {portal.canEdit && portal.projects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSuggestionOpen(true)}
                  className="inline-flex h-11 w-fit items-center gap-2 border border-[#3b82f6] bg-[#3b82f6] px-4 text-sm font-semibold hover:bg-[#2563eb]"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  Suggest a task
                </button>
              )}
            </header>

            <div className="mt-8 grid border border-white/10 sm:grid-cols-3">
              <Metric label="Total tasks" value={tasks.length} />
              <Metric label="Waiting on you" value={clientActionCount} />
              <Metric label="Waiting on Altaira" value={altairaActionCount} />
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-3 border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {notice && (
              <div className="mt-5 border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                {notice}
              </div>
            )}

            <div className="mt-6 grid gap-2 border border-white/10 bg-[#080d19] p-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.3fr)_repeat(3,minmax(160px,0.7fr))]">
              <label className="relative">
                <span className="sr-only">Search tasks</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search task name or ID"
                  className="h-11 w-full border border-white/10 bg-[#111528] pl-10 pr-3 text-sm text-white/70 outline-none placeholder:text-white/25 focus:border-[#3b82f6]"
                />
              </label>
              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="h-11 border border-white/10 bg-[#111528] px-3 text-sm text-white/70 outline-none focus:border-[#3b82f6]"
                aria-label="Filter tasks by service"
              >
                <option value="all">All services</option>
                {serviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 border border-white/10 bg-[#111528] px-3 text-sm text-white/70 outline-none focus:border-[#3b82f6]"
                aria-label="Filter tasks by status"
              >
                <option value="all">All statuses</option>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="submitted">Submitted</option>
                <option value="needs_review">Needs review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Changes requested</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-11 border border-white/10 bg-[#111528] px-3 text-sm text-white/70 outline-none focus:border-[#3b82f6]"
                aria-label="Filter tasks by deadline"
              >
                <option value="all">All deadlines</option>
                <option value="scheduled">Scheduled</option>
                <option value="unscheduled">No deadline</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {tasks.length === 0 && <EmptyState />}
            {tasks.length > 0 && visibleTasks.length === 0 && (
              <div className="mt-6 border border-white/10 bg-[#080d19] px-6 py-16 text-center">
                <h3 className="text-xl font-semibold">No matching tasks</h3>
                <p className="mt-2 text-sm text-white/45">Choose another service or status.</p>
              </div>
            )}
            {groups.map((group) => (
              <section key={group.serviceKey} className="mt-8">
                <div className="mb-3 flex items-end justify-between border-b border-white/10 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7eb6ff]">
                      Service track
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{group.label}</h3>
                  </div>
                  <span className="text-xs text-white/35">{group.items.length}</span>
                </div>
                <div className="border border-white/10 bg-[#080d19]">
                  {group.items.map((task) => (
                    <ClientTaskRow key={task.id} task={task} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>

      {suggestionOpen && (
        <TaskSuggestionPanel
          projects={portal.projects}
          serviceFilter={serviceFilter}
          close={() => setSuggestionOpen(false)}
          submitted={(project) => {
            setPortal((current) => current ? {
              ...current,
              projects: current.projects.map((item) => item.id === project.id ? project : item),
            } : current)
            setSuggestionOpen(false)
            setNotice("Suggestion sent to Altaira for review. It has not been added as a task yet.")
          }}
        />
      )}
    </main>
  )
}

function ClientNavLink({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string
  label: string
  icon: typeof LayoutDashboard
  active?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 items-center gap-3 border-l-2 px-3 text-sm font-medium transition ${
        active
          ? "border-[#3b82f6] bg-white/[0.06] text-white"
          : "border-transparent text-white/45 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-white/10 px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-6 flex min-h-[300px] flex-col justify-between border border-white/10 bg-[#080d19] p-7 md:p-9">
      <div>
        <div className="grid h-11 w-11 place-items-center border border-white/15">
          <CheckSquare2 className="h-5 w-5 text-[#7eb6ff]" />
        </div>
        <h3 className="mt-7 text-2xl font-semibold">No tasks assigned</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
          Your workspace is ready. Tasks will appear here when Altaira assigns real work to one of
          your contracted service tracks.
        </p>
      </div>
      <Link
        href="/client/dashboard"
        className="mt-10 inline-flex w-fit items-center gap-2 border border-white/20 px-4 py-3 text-sm font-semibold transition hover:border-[#3b82f6] hover:bg-[#3b82f6]"
      >
        Open overview
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function ClientTaskRow({ task }: { task: ClientTask }) {
  return (
    <article className="grid gap-5 border-b border-white/10 p-5 last:border-b-0 lg:grid-cols-[110px_minmax(0,1.5fr)_0.8fr_0.75fr] lg:items-center">
      <p className="font-mono text-xs text-white/35" title={task.id}>
        {shortId(task.id)}
      </p>
      <div className="min-w-0">
        <p className="font-semibold">{task.title}</p>
        {task.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">{task.description}</p>
        )}
      </div>
      <div>
        <p className="text-sm text-white/70">{task.projectName || serviceLabel(task.serviceKey)}</p>
        <p className="mt-1 text-xs text-white/35">
          {task.ownerRole === "client" ? "Client responsible" : "Altaira responsible"}
        </p>
      </div>
      <div>
        <p className="text-sm text-white/70">{statusLabel(task.status)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
          <Clock3 className="h-3.5 w-3.5" />
          {task.dueAt ? formatDate(task.dueAt) : "No deadline"}
        </p>
      </div>
    </article>
  )
}

function TaskSuggestionPanel({
  projects,
  serviceFilter,
  close,
  submitted,
}: {
  projects: ClientPortal["projects"]
  serviceFilter: string
  close: () => void
  submitted: (project: ClientPortal["projects"][number]) => void
}) {
  const matchingProjects = serviceFilter === "all"
    ? projects
    : projects.filter((project) => project.projectKey === serviceFilter)
  const availableProjects = matchingProjects.length > 0 ? matchingProjects : projects
  const [projectId, setProjectId] = useState(availableProjects[0]?.id || "")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const submitSuggestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!projectId || !message.trim()) return

    try {
      setSubmitting(true)
      setError("")
      const response = await fetch(`/api/client/portal/projects/${projectId}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: `TASK SUGGESTION\n${message.trim()}`,
        }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected suggestion response" }))
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not send suggestion")
      }
      submitted(data)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send suggestion")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-[#050810]/75">
      <button type="button" onClick={close} aria-label="Close suggestion panel" className="absolute inset-0" />
      <aside className="relative z-10 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#080d19] p-6 md:p-8">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7eb6ff]">Client request</p>
            <h2 className="mt-2 text-2xl font-semibold">Suggest a task</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid h-10 w-10 place-items-center border border-white/15 text-white/55 hover:text-white"
            aria-label="Close suggestion panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-6 text-sm leading-6 text-white/50">
          Your suggestion enters Altaira&apos;s review queue. It does not create, edit or delete a project task.
        </p>

        <form onSubmit={submitSuggestion} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
              Service track
            </span>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              required
              className="h-11 w-full border border-white/15 bg-[#111528] px-3 text-sm text-white outline-none focus:border-[#3b82f6]"
            >
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {serviceLabel(project.projectKey)} · {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
              Suggestion
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              maxLength={1800}
              rows={7}
              placeholder="Describe the task or change you would like Altaira to review."
              className="min-h-40 w-full border border-white/15 bg-[#111528] px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#3b82f6]"
            />
          </label>

          {error && (
            <div className="border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !projectId || !message.trim()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#3b82f6] px-4 text-sm font-semibold hover:bg-[#2563eb] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send suggestion
          </button>
        </form>
      </aside>
    </div>
  )
}

function serviceLabel(serviceKey: string) {
  if (!serviceKey || serviceKey === "general") return "General workspace"
  return serviceKey.replaceAll("_", " ")
}

function statusLabel(status: string) {
  if (status === "rejected") return "Changes requested"
  return status.replaceAll("_", " ")
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function shortId(value: string) {
  return value.length > 8 ? value.slice(0, 8).toUpperCase() : value.toUpperCase()
}
