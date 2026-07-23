"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  RefreshCw,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { cn } from "@/lib/utils"

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
  dueAt: string | null
  createdAt: string
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function AdminCalendar() {
  const router = useRouter()
  const [tasks, setTasks] = useState<WorkspaceTask[]>([])
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [clientFilter, setClientFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch("/api/internal/workspace-tasks", { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected calendar response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load calendar tasks")
      }
      if (!Array.isArray(data)) {
        throw new Error("Calendar service returned an unexpected response")
      }

      setTasks(data as WorkspaceTask[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load calendar")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const clients = useMemo(
    () => uniqueOptions(tasks.map((task) => ({ value: task.clientId, label: task.clientCompany }))),
    [tasks]
  )
  const services = useMemo(
    () => uniqueOptions(tasks.map((task) => ({
      value: task.serviceKey,
      label: task.serviceName || serviceLabel(task.serviceKey),
    }))),
    [tasks]
  )
  const projects = useMemo(
    () => uniqueOptions(
      tasks
        .filter((task) => task.projectId)
        .map((task) => ({
          value: task.projectId as string,
          label: task.projectName || task.serviceName || serviceLabel(task.serviceKey),
        }))
    ),
    [tasks]
  )

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (clientFilter !== "all" && task.clientId !== clientFilter) return false
        if (serviceFilter !== "all" && task.serviceKey !== serviceFilter) return false
        if (projectFilter !== "all" && task.projectId !== projectFilter) return false
        if (ownerFilter !== "all" && task.ownerRole !== ownerFilter) return false
        if (statusFilter === "active" && isClosed(task.status)) return false
        if (statusFilter === "completed" && !isClosed(task.status)) return false
        return true
      }),
    [clientFilter, ownerFilter, projectFilter, serviceFilter, statusFilter, tasks]
  )

  const datedTasks = useMemo(
    () => filteredTasks.filter((task) => task.dueAt),
    [filteredTasks]
  )
  const unscheduledTasks = filteredTasks.length - datedTasks.length
  const gridDays = useMemo(() => buildMonthGrid(activeMonth), [activeMonth])
  const monthTasks = useMemo(
    () =>
      datedTasks
        .filter((task) => task.dueAt && sameMonth(new Date(task.dueAt), activeMonth))
        .sort(compareDueDates),
    [activeMonth, datedTasks]
  )
  const agendaTasks = useMemo(
    () =>
      selectedDay
        ? datedTasks
            .filter((task) => task.dueAt && dateKey(new Date(task.dueAt)) === selectedDay)
            .sort(compareDueDates)
        : monthTasks,
    [datedTasks, monthTasks, selectedDay]
  )

  const today = new Date()
  const overdue = datedTasks.filter(
    (task) => task.dueAt && new Date(task.dueAt).getTime() < startOfDay(today).getTime() && !isClosed(task.status)
  ).length
  const dueNextSevenDays = datedTasks.filter((task) => {
    if (!task.dueAt || isClosed(task.status)) return false
    const due = new Date(task.dueAt).getTime()
    const start = startOfDay(today).getTime()
    return due >= start && due < addDays(startOfDay(today), 7).getTime()
  }).length

  const clearFilters = () => {
    setClientFilter("all")
    setServiceFilter("all")
    setProjectFilter("all")
    setOwnerFilter("all")
    setStatusFilter("active")
    setSelectedDay(null)
  }

  return (
    <AdminShell>
      <main className="min-h-[calc(100vh-5rem)] bg-[#f4f4f4] px-4 py-8 dark:bg-[#161616] md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1480px]">
          <header className="flex flex-col justify-between gap-6 border-b border-[#c6c6c6] pb-7 dark:border-[#525252] md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">
                Workspace
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[#161616] dark:text-white md:text-4xl">
                Calendar
              </h1>
              <p className="mt-2 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
                Deadlines from real client and project tasks.
              </p>
            </div>
            <Link
              href="/admin/tasks"
              className="inline-flex h-11 w-fit items-center gap-2 bg-[#0f62fe] px-4 text-sm font-semibold text-white transition hover:bg-[#0353e9]"
            >
              Open tasks
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </header>

          {!loading && !error && (
            <section
              aria-label="Calendar summary"
              className="grid border-b border-[#c6c6c6] dark:border-[#525252] sm:grid-cols-3"
            >
              <CalendarMetric label="Dated tasks" value={datedTasks.length} />
              <CalendarMetric label="Due in 7 days" value={dueNextSevenDays} />
              <CalendarMetric label="Overdue" value={overdue} />
            </section>
          )}

          {loading && <LoadingState />}
          {!loading && error && <ErrorState error={error} retry={loadTasks} />}
          {!loading && !error && (
            <>
              {tasks.length > 0 && (
                <CalendarFilters
                  clientFilter={clientFilter}
                  setClientFilter={setClientFilter}
                  serviceFilter={serviceFilter}
                  setServiceFilter={setServiceFilter}
                  projectFilter={projectFilter}
                  setProjectFilter={setProjectFilter}
                  ownerFilter={ownerFilter}
                  setOwnerFilter={setOwnerFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  clients={clients}
                  services={services}
                  projects={projects}
                  clear={clearFilters}
                  refresh={loadTasks}
                />
              )}

              {tasks.length === 0 ? (
                <EmptyCalendar />
              ) : (
                <div className="grid gap-6 py-7 2xl:grid-cols-[minmax(0,1fr)_340px]">
                  <section className="min-w-0" aria-label="Monthly calendar">
                    <div className="flex flex-col gap-4 border border-[#c6c6c6] bg-white p-4 dark:border-[#525252] dark:bg-[#262626] sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6f6f] dark:text-[#a8a8a8]">
                          Month
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-[#161616] dark:text-white">
                          {formatMonth(activeMonth)}
                        </h2>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMonth(addMonths(activeMonth, -1))
                            setSelectedDay(null)
                          }}
                          className="grid h-10 w-10 place-items-center border border-[#c6c6c6] text-[#525252] transition hover:bg-[#e8f1ff] hover:text-[#0f62fe] dark:border-[#525252] dark:text-[#c6c6c6] dark:hover:bg-[#393939]"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMonth(startOfMonth(new Date()))
                            setSelectedDay(dateKey(new Date()))
                          }}
                          className="h-10 border-y border-[#c6c6c6] px-4 text-sm font-semibold text-[#161616] transition hover:bg-[#e8f1ff] dark:border-[#525252] dark:text-white dark:hover:bg-[#393939]"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMonth(addMonths(activeMonth, 1))
                            setSelectedDay(null)
                          }}
                          className="grid h-10 w-10 place-items-center border border-[#c6c6c6] text-[#525252] transition hover:bg-[#e8f1ff] hover:text-[#0f62fe] dark:border-[#525252] dark:text-[#c6c6c6] dark:hover:bg-[#393939]"
                          aria-label="Next month"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border-x border-b border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
                      <div className="min-w-[760px]">
                        <div className="grid grid-cols-7 border-b border-[#c6c6c6] dark:border-[#525252]">
                          {weekdays.map((weekday) => (
                            <div
                              key={weekday}
                              className="border-r border-[#c6c6c6] px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6f6f] last:border-r-0 dark:border-[#525252] dark:text-[#a8a8a8]"
                            >
                              {weekday}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7">
                          {gridDays.map((day) => {
                            const key = dateKey(day)
                            const dayTasks = datedTasks
                              .filter((task) => task.dueAt && dateKey(new Date(task.dueAt)) === key)
                              .sort(compareDueDates)
                            const inMonth = sameMonth(day, activeMonth)
                            const selected = selectedDay === key

                            return (
                              <button
                                type="button"
                                key={key}
                                onClick={() => setSelectedDay(selected ? null : key)}
                                className={cn(
                                  "min-h-32 border-b border-r border-[#c6c6c6] p-2 text-left transition-colors hover:bg-[#f4f4f4] dark:border-[#525252] dark:hover:bg-[#393939]",
                                  !inMonth && "bg-[#f4f4f4] text-[#a8a8a8] dark:bg-[#161616] dark:text-[#6f6f6f]",
                                  selected && "bg-[#e8f1ff] outline outline-2 -outline-offset-2 outline-[#0f62fe] dark:bg-[#0b2f6b]",
                                  isToday(day) && !selected && "bg-[#edf5ff] dark:bg-[#1c2d41]"
                                )}
                                aria-label={`${formatFullDate(day)}, ${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}`}
                              >
                                <span className={cn(
                                  "inline-grid h-7 min-w-7 place-items-center text-sm font-semibold",
                                  isToday(day) && "bg-[#0f62fe] text-white"
                                )}>
                                  {day.getDate()}
                                </span>
                                <div className="mt-2 space-y-1">
                                  {dayTasks.slice(0, 2).map((task) => (
                                    <span
                                      key={task.id}
                                      className={cn(
                                        "block truncate border-l-2 bg-[#f4f4f4] px-2 py-1 text-xs text-[#161616] dark:bg-[#161616] dark:text-white",
                                        task.priority === "urgent" || task.priority === "high"
                                          ? "border-[#6929c4]"
                                          : "border-[#0f62fe]",
                                        isClosed(task.status) && "opacity-45"
                                      )}
                                    >
                                      {task.title}
                                    </span>
                                  ))}
                                  {dayTasks.length > 2 && (
                                    <span className="block px-2 text-xs text-[#6f6f6f] dark:text-[#a8a8a8]">
                                      +{dayTasks.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  <aside aria-labelledby="agenda-heading">
                    <div className="bg-[#161616] p-6 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">
                        Agenda
                      </p>
                      <h2 id="agenda-heading" className="mt-2 text-xl font-semibold">
                        {selectedDay
                          ? formatFullDate(parseDateKey(selectedDay))
                          : formatMonth(activeMonth)}
                      </h2>
                      <p className="mt-1 text-sm text-white/45">
                        {agendaTasks.length} scheduled task{agendaTasks.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="border-x border-b border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
                      {agendaTasks.length === 0 ? (
                        <div className="p-6">
                          <CalendarDays className="h-5 w-5 text-[#0f62fe]" />
                          <p className="mt-4 font-semibold text-[#161616] dark:text-white">
                            No scheduled work
                          </p>
                          <p className="mt-1 text-sm leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">
                            Choose another day or add a deadline from Tasks.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#c6c6c6] dark:divide-[#525252]">
                          {agendaTasks.map((task) => (
                            <Link
                              key={task.id}
                              href={`/clients/${task.clientId}/workspace`}
                              className="block p-5 transition hover:bg-[#f4f4f4] dark:hover:bg-[#393939]"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <p className="font-semibold text-[#161616] dark:text-white">
                                  {task.title}
                                </p>
                                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#0f62fe]" />
                              </div>
                              <p className="mt-2 text-sm text-[#525252] dark:text-[#c6c6c6]">
                                {task.clientCompany}
                              </p>
                              <p className="mt-1 text-xs text-[#6f6f6f] dark:text-[#a8a8a8]">
                                {task.projectName || task.serviceName || serviceLabel(task.serviceKey)}
                                {" · "}
                                {ownerLabel(task.ownerRole)}
                              </p>
                              <div className="mt-4 flex items-center justify-between gap-4 text-xs">
                                <span className="text-[#6f6f6f] dark:text-[#a8a8a8]">
                                  {task.dueAt ? formatTime(task.dueAt) : ""}
                                </span>
                                <span className="font-semibold uppercase tracking-[0.1em] text-[#0f62fe]">
                                  {statusLabel(task.status)}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {unscheduledTasks > 0 && (
                      <div className="mt-5 border border-[#c6c6c6] bg-white p-5 dark:border-[#525252] dark:bg-[#262626]">
                        <ListTodo className="h-5 w-5 text-[#0f62fe]" />
                        <p className="mt-4 font-semibold text-[#161616] dark:text-white">
                          {unscheduledTasks} without a deadline
                        </p>
                        <p className="mt-1 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
                          They remain in Tasks until a real date is assigned.
                        </p>
                        <Link
                          href="/admin/tasks"
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f62fe]"
                        >
                          Review tasks
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </AdminShell>
  )
}

function CalendarFilters({
  clientFilter,
  setClientFilter,
  serviceFilter,
  setServiceFilter,
  projectFilter,
  setProjectFilter,
  ownerFilter,
  setOwnerFilter,
  statusFilter,
  setStatusFilter,
  clients,
  services,
  projects,
  clear,
  refresh,
}: {
  clientFilter: string
  setClientFilter: (value: string) => void
  serviceFilter: string
  setServiceFilter: (value: string) => void
  projectFilter: string
  setProjectFilter: (value: string) => void
  ownerFilter: string
  setOwnerFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  clients: Array<{ value: string; label: string }>
  services: Array<{ value: string; label: string }>
  projects: Array<{ value: string; label: string }>
  clear: () => void
  refresh: () => void
}) {
  return (
    <section
      aria-label="Calendar filters"
      className="mt-7 grid gap-2 border border-[#c6c6c6] bg-white p-3 dark:border-[#525252] dark:bg-[#262626] md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(140px,1fr))_auto_auto]"
    >
      <CalendarSelect
        label="Client"
        value={clientFilter}
        change={setClientFilter}
        options={[{ value: "all", label: "All clients" }, ...clients]}
      />
      <CalendarSelect
        label="Service"
        value={serviceFilter}
        change={setServiceFilter}
        options={[{ value: "all", label: "All services" }, ...services]}
      />
      <CalendarSelect
        label="Project"
        value={projectFilter}
        change={setProjectFilter}
        options={[{ value: "all", label: "All projects" }, ...projects]}
      />
      <CalendarSelect
        label="Owner"
        value={ownerFilter}
        change={setOwnerFilter}
        options={[
          { value: "all", label: "All owners" },
          { value: "admin", label: "Altaira" },
          { value: "client", label: "Client" },
        ]}
      />
      <CalendarSelect
        label="Status"
        value={statusFilter}
        change={setStatusFilter}
        options={[
          { value: "active", label: "Active work" },
          { value: "all", label: "All statuses" },
          { value: "completed", label: "Completed" },
        ]}
      />
      <button
        type="button"
        onClick={clear}
        className="h-11 border border-[#c6c6c6] px-3 text-sm font-semibold text-[#525252] transition hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-[#525252] dark:text-[#c6c6c6]"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={refresh}
        className="grid h-11 w-11 place-items-center border border-[#c6c6c6] text-[#525252] transition hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-[#525252] dark:text-[#c6c6c6]"
        aria-label="Refresh calendar"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </section>
  )
}

function CalendarSelect({
  label,
  value,
  change,
  options,
}: {
  label: string
  value: string
  change: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => change(event.target.value)}
        className="h-11 w-full border border-[#c6c6c6] bg-white px-3 text-sm text-[#525252] outline-none transition focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616] dark:text-[#c6c6c6]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CalendarMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-[#c6c6c6] px-1 py-5 last:border-b-0 dark:border-[#525252] sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 first:sm:pl-0">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6f6f] dark:text-[#a8a8a8]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#161616] dark:text-white">{value}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="mt-7 flex min-h-[360px] items-center justify-center bg-[#161616] text-white">
      <div className="flex items-center gap-3 text-sm text-white/55">
        <RefreshCw className="h-4 w-4 animate-spin text-[#78a9ff]" />
        Loading calendar
      </div>
    </div>
  )
}

function ErrorState({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="mt-7 bg-[#161616] p-8 text-white">
      <AlertCircle className="h-6 w-6 text-[#78a9ff]" />
      <h2 className="mt-6 text-2xl font-semibold">Calendar unavailable</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">{error}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-8 inline-flex h-11 items-center gap-2 border border-white/25 px-4 text-sm font-semibold transition hover:border-[#0f62fe] hover:bg-[#0f62fe]"
      >
        Try again
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  )
}

function EmptyCalendar() {
  return (
    <div className="mt-7 flex min-h-[360px] flex-col justify-between bg-[#161616] p-8 text-white md:p-10">
      <div>
        <div className="grid h-11 w-11 place-items-center border border-white/20">
          <CalendarDays className="h-5 w-5 text-[#78a9ff]" />
        </div>
        <h2 className="mt-7 text-2xl font-semibold">No calendar entries yet</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
          The calendar starts empty. A task appears here only after a real project deadline is assigned.
        </p>
      </div>
      <Link
        href="/admin/tasks"
        className="mt-10 inline-flex w-fit items-center gap-2 border border-white/25 px-4 py-3 text-sm font-semibold transition hover:border-[#0f62fe] hover:bg-[#0f62fe]"
      >
        Open tasks
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function buildMonthGrid(month: Date) {
  const first = startOfMonth(month)
  const mondayOffset = (first.getDay() + 6) % 7
  const gridStart = addDays(first, -mondayOffset)
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function isToday(date: Date) {
  return dateKey(date) === dateKey(new Date())
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date)
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function compareDueDates(left: WorkspaceTask, right: WorkspaceTask) {
  return new Date(left.dueAt || 0).getTime() - new Date(right.dueAt || 0).getTime()
}

function isClosed(status: string) {
  return status === "completed" || status === "cancelled"
}

function ownerLabel(owner: WorkspaceTask["ownerRole"]) {
  return owner === "client" ? "Client" : "Altaira"
}

function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function serviceLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function uniqueOptions(options: Array<{ value: string; label: string }>) {
  return Array.from(new Map(options.map((option) => [option.value, option])).values()).sort((left, right) =>
    left.label.localeCompare(right.label)
  )
}
