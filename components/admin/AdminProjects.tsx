"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowRight, FolderKanban, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminShell } from "@/components/admin/AdminShell"

type AdminProject = {
  id: string
  clientId: string
  clientName: string
  clientCompany: string
  clientStatus: string
  clientServiceId: string | null
  serviceName: string | null
  projectKey: string
  name: string
  currentPhase: string
  reviewPending: boolean
  revisionPendingAt: string | null
  updatedAt: string
}

export function AdminProjects() {
  const router = useRouter()
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/internal/client-projects", { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected project response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load projects")
      }

      if (!Array.isArray(data)) {
        throw new Error("Project service returned an unexpected response")
      }

      setProjects(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load projects")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return projects
    }

    return projects.filter((project) =>
      [project.name, project.clientName, project.clientCompany, project.serviceName, project.currentPhase]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    )
  }, [projects, search])

  return (
    <AdminShell
      search={search}
      onSearchChange={projects.length > 0 ? setSearch : undefined}
    >
      <main className="px-4 py-10 md:px-8 md:py-12 xl:px-12">
        <div className="mx-auto max-w-[1480px]">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">
              Delivery
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#161616] md:text-4xl dark:text-white">
              Projects
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Open a client delivery workspace and continue from its current context.
            </p>
          </header>

          <section className="mt-10" aria-labelledby="project-list-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Current work
                </p>
                <h2
                  id="project-list-title"
                  className="mt-2 text-xl font-semibold tracking-tight text-[#161616] dark:text-white"
                >
                  Active projects
                </h2>
              </div>
              {!loading && !error && projects.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {projects.length} {projects.length === 1 ? "project" : "projects"}
                </p>
              )}
            </div>

            {loading && <LoadingState />}

            {!loading && error && (
              <div className="mt-5 flex min-h-[240px] flex-col justify-between border border-[#393939] bg-[#161616] p-7 text-white md:p-9">
                <div>
                  <AlertCircle className="h-6 w-6 text-[#78a9ff]" />
                  <h3 className="mt-6 text-2xl font-semibold">Projects unavailable</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={loadProjects}
                  className="mt-8 inline-flex w-fit items-center gap-2 border border-white/25 px-4 py-3 text-sm font-semibold transition hover:border-[#0f62fe] hover:bg-[#0f62fe]"
                >
                  Try again
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}

            {!loading && !error && projects.length === 0 && <EmptyState />}

            {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
              <div className="mt-5 border border-[#393939] bg-[#161616] px-7 py-16 text-center text-white">
                <h3 className="text-xl font-semibold">No matching projects</h3>
                <p className="mt-2 text-sm text-white/50">Try a different project, client or service.</p>
              </div>
            )}

            {!loading && !error && filteredProjects.length > 0 && (
              <ProjectList projects={filteredProjects} />
            )}
          </section>
        </div>
      </main>
    </AdminShell>
  )
}

function LoadingState() {
  return (
    <div className="mt-5 flex min-h-[240px] items-center justify-center border border-[#393939] bg-[#161616] text-white">
      <div className="flex items-center gap-3 text-sm text-white/55">
        <RefreshCw className="h-4 w-4 animate-spin text-[#78a9ff]" />
        Loading projects
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-5 flex min-h-[320px] flex-col justify-between border border-[#393939] bg-[#161616] p-7 text-white md:p-9">
      <div>
        <div className="grid h-11 w-11 place-items-center border border-white/20">
          <FolderKanban className="h-5 w-5 text-[#78a9ff]" />
        </div>
        <h3 className="mt-7 text-2xl font-semibold">No verified projects</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
          Technical end-to-end fixtures are excluded from live client work. A real project will
          appear here after its client workspace is created.
        </p>
      </div>

      <div className="mt-10 border-t border-white/15 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
          Next step
        </p>
        <Link
          href="/clients"
          className="mt-3 inline-flex w-fit items-center gap-2 border border-white/25 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#0f62fe] hover:bg-[#0f62fe]"
        >
          Open clients
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function ProjectList({ projects }: { projects: AdminProject[] }) {
  return (
    <div className="mt-5 border border-[#393939] bg-[#161616] text-white">
      <div className="hidden grid-cols-[1.35fr_1.1fr_0.8fr_1fr_auto] gap-6 border-b border-[#393939] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35 lg:grid">
        <span>Project</span>
        <span>Client</span>
        <span>Phase</span>
        <span>Next action</span>
        <span className="w-6" aria-hidden="true" />
      </div>

      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/clients/${project.clientId}/workspace`}
          className="grid gap-5 border-b border-[#393939] px-6 py-6 transition last:border-b-0 hover:bg-[#262626] lg:grid-cols-[1.35fr_1.1fr_0.8fr_1fr_auto] lg:items-center lg:gap-6"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">{project.name}</p>
            <p className="mt-1 truncate text-sm text-white/45">
              {project.serviceName || serviceLabel(project.projectKey)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{project.clientCompany}</p>
            <p className="mt-1 truncate text-sm text-white/45">{project.clientName}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-white/35 lg:hidden">Phase</p>
            <p className="mt-1 text-sm capitalize text-white/75 lg:mt-0">
              {project.currentPhase.replaceAll("_", " ")}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-white/35 lg:hidden">
              Next action
            </p>
            <p className="mt-1 text-sm text-white/75 lg:mt-0">
              {project.reviewPending ? "Review client feedback" : "Not recorded"}
            </p>
            <p className="mt-1 text-xs text-white/35">Updated {formatDate(project.updatedAt)}</p>
          </div>

          <ArrowRight className="h-4 w-4 text-white/40" />
        </Link>
      ))}
    </div>
  )
}

function serviceLabel(projectKey: string) {
  return projectKey.replaceAll("_", " ")
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "date unavailable"
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}
