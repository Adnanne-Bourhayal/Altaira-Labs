"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, BriefcaseBusiness, Plus, RefreshCw, Search, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav"

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

export default function AdminServicesPage() {
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
        router.replace("/admin/login")
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
        router.replace("/admin/login")
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
    <main className="min-h-screen bg-[#050810] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-300">Altaira Workspace</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Service Catalogue</h1>
            <p className="mt-3 text-white/40">
              Internal catalogue for assigning Altaira Labs services to clients and service tracks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AdminWorkspaceNav active="services" />
            <Link href="/services" className="border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07]">
              Public Services
            </Link>
            <button
              onClick={() => fetchServices(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-white/50">Total Services</span>
              <BriefcaseBusiness className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{services.length}</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-white/50">Active</span>
              <Wrench className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold">{activeServices}</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-white/50">Categories</span>
              <Plus className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold">{categories}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <section>
            <div className="mb-5 border border-white/10 bg-white/[0.03] p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search services..."
                  className="w-full border border-white/10 bg-[#0b1220] py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none"
                />
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-6 text-white/60">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-300" />
                Loading services...
              </div>
            )}

            {error && (
              <div className="flex gap-3 border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div>
                  <h2 className="font-semibold text-red-200">Could not load services</h2>
                  <p className="mt-1 text-sm text-red-200/80">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && filteredServices.length === 0 && (
              <div className="border border-white/10 bg-white/[0.03] p-8 text-center">
                <h2 className="mb-2 text-xl font-semibold">No services found</h2>
                <p className="text-white/40">The seed catalogue should appear after backend startup.</p>
              </div>
            )}

            {!loading && !error && filteredServices.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredServices.map((service) => (
                  <article key={service.id} className="border border-white/10 bg-white/[0.03] p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">{service.name}</h2>
                        <p className="mt-1 text-sm text-white/45">{service.category || "Uncategorised"}</p>
                      </div>
                      <span className={`border px-2 py-1 text-xs ${
                        service.active
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.04] text-white/45"
                      }`}>
                        {service.active ? "active" : "inactive"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-white/60">{service.description || "-"}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-2 text-lg font-semibold">Add Service</h2>
            <p className="mb-5 text-sm text-white/40">
              Add a service only when it belongs to the real offer and should be assignable to clients.
            </p>

            {formError && (
              <div className="mb-4 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={createService} className="space-y-3">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Service name"
                className="w-full border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none"
              />
              <input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Category"
                className="w-full border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                rows={4}
                className="w-full border border-white/10 bg-[#0b1220] px-4 py-3 text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none"
              />
              <button
                disabled={submitting}
                className="w-full bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
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
