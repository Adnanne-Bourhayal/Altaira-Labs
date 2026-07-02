"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw, Search, Users, Mail, Building2, Activity, LogOut, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { LEAD_STATUS_OPTIONS, statusBadgeClass, statusLabel } from "@/lib/lead-status"

type Lead = {
  id: string
  fullName: string
  businessName: string
  email: string
  industry: string
  goals: string
  status: string
  createdAt: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchLeads = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const response = await fetch("/api/internal/leads", {
        cache: "no-store",
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from lead service" }))

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to fetch leads")
      }

      if (!Array.isArray(data)) {
        throw new Error("Lead service returned an unexpected response")
      }

      setLeads(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not load leads.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
        lead.businessName.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ? true : lead.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [leads, search, statusFilter])

  const totalLeads = leads.length
  const newLeads = leads.filter((lead) => lead.status === "new").length
  const uniqueBusinesses = new Set(leads.map((lead) => lead.businessName)).size
  const uniqueEmails = new Set(leads.map((lead) => lead.email)).size
  const hasNoLeads = !loading && !error && leads.length === 0
  const hasNoMatches = !loading && !error && leads.length > 0 && filteredLeads.length === 0

  return (
    <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Leads Dashboard</h1>
            <p className="text-white/40 mt-3">
              View and manage all submitted leads captured from the website.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/[0.07] hover:border-white/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Total Leads</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{totalLeads}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">New Leads</span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold">{newLeads}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Businesses</span>
              <Building2 className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-3xl font-bold">{uniqueBusinesses}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Unique Emails</span>
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold">{uniqueEmails}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, business, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white focus:outline-none focus:border-blue-500/40"
            >
              <option value="all">All statuses</option>
              {LEAD_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
            Loading leads...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-red-200">Could not load leads</h2>
                  <p className="text-sm text-red-200/80 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => fetchLeads(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Retry
              </button>
            </div>
          </div>
        )}

        {hasNoLeads && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No leads yet</h2>
            <p className="text-white/40">
              Submit the public lead form once to verify the capture flow.
            </p>
          </div>
        )}

        {hasNoMatches && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No matching leads</h2>
            <p className="text-white/40">
              Try adjusting your search or filter.
            </p>
          </div>
        )}

        {!loading && !error && filteredLeads.length > 0 && (
          <>
            <div className="hidden lg:block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-sm text-white/40 font-medium">
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Business</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Industry</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Created</div>
              </div>

              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-sm hover:bg-white/[0.02] transition-colors"
                >
                  <div className="col-span-2 font-medium text-white">
                    <Link href={`/leads/${lead.id}`} className="hover:text-blue-300 transition-colors">
                      {lead.fullName}
                    </Link>
                  </div>
                  <div className="col-span-2 text-white/80">{lead.businessName}</div>
                  <div className="col-span-3 text-white/70 break-all">{lead.email}</div>
                  <div className="col-span-2 text-white/60">{lead.industry || "-"}</div>
                  <div className="col-span-1">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs border ${statusBadgeClass(lead.status)}`}>
                      {statusLabel(lead.status)}
                    </span>
                  </div>
                  <div className="col-span-2 text-white/50">
                    {new Date(lead.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {filteredLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 block"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{lead.fullName}</h3>
                      <p className="text-white/50 text-sm">{lead.businessName}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs border ${statusBadgeClass(lead.status)}`}>
                      {statusLabel(lead.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-white/70 break-all">
                      <span className="text-white/40">Email:</span> {lead.email}
                    </p>
                    <p className="text-white/70">
                      <span className="text-white/40">Industry:</span> {lead.industry || "-"}
                    </p>
                    <p className="text-white/50">
                      <span className="text-white/40">Created:</span>{" "}
                      {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
