"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Building2, Mail, Briefcase, Calendar, FileText, RefreshCw, AlertCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { LEAD_STATUS_OPTIONS, type LeadStatus, isLeadStatus, statusBadgeClass, statusLabel } from "@/lib/lead-status"

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

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [statusError, setStatusError] = useState("")
  const [statusMessage, setStatusMessage] = useState("")

  const id = params?.id

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError("")
      setStatusError("")

      const response = await fetch(`/api/internal/leads/${id}`, {
        cache: "no-store",
      })

      const data = await response.json().catch(() => ({ error: "Unexpected response from lead service" }))

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to fetch lead")
      }

      setLead(data)
    } catch (err) {
      console.error(err)
      setLoadError(err instanceof Error ? err.message : "Could not load lead details.")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  const updateStatus = async (status: LeadStatus) => {
    if (!isLeadStatus(status)) {
      setStatusError("Invalid status selected.")
      return
    }

    try {
      setUpdating(true)
      setStatusError("")
      setStatusMessage("")

      const response = await fetch(`/api/internal/leads/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const updatedLead = await response.json().catch(() => ({ error: "Unexpected response from lead service" }))

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      if (!response.ok) {
        throw new Error(updatedLead?.message || updatedLead?.error || "Failed to update status")
      }

      setLead(updatedLead as Lead)
      setStatusMessage(`Status updated to ${statusLabel(status)}.`)
    } catch (err) {
      console.error(err)
      setStatusError(err instanceof Error ? err.message : "Could not update lead status.")
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchLead()
    }
  }, [fetchLead, id])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
          Loading lead...
        </div>
      </main>
    )
  }

  if (loadError || !lead) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <Link href="/leads" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to leads
          </Link>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-red-200">Could not load lead</h2>
                  <p className="text-sm text-red-200/80 mt-1">{loadError || "Lead not found."}</p>
                </div>
              </div>
              <button
                onClick={fetchLead}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/leads" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to leads
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{lead.fullName}</h1>
              <p className="text-white/50 mt-2">{lead.businessName}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={`inline-flex px-3 py-1.5 rounded-full text-sm border ${statusBadgeClass(lead.status)}`}>
                {statusLabel(lead.status)}
              </span>

              {LEAD_STATUS_OPTIONS.map((status) => {
                const isActive = lead.status === status.value

                return (
                  <button
                    key={status.value}
                    onClick={() => updateStatus(status.value)}
                    disabled={updating || isActive}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${
                      isActive
                        ? "border-white/10 bg-white/[0.06] text-white/50"
                        : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08]"
                    }`}
                  >
                    {isActive ? "Current" : `Set ${status.label}`}
                  </button>
                )
              })}
            </div>
          </div>

          {(statusError || statusMessage) && (
            <div
              role={statusError ? "alert" : "status"}
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                statusError
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {statusError || statusMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Building2 className="w-4 h-4" />
                Business
              </div>
              <p className="text-white/90">{lead.businessName}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <p className="text-white/90 break-all">{lead.email}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Briefcase className="w-4 h-4" />
                Industry
              </div>
              <p className="text-white/90">{lead.industry || "-"}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
                <Calendar className="w-4 h-4" />
                Created
              </div>
              <p className="text-white/90">{new Date(lead.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-3">
              <FileText className="w-4 h-4" />
              Goals
            </div>
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
              {lead.goals || "-"}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
