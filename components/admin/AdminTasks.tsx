"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  CalendarRange,
  CheckSquare2,
  Edit3,
  List,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"

type ReviewActionType = "onboarding_review" | "resource_review" | "feedback_review"
type WorkType = ReviewActionType | "workspace_task"
type GroupMode = "none" | "client" | "service"
type ViewMode = "table" | "timeline"

type AdminAction = {
  sourceId: string
  actionType: ReviewActionType
  title: string
  clientId: string
  clientName: string
  clientCompany: string
  projectId: string | null
  projectName: string | null
  serviceKey: string | null
  serviceName: string | null
  critical: boolean
  actionAt: string | null
}

type WorkspaceTask = {
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
  visibility: "admin_only" | "client_visible"
  createdByUsername: string | null
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

type AdminProject = {
  id: string
  clientId: string
  clientName: string
  clientCompany: string
  clientServiceId: string | null
  serviceName: string | null
  projectKey: string
  name: string
}

type WorkItem = {
  id: string
  sourceId: string
  type: WorkType
  title: string
  description: string | null
  clientId: string
  clientName: string
  clientCompany: string
  projectName: string | null
  serviceKey: string
  serviceName: string | null
  status: string
  priority: string
  ownerRole: "admin" | "client"
  visibility: "admin_only" | "client_visible"
  createdByUsername: string | null
  dueAt: string | null
  receivedAt: string | null
  href: string
  task: WorkspaceTask | null
}

const typeOptions: Array<{ value: "all" | WorkType; label: string }> = [
  { value: "workspace_task", label: "Project tasks" },
  { value: "all", label: "All work" },
  { value: "onboarding_review", label: "Onboarding reviews" },
  { value: "feedback_review", label: "Client feedback" },
  { value: "resource_review", label: "Resource reviews" },
]

const statusOptions = [
  "not_started",
  "in_progress",
  "submitted",
  "needs_review",
  "approved",
  "rejected",
  "blocked",
  "completed",
]

export function AdminTasks() {
  const router = useRouter()
  const [items, setItems] = useState<WorkItem[]>([])
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [search, setSearch] = useState("")
  const [clientFilter, setClientFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [creatorFilter, setCreatorFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]["value"]>("workspace_task")
  const [groupBy, setGroupBy] = useState<GroupMode>("none")
  const [dueFrom, setDueFrom] = useState("")
  const [dueTo, setDueTo] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [panelTask, setPanelTask] = useState<WorkspaceTask | "create" | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const [actionsResponse, tasksResponse, projectsResponse] = await Promise.all([
        fetch("/api/internal/admin-actions", { cache: "no-store" }),
        fetch("/api/internal/workspace-tasks", { cache: "no-store" }),
        fetch("/api/internal/client-projects", { cache: "no-store" }),
      ])

      if (
        actionsResponse.status === 401 ||
        tasksResponse.status === 401 ||
        projectsResponse.status === 401
      ) {
        router.replace("/admin/login")
        return
      }

      const [actionsData, tasksData, projectsData] = await Promise.all([
        actionsResponse.json().catch(() => ({ error: "Unexpected review queue response" })),
        tasksResponse.json().catch(() => ({ error: "Unexpected workspace task response" })),
        projectsResponse.json().catch(() => ({ error: "Unexpected project response" })),
      ])

      if (!actionsResponse.ok) {
        throw new Error(actionsData?.message || actionsData?.error || "Could not load review work")
      }
      if (!tasksResponse.ok) {
        throw new Error(tasksData?.message || tasksData?.error || "Could not load workspace tasks")
      }
      if (!projectsResponse.ok) {
        throw new Error(projectsData?.message || projectsData?.error || "Could not load projects")
      }
      if (!Array.isArray(actionsData) || !Array.isArray(tasksData) || !Array.isArray(projectsData)) {
        throw new Error("Task services returned an unexpected response")
      }

      const reviewItems = (actionsData as AdminAction[]).map(mapReviewAction)
      const workspaceItems = (tasksData as WorkspaceTask[]).map(mapWorkspaceTask)
      setItems([...workspaceItems, ...reviewItems].sort(compareWorkItems))
      setProjects(projectsData as AdminProject[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tasks")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    const clientId = new URLSearchParams(window.location.search).get("client")
    if (clientId) setClientFilter(clientId)
  }, [])

  const clients = useMemo(
    () => uniqueOptions(items.map((item) => ({ value: item.clientId, label: item.clientCompany }))),
    [items]
  )
  const services = useMemo(
    () => uniqueOptions(items.map((item) => ({
      value: item.serviceKey,
      label: item.serviceName || serviceLabel(item.serviceKey),
    }))),
    [items]
  )
  const creators = useMemo(
    () => uniqueOptions(items.map((item) => ({
      value: creatorKey(item),
      label: creatorLabel(item),
    }))),
    [items]
  )

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const start = dueFrom ? new Date(`${dueFrom}T00:00:00`).getTime() : null
    const end = dueTo ? new Date(`${dueTo}T23:59:59`).getTime() : null

    return items.filter((item) => {
      if (clientFilter !== "all" && item.clientId !== clientFilter) return false
      if (serviceFilter !== "all" && item.serviceKey !== serviceFilter) return false
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (creatorFilter !== "all" && creatorKey(item) !== creatorFilter) return false
      if (typeFilter !== "all" && item.type !== typeFilter) return false
      if (start !== null && (!item.dueAt || new Date(item.dueAt).getTime() < start)) return false
      if (end !== null && (!item.dueAt || new Date(item.dueAt).getTime() > end)) return false
      if (!query) return true

      return [
        item.sourceId,
        item.title,
        item.description,
        item.clientName,
        item.clientCompany,
        item.projectName,
        item.serviceName,
        item.serviceKey,
        item.createdByUsername,
      ].some((value) => value?.toLowerCase().includes(query))
    })
  }, [
    clientFilter,
    creatorFilter,
    dueFrom,
    dueTo,
    items,
    search,
    serviceFilter,
    statusFilter,
    typeFilter,
  ])

  const groups = useMemo(() => groupItems(visibleItems, groupBy), [groupBy, visibleItems])
  const activeFilterCount = [
    clientFilter,
    serviceFilter,
    statusFilter,
    creatorFilter,
  ].filter((value) => value !== "all").length + (dueFrom ? 1 : 0) + (dueTo ? 1 : 0)

  const resetFilters = () => {
    setSearch("")
    setClientFilter("all")
    setServiceFilter("all")
    setStatusFilter("all")
    setCreatorFilter("all")
    setDueFrom("")
    setDueTo("")
    setGroupBy("none")
  }

  return (
    <AdminShell>
      <main className="px-4 py-10 md:px-8 md:py-12 xl:px-12">
        <div className="mx-auto max-w-[1540px]">
          <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3b82f6]">
                Workspace
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[#090b16] md:text-4xl dark:text-white">
                Tasks
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Search, assign and schedule real work across every client service.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPanelTask("create")}
              disabled={projects.length === 0}
              title={projects.length === 0 ? "Create a client project before adding tasks" : "Create task"}
              className="inline-flex h-11 w-fit items-center gap-2 border border-[#3b82f6] bg-[#3b82f6] px-4 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 dark:disabled:border-white/10 dark:disabled:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              New task
            </button>
          </header>

          <section className="mt-9 border border-slate-200 bg-white dark:border-white/10 dark:bg-[#090b16]">
            <div className="flex flex-col gap-5 border-b border-slate-200 p-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <ViewButton
                  active={viewMode === "table"}
                  label="Table"
                  icon={List}
                  onClick={() => setViewMode("table")}
                />
                <ViewButton
                  active={viewMode === "timeline"}
                  label="Timeline"
                  icon={CalendarRange}
                  onClick={() => setViewMode("timeline")}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{loading ? "Loading" : `${visibleItems.length} shown`}</span>
                <button
                  type="button"
                  onClick={() => void loadItems()}
                  className="inline-flex h-9 items-center gap-2 border border-slate-200 px-3 font-medium text-slate-600 hover:border-[#3b82f6] hover:text-[#3b82f6] dark:border-white/10 dark:text-white/55"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            <TaskFilters
              search={search}
              setSearch={setSearch}
              clientFilter={clientFilter}
              setClientFilter={setClientFilter}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              creatorFilter={creatorFilter}
              setCreatorFilter={setCreatorFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              dueFrom={dueFrom}
              setDueFrom={setDueFrom}
              dueTo={dueTo}
              setDueTo={setDueTo}
              clients={clients}
              services={services}
              creators={creators}
              activeFilterCount={activeFilterCount}
              resetFilters={resetFilters}
            />

            {loading && <LoadingState />}
            {!loading && error && <ErrorState error={error} retry={loadItems} />}
            {!loading && !error && viewMode === "table" && (
              <div className="space-y-6">
                {groups.map((group) => (
                  <section key={group.key}>
                    {groupBy !== "none" && (
                      <div className="flex items-center justify-between border-y border-slate-200 bg-slate-50 px-5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                        <h2 className="text-sm font-semibold">{group.label}</h2>
                        <span className="text-xs text-slate-400">{group.items.length}</span>
                      </div>
                    )}
                    <TaskTable
                      items={group.items}
                      hasAnyItems={items.length > 0}
                      editTask={setPanelTask}
                      resetFilters={resetFilters}
                    />
                  </section>
                ))}
              </div>
            )}
            {!loading && !error && viewMode === "timeline" && (
              <TaskTimeline items={visibleItems.filter((item) => item.type === "workspace_task")} />
            )}
          </section>

          {!loading && !error && projects.length === 0 && (
            <div className="mt-5 flex flex-col justify-between gap-4 border border-[#20263a] bg-[#090b16] p-5 text-white md:flex-row md:items-center">
              <div>
                <p className="font-semibold">No project workspace exists yet</p>
                <p className="mt-1 text-sm text-white/45">
                  The task table is ready. A real client project is required before the first task can be created.
                </p>
              </div>
              <Link
                href="/admin/projects"
                className="inline-flex h-10 shrink-0 items-center gap-2 border border-white/20 px-4 text-sm font-semibold hover:border-[#3b82f6] hover:bg-[#3b82f6]"
              >
                Open projects
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </main>

      {panelTask && (
        <TaskPanel
          projects={projects}
          task={panelTask === "create" ? null : panelTask}
          close={() => setPanelTask(null)}
          saved={async () => {
            setPanelTask(null)
            await loadItems()
          }}
        />
      )}
    </AdminShell>
  )
}

type TaskFiltersProps = {
  search: string
  setSearch: (value: string) => void
  clientFilter: string
  setClientFilter: (value: string) => void
  serviceFilter: string
  setServiceFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  creatorFilter: string
  setCreatorFilter: (value: string) => void
  typeFilter: (typeof typeOptions)[number]["value"]
  setTypeFilter: (value: (typeof typeOptions)[number]["value"]) => void
  groupBy: GroupMode
  setGroupBy: (value: GroupMode) => void
  dueFrom: string
  setDueFrom: (value: string) => void
  dueTo: string
  setDueTo: (value: string) => void
  clients: Array<{ value: string; label: string }>
  services: Array<{ value: string; label: string }>
  creators: Array<{ value: string; label: string }>
  activeFilterCount: number
  resetFilters: () => void
}

function TaskFilters(props: TaskFiltersProps) {
  return (
    <div className="border-b border-slate-200 p-4 dark:border-white/10">
      <div className="grid gap-2 xl:grid-cols-[minmax(280px,1.4fr)_repeat(5,minmax(145px,0.7fr))]">
        <label className="relative">
          <span className="sr-only">Search tasks</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={props.search}
            onChange={(event) => props.setSearch(event.target.value)}
            placeholder="Search ID, task, client or service"
            className={lightControlClass("pl-10 pr-3")}
          />
        </label>
        <FilterSelect
          label="Client"
          value={props.clientFilter}
          onChange={props.setClientFilter}
          options={[{ value: "all", label: "All clients" }, ...props.clients]}
        />
        <FilterSelect
          label="Service"
          value={props.serviceFilter}
          onChange={props.setServiceFilter}
          options={[{ value: "all", label: "All services" }, ...props.services]}
        />
        <FilterSelect
          label="Status"
          value={props.statusFilter}
          onChange={props.setStatusFilter}
          options={[
            { value: "all", label: "All statuses" },
            ...statusOptions.map((value) => ({ value, label: statusLabel(value) })),
          ]}
        />
        <FilterSelect
          label="Created by"
          value={props.creatorFilter}
          onChange={props.setCreatorFilter}
          options={[{ value: "all", label: "All creators" }, ...props.creators]}
        />
        <FilterSelect
          label="Work type"
          value={props.typeFilter}
          onChange={(value) => props.setTypeFilter(value as TaskFiltersProps["typeFilter"])}
          options={typeOptions}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[210px_210px_190px_auto]">
        <DateFilter label="Due from" value={props.dueFrom} setValue={props.setDueFrom} />
        <DateFilter label="Due to" value={props.dueTo} setValue={props.setDueTo} />
        <FilterSelect
          label="Group"
          value={props.groupBy}
          onChange={(value) => props.setGroupBy(value as GroupMode)}
          options={[
            { value: "none", label: "No grouping" },
            { value: "client", label: "Group by client" },
            { value: "service", label: "Group by service" },
          ]}
        />
        <button
          type="button"
          onClick={props.resetFilters}
          disabled={props.activeFilterCount === 0 && !props.search}
          className="h-11 w-fit px-3 text-sm font-medium text-slate-500 hover:text-[#3b82f6] disabled:cursor-default disabled:opacity-35"
        >
          Clear filters{props.activeFilterCount > 0 ? ` (${props.activeFilterCount})` : ""}
        </button>
      </div>
    </div>
  )
}

function TaskTable({
  items,
  hasAnyItems,
  editTask,
  resetFilters,
}: {
  items: WorkItem[]
  hasAnyItems: boolean
  editTask: (task: WorkspaceTask) => void
  resetFilters: () => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left">
        <thead className="bg-[#090b16] text-white">
          <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
            <th className="w-[132px] px-5 py-4">Task ID</th>
            <th className="min-w-[260px] px-5 py-4">Task</th>
            <th className="w-[145px] px-5 py-4">Deadline</th>
            <th className="w-[190px] px-5 py-4">Client owner</th>
            <th className="w-[170px] px-5 py-4">Responsible</th>
            <th className="w-[180px] px-5 py-4">Service</th>
            <th className="w-[135px] px-5 py-4">Status</th>
            <th className="w-[68px] px-5 py-4"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-6 py-16 text-center">
                <CheckSquare2 className="mx-auto h-6 w-6 text-[#3b82f6]" />
                <p className="mt-5 text-lg font-semibold text-[#090b16] dark:text-white">
                  {hasAnyItems ? "No work matches these filters" : "No tasks yet"}
                </p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  {hasAnyItems
                    ? "Change or clear the filters to return to the complete task table."
                    : "The table is ready and will remain empty until a real project task is created."}
                </p>
                {hasAnyItems && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-5 text-sm font-semibold text-[#3b82f6] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id} className="group text-sm transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
              <td className="px-5 py-5 align-top font-mono text-xs text-slate-500" title={item.sourceId}>
                {shortId(item.sourceId)}
              </td>
              <td className="px-5 py-5 align-top">
                <p className="font-semibold text-[#090b16] dark:text-white">{item.title}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                  {item.projectName || workTypeLabel(item.type)}
                </p>
              </td>
              <td className="px-5 py-5 align-top text-slate-600 dark:text-white/65">
                {item.dueAt ? formatDate(item.dueAt) : "Not scheduled"}
              </td>
              <td className="px-5 py-5 align-top">
                <p className="font-medium text-[#090b16] dark:text-white/85">{item.clientName}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.clientCompany}</p>
              </td>
              <td className="px-5 py-5 align-top text-slate-600 dark:text-white/65">
                {responsibleLabel(item)}
              </td>
              <td className="px-5 py-5 align-top text-slate-600 dark:text-white/65">
                {item.serviceName || serviceLabel(item.serviceKey)}
              </td>
              <td className="px-5 py-5 align-top">
                <StatusText status={item.status} priority={item.priority} />
              </td>
              <td className="px-5 py-5 align-top">
                {item.task ? (
                  <button
                    type="button"
                    onClick={() => editTask(item.task as WorkspaceTask)}
                    aria-label={`Edit ${item.title}`}
                    title="Edit task"
                    className="grid h-9 w-9 place-items-center border border-slate-200 text-slate-500 transition hover:border-[#3b82f6] hover:text-[#3b82f6] dark:border-white/10 dark:text-white/45"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    aria-label={`Open ${item.title}`}
                    className="grid h-9 w-9 place-items-center border border-slate-200 text-slate-500 transition hover:border-[#3b82f6] hover:text-[#3b82f6] dark:border-white/10 dark:text-white/45"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TaskTimeline({ items }: { items: WorkItem[] }) {
  const scheduled = items.filter((item) => item.dueAt && item.receivedAt)

  if (scheduled.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <CalendarRange className="mx-auto h-6 w-6 text-[#3b82f6]" />
        <h2 className="mt-5 text-lg font-semibold">No scheduled task timeline</h2>
        <p className="mt-2 text-sm text-slate-500">
          Timeline bars use real task creation and deadline dates. No dates are invented.
        </p>
      </div>
    )
  }

  const starts = scheduled.map((item) => new Date(item.receivedAt as string).getTime())
  const ends = scheduled.map((item) => new Date(item.dueAt as string).getTime())
  const min = Math.min(...starts)
  const max = Math.max(...ends, min + 86_400_000)
  const range = Math.max(max - min, 86_400_000)
  const ticks = Array.from({ length: 5 }, (_, index) => min + (range * index) / 4)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[300px_1fr] border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Task
          </div>
          <div className="grid grid-cols-5 border-l border-slate-200 px-3 py-4 text-xs text-slate-400 dark:border-white/10">
            {ticks.map((tick) => <span key={tick}>{formatShortDate(new Date(tick))}</span>)}
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-white/10">
          {scheduled.map((item) => {
            const start = new Date(item.receivedAt as string).getTime()
            const end = Math.max(new Date(item.dueAt as string).getTime(), start + 86_400_000)
            const left = ((start - min) / range) * 100
            const width = Math.max(((end - start) / range) * 100, 1.5)

            return (
              <div key={item.id} className="grid grid-cols-[300px_1fr]">
                <div className="min-w-0 px-5 py-4">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {item.clientCompany} · {item.serviceName || serviceLabel(item.serviceKey)}
                  </p>
                </div>
                <div className="relative border-l border-slate-200 px-3 py-4 dark:border-white/10">
                  <div className="absolute inset-y-0 left-1/4 border-l border-slate-100 dark:border-white/5" />
                  <div className="absolute inset-y-0 left-1/2 border-l border-slate-100 dark:border-white/5" />
                  <div className="absolute inset-y-0 left-3/4 border-l border-slate-100 dark:border-white/5" />
                  <div className="relative h-8">
                    <div
                      className="absolute top-1/2 h-2 -translate-y-1/2 bg-[#3b82f6]"
                      style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                      title={`${formatDate(item.receivedAt as string)} to ${formatDate(item.dueAt as string)}`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400 dark:border-white/10">
          Current MVP timeline: task creation date to deadline. A dedicated planned-start field can be added later without changing this view.
        </p>
      </div>
    </div>
  )
}

function TaskPanel({
  projects,
  task,
  close,
  saved,
}: {
  projects: AdminProject[]
  task: WorkspaceTask | null
  close: () => void
  saved: () => Promise<void>
}) {
  const [projectId, setProjectId] = useState(task?.projectId || projects[0]?.id || "")
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [status, setStatus] = useState(task?.status || "not_started")
  const [ownerRole, setOwnerRole] = useState<"admin" | "client">(task?.ownerRole || "admin")
  const [visibility, setVisibility] = useState<"admin_only" | "client_visible">(
    task?.visibility || "admin_only"
  )
  const [priority, setPriority] = useState(task?.priority || "normal")
  const [dueDate, setDueDate] = useState(dateInputValue(task?.dueAt))
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState("")

  const selectedProject = projects.find((project) => project.id === projectId)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!task && !selectedProject) return

    try {
      setSubmitting(true)
      setError("")
      const response = await fetch(
        task ? `/api/internal/workspace-tasks/${task.id}` : "/api/internal/workspace-tasks",
        {
          method: task ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task ? {
            title,
            description: description || null,
            status,
            priority,
            ownerRole,
            visibility,
            dueAt: dueDate ? new Date(`${dueDate}T17:00:00`).toISOString() : null,
            clearDueAt: !dueDate,
          } : {
            clientId: selectedProject?.clientId,
            clientServiceId: selectedProject?.clientServiceId,
            projectId: selectedProject?.id,
            title,
            description: description || null,
            status,
            priority,
            ownerRole,
            visibility,
            dueAt: dueDate ? new Date(`${dueDate}T17:00:00`).toISOString() : null,
          }),
        }
      )
      const data = await response.json().catch(() => ({ error: "Unexpected task response" }))
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not save task")
      }
      await saved()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save task")
    } finally {
      setSubmitting(false)
    }
  }

  const deleteTask = async () => {
    if (!task) return
    try {
      setDeleting(true)
      setError("")
      const response = await fetch(`/api/internal/workspace-tasks/${task.id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unexpected delete response" }))
        throw new Error(data?.message || data?.error || "Could not delete task")
      }
      await saved()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete task")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-[#090b16]/70">
      <button type="button" onClick={close} aria-label="Close task panel" className="absolute inset-0" />
      <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-[#20263a] bg-[#090b16] p-6 text-white md:p-8">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7eb6ff]">
              {task ? `Task ${shortId(task.id)}` : "Workspace task"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{task ? "Edit task" : "New task"}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid h-10 w-10 place-items-center border border-white/15 text-white/60 hover:text-white"
            aria-label="Close task panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <FormField label="Client and service project">
            {task ? (
              <div className="border border-white/10 bg-[#111528] px-3 py-3 text-sm text-white/70">
                {task.clientCompany} · {task.serviceName || serviceLabel(task.serviceKey)}
              </div>
            ) : (
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
                className={darkControlClass}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.clientCompany} · {project.serviceName || serviceLabel(project.projectKey)}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Task name">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={240}
              placeholder="One clear action"
              className={darkControlClass}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="Context, expected result and relevant details"
              className={`${darkControlClass} min-h-32 py-3`}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Responsible">
              <select
                value={ownerRole}
                onChange={(event) => {
                  const nextOwner = event.target.value as "admin" | "client"
                  setOwnerRole(nextOwner)
                  setVisibility(nextOwner === "client" ? "client_visible" : visibility)
                }}
                className={darkControlClass}
              >
                <option value="admin">Altaira Admin</option>
                <option value="client">Client owner</option>
              </select>
            </FormField>
            <FormField label="Client visibility">
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as typeof visibility)}
                className={darkControlClass}
              >
                <option value="admin_only">Internal only</option>
                <option value="client_visible">Visible to client</option>
              </select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Priority">
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className={darkControlClass}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={darkControlClass}>
                {statusOptions.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Deadline">
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={darkControlClass}
            />
          </FormField>

          {task && (
            <div className="grid gap-3 border-y border-white/10 py-4 text-xs text-white/40 sm:grid-cols-2">
              <p>Created by: {task.createdByUsername || "Altaira system"}</p>
              <p>Created: {formatDate(task.createdAt)}</p>
            </div>
          )}

          {error && <div className="border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

          <button
            type="submit"
            disabled={submitting || (!task && !selectedProject) || !title.trim()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#3b82f6] px-4 text-sm font-semibold hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
            {task ? "Save task" : "Create task"}
          </button>

          {task && (
            <div className="border-t border-white/10 pt-5">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete task
                </button>
              ) : (
                <div className="border border-red-500/25 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-100">Delete this task permanently?</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void deleteTask()}
                      disabled={deleting}
                      className="h-10 bg-red-600 px-4 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
                    >
                      {deleting ? "Deleting" : "Confirm delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-10 border border-white/15 px-4 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </aside>
    </div>
  )
}

function ViewButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: typeof List
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 items-center gap-2 border px-3 text-sm font-semibold ${
        active
          ? "border-[#3b82f6] bg-[#3b82f6] text-white"
          : "border-slate-200 text-slate-600 hover:border-[#3b82f6] dark:border-white/10 dark:text-white/55"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={lightControlClass("px-3")}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function DateFilter({
  label,
  value,
  setValue,
}: {
  label: string
  value: string
  setValue: (value: string) => void
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-white/45">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={label}
        className="h-11 w-full min-w-0 border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none [color-scheme:light] focus:border-[#3b82f6] dark:border-white/15 dark:bg-[#262626] dark:text-white dark:[color-scheme:dark]"
      />
    </label>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/45">{label}</span>
      {children}
    </label>
  )
}

function StatusText({ status, priority }: { status: string; priority: string }) {
  const attention = status === "blocked" || status === "rejected" || priority === "urgent"
  return (
    <div>
      <p className={`font-medium ${attention ? "text-[#8a3ffc] dark:text-[#be95ff]" : "text-slate-700 dark:text-white/70"}`}>
        {statusLabel(status)}
      </p>
      {priority !== "normal" && (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{priority}</p>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
      <RefreshCw className="mr-3 h-4 w-4 animate-spin text-[#3b82f6]" />
      Loading tasks
    </div>
  )
}

function ErrorState({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-6 w-6 text-[#3b82f6]" />
      <h2 className="mt-5 text-xl font-semibold">Tasks unavailable</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-500">{error}</p>
      <button type="button" onClick={retry} className="mt-6 h-10 border border-slate-300 px-4 text-sm font-semibold hover:border-[#3b82f6]">
        Try again
      </button>
    </div>
  )
}

function mapReviewAction(action: AdminAction): WorkItem {
  return {
    id: `review:${action.actionType}:${action.sourceId}`,
    sourceId: action.sourceId,
    type: action.actionType,
    title: action.title,
    description: null,
    clientId: action.clientId,
    clientName: action.clientName,
    clientCompany: action.clientCompany,
    projectName: action.projectName,
    serviceKey: action.serviceKey || "general",
    serviceName: action.serviceName,
    status: "needs_review",
    priority: action.critical ? "urgent" : "normal",
    ownerRole: "admin",
    visibility: "admin_only",
    createdByUsername: "Client submission",
    dueAt: null,
    receivedAt: action.actionAt,
    href: action.actionType === "onboarding_review"
      ? `/admin/onboarding/${action.clientId}`
      : `/clients/${action.clientId}/workspace`,
    task: null,
  }
}

function mapWorkspaceTask(task: WorkspaceTask): WorkItem {
  return {
    id: `task:${task.id}`,
    sourceId: task.id,
    type: "workspace_task",
    title: task.title,
    description: task.description,
    clientId: task.clientId,
    clientName: task.clientName,
    clientCompany: task.clientCompany,
    projectName: task.projectName,
    serviceKey: task.serviceKey || "general",
    serviceName: task.serviceName,
    status: task.status,
    priority: task.priority,
    ownerRole: task.ownerRole,
    visibility: task.visibility,
    createdByUsername: task.createdByUsername,
    dueAt: task.dueAt,
    receivedAt: task.createdAt,
    href: `/clients/${task.clientId}/workspace`,
    task,
  }
}

function compareWorkItems(left: WorkItem, right: WorkItem) {
  const leftTime = left.dueAt ? new Date(left.dueAt).getTime() : Number.POSITIVE_INFINITY
  const rightTime = right.dueAt ? new Date(right.dueAt).getTime() : Number.POSITIVE_INFINITY
  if (leftTime !== rightTime) return leftTime - rightTime
  return (right.receivedAt || "").localeCompare(left.receivedAt || "")
}

function groupItems(items: WorkItem[], mode: GroupMode) {
  if (mode === "none") return [{ key: "all", label: "All work", items }]
  const grouped = new Map<string, { label: string; items: WorkItem[] }>()
  items.forEach((item) => {
    const key = mode === "client" ? item.clientId : item.serviceKey
    const label = mode === "client" ? item.clientCompany : item.serviceName || serviceLabel(item.serviceKey)
    const current = grouped.get(key) || { label, items: [] }
    current.items.push(item)
    grouped.set(key, current)
  })
  return Array.from(grouped.entries())
    .map(([key, group]) => ({ key, ...group }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

function uniqueOptions(options: Array<{ value: string; label: string }>) {
  const unique = new Map<string, string>()
  options.forEach((option) => unique.set(option.value, option.label))
  return Array.from(unique, ([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

function creatorKey(item: WorkItem) {
  return item.createdByUsername || (item.type === "workspace_task" ? "altaira-system" : "client-submission")
}

function creatorLabel(item: WorkItem) {
  if (item.createdByUsername) return item.createdByUsername
  return item.type === "workspace_task" ? "Altaira system" : "Client submission"
}

function responsibleLabel(item: WorkItem) {
  return item.ownerRole === "client" ? item.clientName : "Altaira Admin"
}

function workTypeLabel(type: WorkType) {
  if (type === "workspace_task") return "Project task"
  if (type === "onboarding_review") return "Onboarding review"
  if (type === "resource_review") return "Resource review"
  return "Client feedback"
}

function serviceLabel(serviceKey: string) {
  if (!serviceKey || serviceKey === "general") return "General workspace"
  return serviceKey.replaceAll("_", " ")
}

function statusLabel(status: string) {
  if (status === "rejected") return "Changes requested"
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function shortId(value: string) {
  return value.length > 12 ? value.slice(0, 8).toUpperCase() : value.toUpperCase()
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unavailable"
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(date)
}

function dateInputValue(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function lightControlClass(extra: string) {
  return `h-11 w-full border border-slate-200 bg-white text-sm text-slate-600 outline-none transition focus:border-[#3b82f6] dark:border-white/10 dark:bg-[#111528] dark:text-white/70 ${extra}`
}

const darkControlClass =
  "h-11 w-full border border-white/15 bg-[#111528] px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#3b82f6]"
