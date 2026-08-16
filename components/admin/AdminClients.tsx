"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import {
  formatAdminDate,
  humanizeAdminValue,
  type AdminClientSummary,
} from "@/lib/admin-client-summary"

const initialForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  sectorType: "custom",
}

export function AdminClients() {
  const router = useRouter()
  const [clients, setClients] = useState<AdminClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [stateFilter, setStateFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadClients = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError("")

      const response = await fetch("/api/internal/clients/admin-summaries", {
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({ error: "Unexpected client response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.message || data?.error || "Could not load clients")
      }

      setClients(data)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load clients")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    void loadClients()
  }, [loadClients])

  const services = useMemo(
    () => [...new Set(clients.flatMap((client) => client.activeServices))].sort(),
    [clients]
  )
  const states = useMemo(
    () => [...new Set(clients.map((client) => client.overallState))].sort(),
    [clients]
  )
  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()

    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        [client.name, client.company, client.email, client.sectorType, ...client.activeServices]
          .join(" ")
          .toLowerCase()
          .includes(query)
      const matchesState = stateFilter === "all" || client.overallState === stateFilter
      const matchesService =
        serviceFilter === "all" || client.activeServices.includes(serviceFilter)

      return matchesSearch && matchesState && matchesService
    })
  }, [clients, search, serviceFilter, stateFilter])

  const activeCount = clients.filter((client) => client.status === "active").length
  const attentionCount = clients.filter((client) =>
    ["blocked", "needs_attention"].includes(client.overallState)
  ).length

  const createClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setFormError("")

      const response = await fetch("/api/internal/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "active" }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected client response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok || !data?.id) {
        throw new Error(data?.message || data?.error || "Could not create client")
      }

      setDrawerOpen(false)
      setForm(initialForm)
      router.push(`/clients/${data.id}`)
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? caughtError.message : "Could not create client")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminShell search={search} onSearchChange={setSearch}>
      <main className="px-4 py-8 md:px-8 md:py-10 xl:px-12">
        <div className="mx-auto max-w-[1480px]">
          <header className="flex flex-col gap-5 border-b border-slate-200 pb-8 dark:border-white/10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">
                Customers
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#161616] dark:text-white">
                Clients
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Business context first. Operational tools stay inside each client record.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 bg-[#0f62fe] px-5 text-sm font-semibold text-white transition hover:bg-[#0353e9]"
            >
              <Plus className="h-4 w-4" />
              New client
            </button>
          </header>

          <section className="grid border-b border-slate-200 dark:border-white/10 sm:grid-cols-3">
            <SummaryItem label="Client records" value={loading ? "—" : String(clients.length)} />
            <SummaryItem label="Active" value={loading ? "—" : String(activeCount)} />
            <SummaryItem label="Needs attention" value={loading ? "—" : String(attentionCount)} />
          </section>

          <div className="flex flex-col gap-3 border-b border-slate-200 py-5 dark:border-white/10 md:flex-row md:items-center">
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              aria-label="Filter clients by state"
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#0f62fe] dark:border-white/15 dark:bg-[#262626] dark:text-white"
            >
              <option value="all">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {humanizeAdminValue(state)}
                </option>
              ))}
            </select>
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              aria-label="Filter clients by service"
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#0f62fe] dark:border-white/15 dark:bg-[#262626] dark:text-white"
            >
              <option value="all">All services</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadClients(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:border-[#0f62fe] hover:text-[#0f62fe] disabled:opacity-50 dark:border-white/15 dark:text-white/60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <p className="text-sm text-slate-400 md:ml-auto">
              {filteredClients.length} shown
            </p>
          </div>

          {loading && <ClientLoadingState />}

          {!loading && error && (
            <div className="mt-8 flex gap-3 border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Clients could not be loaded</p>
                <p className="mt-1 text-sm opacity-75">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && clients.length === 0 && (
            <EmptyClients onCreate={() => setDrawerOpen(true)} />
          )}

          {!loading && !error && clients.length > 0 && filteredClients.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-semibold text-[#161616] dark:text-white">No matching clients</p>
              <p className="mt-2 text-sm text-slate-500">Adjust the search or filters.</p>
            </div>
          )}

          {!loading && !error && filteredClients.length > 0 && (
            <section className="overflow-x-auto" aria-label="Client records">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[1.3fr_1.2fr_.8fr_1.4fr_.7fr_.7fr_32px] gap-4 border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400 dark:border-white/10">
                  <span>Client</span>
                  <span>Services</span>
                  <span>State</span>
                  <span>Next action</span>
                  <span>Waiting on</span>
                  <span>Last movement</span>
                  <span />
                </div>

                {filteredClients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="group grid min-h-[88px] grid-cols-[1.3fr_1.2fr_.8fr_1.4fr_.7fr_.7fr_32px] items-center gap-4 border-b border-slate-200 px-4 py-4 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#161616] dark:text-white">
                        {client.company}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">{client.name}</p>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {client.activeServices.length > 0 ? (
                        client.activeServices.slice(0, 2).map((service) => (
                          <span
                            key={service}
                            className="max-w-full truncate border border-slate-300 px-2 py-1 text-xs text-slate-600 dark:border-white/15 dark:text-white/60"
                          >
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No services</span>
                      )}
                      {client.activeServices.length > 2 && (
                        <span className="px-1 py-1 text-xs text-slate-400">
                          +{client.activeServices.length - 2}
                        </span>
                      )}
                    </div>
                    <StateLabel state={client.overallState} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-white/80">
                        {client.nextAction || "No pending task"}
                      </p>
                      {client.nextActionDueAt && (
                        <p className="mt-1 text-xs text-slate-400">
                          Due {formatAdminDate(client.nextActionDueAt)}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-slate-500">
                      {client.nextActionOwnerRole
                        ? client.nextActionOwnerRole === "admin"
                          ? "Altaira"
                          : "Client"
                        : "—"}
                    </span>
                    <span className="text-sm text-slate-500">
                      {formatAdminDate(client.lastActivityAt)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0f62fe]" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {drawerOpen && (
        <NewClientDrawer
          form={form}
          setForm={setForm}
          error={formError}
          submitting={submitting}
          onClose={() => {
            setDrawerOpen(false)
            setFormError("")
          }}
          onSubmit={createClient}
        />
      )}
    </AdminShell>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-slate-200 px-1 py-6 first:pl-0 sm:border-r sm:px-6 sm:last:border-r-0 dark:border-white/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#161616] dark:text-white">{value}</p>
    </div>
  )
}

function StateLabel({ state }: { state: string }) {
  const attention = ["blocked", "needs_attention"].includes(state)

  return (
    <span
      className={`w-fit border px-2 py-1 text-xs font-medium ${
        attention
          ? "border-[#8a3ffc] text-[#6929c4] dark:text-[#be95ff]"
          : "border-slate-300 text-slate-600 dark:border-white/15 dark:text-white/60"
      }`}
    >
      {humanizeAdminValue(state)}
    </span>
  )
}

function ClientLoadingState() {
  return (
    <div className="py-12" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <RefreshCw className="h-4 w-4 animate-spin text-[#0f62fe]" />
        Loading client records
      </div>
    </div>
  )
}

function EmptyClients({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-8 flex min-h-[300px] flex-col justify-between border border-[#393939] bg-[#161616] p-7 text-white md:p-9">
      <div>
        <Users className="h-6 w-6 text-[#78a9ff]" />
        <h2 className="mt-5 text-2xl font-semibold">No client records yet</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/50">
          Create the first real client here or convert a qualified lead. No demonstration records are
          shown in this operational view.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="mt-8 inline-flex w-fit items-center gap-2 border border-white/25 px-4 py-3 text-sm font-semibold transition hover:border-[#0f62fe] hover:bg-[#0f62fe]"
      >
        <Plus className="h-4 w-4" />
        New client
      </button>
    </div>
  )
}

type NewClientDrawerProps = {
  form: typeof initialForm
  setForm: React.Dispatch<React.SetStateAction<typeof initialForm>>
  error: string
  submitting: boolean
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function NewClientDrawer({
  form,
  setForm,
  error,
  submitting,
  onClose,
  onSubmit,
}: NewClientDrawerProps) {
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/45">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close new client form"
        onClick={onClose}
      />
      <aside className="relative z-10 h-full w-full max-w-[480px] overflow-y-auto bg-white p-6 shadow-2xl dark:bg-[#161616] md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">
              Client record
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#161616] dark:text-white">
              New client
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center border border-slate-300 text-slate-500 hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-white/15"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          {error && (
            <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {error}
            </div>
          )}
          <ClientField
            label="Primary contact"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="Full name"
            required
          />
          <ClientField
            label="Company"
            value={form.company}
            onChange={(value) => setForm((current) => ({ ...current, company: value }))}
            placeholder="Business name"
            required
          />
          <ClientField
            label="Email"
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            placeholder="name@company.com"
            type="email"
            required
          />
          <ClientField
            label="Phone"
            value={form.phone}
            onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
            placeholder="+32..."
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/70">
              Sector
            </span>
            <select
              value={form.sectorType}
              onChange={(event) =>
                setForm((current) => ({ ...current, sectorType: event.target.value }))
              }
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0f62fe] dark:border-white/15 dark:bg-[#262626] dark:text-white"
            >
              <option value="clinics">Clinics</option>
              <option value="car_dealers">Car dealers</option>
              <option value="restaurants">Restaurants</option>
              <option value="custom">Specialty by sector</option>
            </select>
          </label>

          <div className="border-t border-slate-200 pt-6 dark:border-white/10">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#0f62fe] px-5 text-sm font-semibold text-white transition hover:bg-[#0353e9] disabled:opacity-50"
            >
              <Building2 className="h-4 w-4" />
              {submitting ? "Creating client..." : "Create client"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

function ClientField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/70">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f62fe] dark:border-white/15 dark:bg-[#262626] dark:text-white"
      />
    </label>
  )
}
