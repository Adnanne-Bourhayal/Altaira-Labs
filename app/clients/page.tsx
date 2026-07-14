"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowRight, Building2, Mail, Phone, RefreshCw, Search, UserPlus, Users } from "lucide-react"
import { useRouter } from "next/navigation"

type Client = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  sourceLeadId: string | null
  status: string
  createdAt: string
  updatedAt: string
}

const initialForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchClients = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const response = await fetch("/api/internal/clients", { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected response from client service" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to fetch clients")
      }

      if (!Array.isArray(data)) {
        throw new Error("Client service returned an unexpected response")
      }

      setClients(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not load clients.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filteredClients = useMemo(() => {
    const query = search.toLowerCase()
    return clients.filter((client) =>
      client.name.toLowerCase().includes(query) ||
      client.company.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query)
    )
  }, [clients, search])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setFormError("")

      const response = await fetch("/api/internal/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from client service" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not create client")
      }

      setClients((current) => [data as Client, ...current.filter((client) => client.id !== data.id)])
      setForm(initialForm)
    } catch (err) {
      console.error(err)
      setFormError(err instanceof Error ? err.message : "Could not create client.")
    } finally {
      setSubmitting(false)
    }
  }

  const activeClients = clients.filter((client) => client.status === "active").length
  const linkedFromLeads = clients.filter((client) => client.sourceLeadId).length

  return (
    <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-blue-300 text-sm font-medium mb-2">Altaira Workspace</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Clients</h1>
            <p className="text-white/40 mt-3">
              Convert qualified leads into real client records and manage their service work.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/leads" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07]">
              Leads
            </Link>
            <Link href="/services" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07]">
              Services
            </Link>
            <button
              onClick={() => fetchClients(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Total Clients</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{clients.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Active</span>
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold">{activeClients}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">From Leads</span>
              <UserPlus className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold">{linkedFromLeads}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <section>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5">
              <div className="relative">
                <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search clients by name, company, or email..."
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
                />
              </div>
            </div>

            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                Loading clients...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300 flex gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-red-200">Could not load clients</h2>
                  <p className="text-sm text-red-200/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredClients.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">No clients yet</h2>
                <p className="text-white/40">Convert a lead or create a client manually.</p>
              </div>
            )}

            {!loading && !error && filteredClients.length > 0 && (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-semibold">{client.name}</h2>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                          {client.status}
                        </span>
                      </div>
                      <p className="text-white/50">{client.company}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/45">
                        <span className="inline-flex items-center gap-1.5 break-all">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white/70" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 h-fit">
            <h2 className="text-lg font-semibold mb-2">Create Client</h2>
            <p className="text-sm text-white/40 mb-5">
              Use this for direct clients. Lead conversion is available from each lead detail page.
            </p>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Contact name"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <input
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                placeholder="Company"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
                type="email"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone (optional)"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <button
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Client"}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  )
}
