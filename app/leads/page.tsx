"use client"

import { useEffect, useState } from "react"

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
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/leads`)

        if (!response.ok) {
          throw new Error("Failed to fetch leads")
        }

        const data = await response.json()
        setLeads(data)
      } catch (err) {
        console.error(err)
        setError("Could not load leads.")
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  return (
    <main className="min-h-screen bg-[#050810] text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Leads Dashboard</h1>
          <p className="text-white/40 mt-3">
            View all submitted leads captured from the website.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60">
            Loading leads...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && leads.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No leads yet</h2>
            <p className="text-white/40">
              Once users submit the contact form, they will appear here.
            </p>
          </div>
        )}

        {!loading && !error && leads.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-sm text-white/40 font-medium">
              <div className="col-span-2">Name</div>
              <div className="col-span-2">Business</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Industry</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Created</div>
            </div>

            {leads.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-sm hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-2 font-medium text-white">{lead.fullName}</div>
                <div className="col-span-2 text-white/80">{lead.businessName}</div>
                <div className="col-span-3 text-white/70 break-all">{lead.email}</div>
                <div className="col-span-2 text-white/60">{lead.industry || "-"}</div>
                <div className="col-span-1">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-500/15 text-blue-300 border border-blue-500/20">
                    {lead.status}
                  </span>
                </div>
                <div className="col-span-2 text-white/50">
                  {new Date(lead.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
