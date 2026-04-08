"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, Building2, Mail, Briefcase, Calendar, FileText } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

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
  const [error, setError] = useState("")

  const id = params?.id

  const fetchLead = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/internal/leads/${id}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch lead")
      }

      const data = await response.json()
      setLead(data)
    } catch (err) {
      console.error(err)
      setError("Could not load lead details.")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      setUpdating(true)
      setError("")

      const response = await fetch(`/api/internal/leads/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const updatedLead = await response.json()
      setLead(updatedLead)
    } catch (err) {
      console.error(err)
      setError("Could not update lead status.")
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchLead()
    }
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">Loading lead...</div>
      </main>
    )
  }

  if (error || !lead) {
    return (
      <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <Link href="/leads" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to leads
          </Link>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error || "Lead not found."}
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
              <span className="inline-flex px-3 py-1.5 rounded-full text-sm bg-blue-500/15 text-blue-300 border border-blue-500/20">
                {lead.status}
              </span>

              <button
                onClick={() => updateStatus("contacted")}
                disabled={updating}
                className="px-3 py-1.5 text-xs rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 disabled:opacity-50"
              >
                Mark contacted
              </button>

              <button
                onClick={() => updateStatus("closed")}
                disabled={updating}
                className="px-3 py-1.5 text-xs rounded-lg border border-green-500/20 bg-green-500/10 text-green-300 hover:bg-green-500/20 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>

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
