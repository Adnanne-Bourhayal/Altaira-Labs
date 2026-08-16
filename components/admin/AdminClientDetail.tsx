"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  Mail,
  Phone,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import {
  formatAdminDate,
  humanizeAdminValue,
  type AdminClientSummary,
} from "@/lib/admin-client-summary"

export function AdminClientDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<AdminClientSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadClient = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/internal/clients/${params.id}/admin-summary`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({ error: "Unexpected client response" }))

      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }

      if (!response.ok || !data?.id) {
        throw new Error(data?.message || data?.error || "Could not load client")
      }

      setClient(data)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load client")
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    void loadClient()
  }, [loadClient])

  return (
    <AdminShell>
      <main className="px-4 py-8 md:px-8 md:py-10 xl:px-12">
        <div className="mx-auto max-w-[1480px]">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0f62fe]"
          >
            <ArrowLeft className="h-4 w-4" />
            Clients
          </Link>

          {loading && (
            <div className="mt-10 flex items-center gap-3 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin text-[#0f62fe]" />
              Loading client context
            </div>
          )}

          {!loading && error && (
            <div className="mt-10 flex gap-3 border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Client could not be loaded</p>
                <p className="mt-1 text-sm opacity-75">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadClient()}
                  className="mt-4 text-sm font-semibold underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && client && <ClientContext client={client} />}
        </div>
      </main>
    </AdminShell>
  )
}

function ClientContext({ client }: { client: AdminClientSummary }) {
  return (
    <>
      <header className="mt-6 flex flex-col gap-7 border-b border-slate-200 pb-8 dark:border-white/10 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">
              Client context
            </p>
            <StateLabel state={client.overallState} />
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#161616] md:text-4xl dark:text-white">
            {client.company}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Primary contact: {client.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/clients/${client.id}/operations`}
            className="inline-flex h-11 items-center justify-center gap-2 border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-white/20 dark:text-white/70"
          >
            <Settings2 className="h-4 w-4" />
            Manage
          </Link>
          <Link
            href={`/clients/${client.id}/workspace`}
            className="inline-flex h-11 items-center justify-center gap-2 bg-[#0f62fe] px-5 text-sm font-semibold text-white transition hover:bg-[#0353e9]"
          >
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="grid border-b border-slate-200 dark:border-white/10 md:grid-cols-2 xl:grid-cols-4">
        <ContextDatum
          icon={Building2}
          label="Sector"
          value={humanizeAdminValue(client.sectorType)}
        />
        <ContextDatum
          icon={BriefcaseBusiness}
          label="Services"
          value={
            client.activeServices.length > 0
              ? `${client.activeServices.length} active`
              : "No services"
          }
        />
        <ContextDatum
          icon={CalendarDays}
          label="Client since"
          value={formatAdminDate(client.createdAt, true)}
        />
        <ContextDatum
          icon={ShieldCheck}
          label="Workspace"
          value={client.workspaceAvailable ? "Available" : "Not activated"}
        />
      </section>

      <div className="grid gap-10 py-10 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-10">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Contact
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#161616] dark:text-white">
              Business information
            </h2>
            <dl className="mt-5 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
              <DetailRow icon={UserRound} term="Primary contact" value={client.name} />
              <DetailRow icon={Mail} term="Email" value={client.email} href={`mailto:${client.email}`} />
              <DetailRow
                icon={Phone}
                term="Phone"
                value={client.phone || "Not provided"}
                href={client.phone ? `tel:${client.phone}` : undefined}
              />
              <DetailRow term="Record status" value={humanizeAdminValue(client.status)} />
              <DetailRow
                term="Source"
                value={client.sourceLeadId ? "Converted from lead" : "Created directly"}
              />
              <DetailRow
                term="Last movement"
                value={formatAdminDate(client.lastActivityAt, true)}
              />
            </dl>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Contracted scope
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#161616] dark:text-white">
              Active services
            </h2>
            {client.activeServices.length === 0 ? (
              <div className="mt-5 border border-slate-200 p-6 dark:border-white/10">
                <p className="font-semibold text-[#161616] dark:text-white">No services assigned</p>
                <p className="mt-2 text-sm text-slate-500">
                  Add the contracted service from Manage before opening delivery work.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
                {client.activeServices.map((service) => (
                  <div key={service} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold text-[#161616] dark:text-white">{service}</p>
                      <p className="mt-1 text-sm text-slate-500">Client service track</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.13em] text-[#0f62fe]">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="border border-[#393939] bg-[#161616] p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">
              Next action
            </p>
            <h2 className="mt-4 text-xl font-semibold">
              {client.nextAction || "No pending task"}
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {client.nextAction
                ? client.nextActionOwnerRole === "client"
                  ? "Waiting on the client"
                  : "Waiting on Altaira"
                : "There is no task requiring action for this client."}
            </p>
            {client.nextActionDueAt && (
              <p className="mt-6 border-t border-white/15 pt-4 text-sm text-white/65">
                Due {formatAdminDate(client.nextActionDueAt, true)}
              </p>
            )}
            <Link
              href={`/admin/tasks?client=${client.id}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#78a9ff]"
            >
              Open client tasks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="border border-slate-200 p-6 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Workspace view
            </p>
            <h2 className="mt-3 font-semibold text-[#161616] dark:text-white">
              Admin view active
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Client preview will use the same workspace with client visibility rules and a persistent
              preview banner.
            </p>
            <Link
              href={`/clients/${client.id}/preview`}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-[#0f62fe] hover:text-[#0f62fe] dark:border-white/20 dark:text-white/70"
            >
              <ExternalLink className="h-4 w-4" />
              Preview as client
            </Link>
          </section>
        </aside>
      </div>
    </>
  )
}

function ContextDatum({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className="border-slate-200 py-6 md:border-r md:px-6 md:first:pl-0 md:[&:nth-child(2)]:border-r-0 xl:[&:nth-child(2)]:border-r xl:last:border-r-0 dark:border-white/10">
      <Icon className="h-5 w-5 text-[#0f62fe]" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 font-semibold text-[#161616] dark:text-white">{value}</p>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  term,
  value,
  href,
}: {
  icon?: typeof UserRound
  term: string
  value: string
  href?: string
}) {
  const content = href ? (
    <a href={href} className="break-all font-medium text-[#0f62fe] hover:underline">
      {value}
    </a>
  ) : (
    <span className="break-all font-medium text-slate-800 dark:text-white/80">{value}</span>
  )

  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <dt className="flex items-center gap-2 text-sm text-slate-500">
        {Icon && <Icon className="h-4 w-4" />}
        {term}
      </dt>
      <dd className="text-sm">{content}</dd>
    </div>
  )
}

function StateLabel({ state }: { state: string }) {
  const attention = ["blocked", "needs_attention"].includes(state)

  return (
    <span
      className={`border px-2 py-1 text-xs font-medium ${
        attention
          ? "border-[#8a3ffc] text-[#6929c4] dark:text-[#be95ff]"
          : "border-slate-300 text-slate-600 dark:border-white/15 dark:text-white/60"
      }`}
    >
      {humanizeAdminValue(state)}
    </span>
  )
}
