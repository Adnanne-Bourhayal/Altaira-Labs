"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, BriefcaseBusiness, Plus, RefreshCw, Search, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"

type ServiceItem = {
  id: string
  name: string
  category: string
  description: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const initialForm = {
  name: "",
  category: "",
  description: "",
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchServices = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const response = await fetch("/api/internal/services", { cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unexpected response from service catalogue" }))

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to fetch services")
      }

      if (!Array.isArray(data)) {
        throw new Error("Service catalogue returned an unexpected response")
      }

      setServices(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not load services.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const filteredServices = useMemo(() => {
    const query = search.toLowerCase()
    return services.filter((service) =>
      service.name.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query)
    )
  }, [services, search])

  const createService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setFormError("")

      const response = await fetch("/api/internal/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from service catalogue" }))

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not create service")
      }

      setServices((current) => [...current.filter((service) => service.id !== data.id), data as ServiceItem].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(initialForm)
    } catch (err) {
      console.error(err)
      setFormError(err instanceof Error ? err.message : "Could not create service.")
    } finally {
      setSubmitting(false)
    }
  }

  const activeServices = services.filter((service) => service.active).length
  const categories = new Set(services.map((service) => service.category).filter(Boolean)).size

  return (
    <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-blue-300 text-sm font-medium mb-2">Altaira Workspace</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Service Catalogue</h1>
            <p className="text-white/40 mt-3">
              The services Altaira Labs can assign to clients during the academic core flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/leads" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07]">
              Leads
            </Link>
            <Link href="/clients" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07]">
              Clients
            </Link>
            <button
              onClick={() => fetchServices(true)}
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
              <span className="text-white/50 text-sm">Total Services</span>
              <BriefcaseBusiness className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{services.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Active</span>
              <Wrench className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold">{activeServices}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Categories</span>
              <Plus className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold">{categories}</div>
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
                  placeholder="Search services..."
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
                />
              </div>
            </div>

            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                Loading services...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300 flex gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-red-200">Could not load services</h2>
                  <p className="text-sm text-red-200/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredServices.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">No services found</h2>
                <p className="text-white/40">The seed catalogue should appear after backend startup.</p>
              </div>
            )}

            {!loading && !error && filteredServices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredServices.map((service) => (
                  <article key={service.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h2 className="text-lg font-semibold">{service.name}</h2>
                        <p className="text-sm text-white/45 mt-1">{service.category || "Uncategorised"}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-xs ${
                        service.active
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.04] text-white/45"
                      }`}>
                        {service.active ? "active" : "inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{service.description || "-"}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 h-fit">
            <h2 className="text-lg font-semibold mb-2">Add Service</h2>
            <p className="text-sm text-white/40 mb-5">
              The default catalogue is seeded from the website. Add a service only when it belongs to the real offer.
            </p>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={createService} className="space-y-3">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Service name"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Category"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
              />
              <button
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Service"}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  )
}
