"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRight, Inbox, Plus, RefreshCw, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminShell } from "@/components/admin/AdminShell"
import { LEAD_STATUS_OPTIONS, statusLabel } from "@/lib/lead-status"
import { leadFormDefinition } from "@/lib/lead-intake"

type Lead = {
  id: string
  fullName: string
  businessName: string
  email: string
  phone?: string
  industry?: string
  serviceInterest?: string
  goals?: string
  status: string
  createdAt: string
}

export function AdminLeads() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/internal/leads", { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected lead service response" }))
      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.message || data?.error || "Could not load leads")
      }
      setLeads(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load leads")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadLeads()
  }, [loadLeads])

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase()
    return leads.filter((lead) => {
      const matchesQuery = !query || [
        lead.id,
        lead.fullName,
        lead.businessName,
        lead.email,
        lead.phone,
        lead.industry,
        lead.serviceInterest,
      ].some((value) => value?.toLowerCase().includes(query))
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [leads, search, statusFilter])

  const needsReview = leads.filter((lead) => lead.status === "new" || lead.status === "contacted").length
  const qualified = leads.filter((lead) => lead.status === "qualified").length
  const converted = leads.filter((lead) => lead.status === "converted").length

  return (
    <AdminShell>
      <main className="px-4 py-10 md:px-8 md:py-12 xl:px-12">
        <div className="mx-auto max-w-[1540px]">
          <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">Customers</p>
              <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Lead inbox</h1>
              <p className="mt-2 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
                Review real enquiries, qualify the need and convert only when the scope is clear.
              </p>
            </div>
            <Link
              href="/leads/new"
              className="inline-flex h-11 w-fit items-center gap-2 bg-[#0f62fe] px-4 text-sm font-semibold text-white transition hover:bg-[#0353e9]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New intake
            </Link>
          </header>

          <section className="mt-9 grid border-y border-[#c6c6c6] dark:border-[#525252] sm:grid-cols-3" aria-label="Lead summary">
            <Metric label="Needs review" value={needsReview} />
            <Metric label="Qualified" value={qualified} />
            <Metric label="Converted" value={converted} />
          </section>

          <section className="mt-7 border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
            <div className="grid gap-3 border-b border-[#c6c6c6] p-4 dark:border-[#525252] lg:grid-cols-[minmax(280px,1fr)_220px_auto]">
              <label className="relative">
                <span className="sr-only">Search leads</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d8d8d]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, company, email or ID"
                  className="h-11 w-full border border-[#c6c6c6] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter leads by status"
                className="h-11 border border-[#c6c6c6] bg-white px-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
              >
                <option value="all">All statuses</option>
                {LEAD_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void loadLeads()}
                className="inline-flex h-11 items-center justify-center gap-2 border border-[#c6c6c6] px-4 text-sm font-medium text-[#525252] transition hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-[#525252] dark:text-[#c6c6c6]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                Refresh
              </button>
            </div>

            {loading && <StateMessage icon={RefreshCw} title="Loading leads" message="Reading the current lead inbox." spin />}
            {!loading && error && (
              <StateMessage icon={Inbox} title="Could not load leads" message={error} />
            )}
            {!loading && !error && visibleLeads.length === 0 && (
              <StateMessage
                icon={Inbox}
                title={leads.length === 0 ? "No leads yet" : "No matching leads"}
                message={leads.length === 0
                  ? "The inbox will stay empty until a public request or admin intake is created."
                  : "Change the search or status filter."}
              />
            )}

            {!loading && !error && visibleLeads.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead className="bg-[#090b16] text-[11px] uppercase tracking-[0.12em] text-white/50">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Lead</th>
                      <th className="px-5 py-4 font-semibold">Business</th>
                      <th className="px-5 py-4 font-semibold">Interest</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Received</th>
                      <th className="w-16 px-5 py-4"><span className="sr-only">Open</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
                    {visibleLeads.map((lead) => (
                      <tr key={lead.id} className="text-sm transition hover:bg-[#f4f4f4] dark:hover:bg-[#393939]">
                        <td className="px-5 py-5">
                          <p className="font-semibold">{lead.fullName}</p>
                          <p className="mt-1 text-xs text-[#6f6f6f] dark:text-[#a8a8a8]">{lead.email}</p>
                        </td>
                        <td className="px-5 py-5">{lead.businessName}</td>
                        <td className="px-5 py-5 text-[#525252] dark:text-[#c6c6c6]">
                          {leadFormDefinition(lead.serviceInterest || "")?.shortTitle || lead.serviceInterest || lead.industry || "General enquiry"}
                        </td>
                        <td className="px-5 py-5">
                          <span className="inline-flex items-center gap-2 text-sm">
                            <span className={`h-2 w-2 ${lead.status === "converted" ? "bg-emerald-500" : "bg-[#0f62fe]"}`} />
                            {statusLabel(lead.status)}
                          </span>
                        </td>
                        <td className="px-5 py-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{formatDate(lead.createdAt)}</td>
                        <td className="px-5 py-5">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="grid h-9 w-9 place-items-center border border-[#c6c6c6] text-[#525252] transition hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-[#525252] dark:text-[#c6c6c6]"
                            aria-label={`Open ${lead.fullName}`}
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminShell>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-[#c6c6c6] px-0 py-5 sm:border-r sm:px-6 dark:border-[#525252]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8d8d8d]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function StateMessage({
  icon: Icon,
  title,
  message,
  spin = false,
}: {
  icon: typeof Inbox
  title: string
  message: string
  spin?: boolean
}) {
  return (
    <div className="px-6 py-16 text-center">
      <Icon className={`mx-auto h-6 w-6 text-[#0f62fe] ${spin ? "animate-spin" : ""}`} />
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">{message}</p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}
