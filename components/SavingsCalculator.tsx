"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Clock3, Send, TrendingUp, UsersRound } from "lucide-react"
import { calculateSavingsEstimate } from "@/lib/savings-calculator"

type MiniForm = {
  name: string
  email: string
  phone: string
  company: string
}

type LeadSubmissionResponse = {
  emailNotificationSent?: boolean
  emailNotificationMessage?: string
  message?: string
  error?: string
}

const initialMiniForm: MiniForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
}

export default function SavingsCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(12)
  const [hourlyCost, setHourlyCost] = useState(30)
  const [lostLeadsPerMonth, setLostLeadsPerMonth] = useState(8)
  const [averageClientValue, setAverageClientValue] = useState(180)
  const [improvementPercent, setImprovementPercent] = useState(25)
  const [miniForm, setMiniForm] = useState<MiniForm>(initialMiniForm)
  const [status, setStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const estimate = useMemo(
    () =>
      calculateSavingsEstimate({
        hoursPerWeek,
        hourlyCost,
        lostLeadsPerMonth,
        averageClientValue,
        improvementPercent,
      }),
    [hoursPerWeek, hourlyCost, lostLeadsPerMonth, averageClientValue, improvementPercent],
  )

  const statItems = [
    {
      icon: TrendingUp,
      value: `+${improvementPercent}%`,
      label: "Estimated process improvement",
    },
    {
      icon: Clock3,
      value: `${estimate.savedHoursWeekly.toFixed(1)}h`,
      label: "Saved weekly",
    },
    {
      icon: UsersRound,
      value: `${lostLeadsPerMonth}`,
      label: "Leads to recover monthly",
    },
  ]

  const handleMiniChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setMiniForm((current) => ({ ...current, [name]: value }))
    setStatus("")
  }

  const handleMiniSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: miniForm.name.trim(),
          businessName: miniForm.company.trim(),
          email: miniForm.email.trim(),
          phone: miniForm.phone.trim(),
          industry: "Calculator request",
          serviceInterest: "Operational savings calculator",
          goals: [
            `Estimated weekly saved hours: ${estimate.savedHoursWeekly.toFixed(1)}`,
            `Estimated annual value: ${Math.round(estimate.annualValue).toLocaleString("en-US")} EUR`,
          ].join("\n"),
          website: "",
        }),
      })

      const data = (await response.json().catch(() => ({}))) as LeadSubmissionResponse

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not send the request.")
      }

      if (data.emailNotificationSent === false) {
        setStatus(`Saved. ${data.emailNotificationMessage || "Email notification needs configuration."}`)
      } else {
        setStatus("Sent. We will review your estimate and contact you.")
      }
      setMiniForm(initialMiniForm)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send the request.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="calculator" className="bg-white py-20 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Calculate your operational savings
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Estimate how a better website, booking flow, CRM or dashboard could reduce manual work and recover missed
            client opportunities. This is a planning estimate, not a guaranteed result.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border border-slate-200 bg-white p-6 text-slate-950">
            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Manual hours per week</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={hoursPerWeek}
                  onChange={(event) => setHoursPerWeek(Number(event.target.value))}
                  className="mt-4 w-full accent-violet-500"
                />
                <span className="mt-2 block text-sm text-slate-500">{hoursPerWeek} h/week</span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Internal cost per hour</span>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={hourlyCost}
                  onChange={(event) => setHourlyCost(Number(event.target.value))}
                  className="mt-4 w-full accent-violet-500"
                />
                <span className="mt-2 block text-sm text-slate-500">{hourlyCost} EUR/hour</span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Lost or delayed leads per month</span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={lostLeadsPerMonth}
                  onChange={(event) => setLostLeadsPerMonth(Number(event.target.value))}
                  className="mt-4 w-full accent-violet-500"
                />
                <span className="mt-2 block text-sm text-slate-500">{lostLeadsPerMonth} leads/month</span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Average value per client</span>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="10"
                  value={averageClientValue}
                  onChange={(event) => setAverageClientValue(Number(event.target.value))}
                  className="mt-4 w-full accent-violet-500"
                />
                <span className="mt-2 block text-sm text-slate-500">{averageClientValue} EUR/client</span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Estimated improvement</span>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={improvementPercent}
                  onChange={(event) => setImprovementPercent(Number(event.target.value))}
                  className="mt-4 w-full accent-violet-500"
                />
                <span className="mt-2 block text-sm text-slate-500">{improvementPercent}%</span>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 bg-[#11141d] p-6">
            <div className="border border-white/10 bg-black/40 p-6 text-white">
              <p className="text-sm font-semibold text-slate-400">Estimated annual value</p>
              <p className="mt-2 bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
                {Math.round(estimate.annualValue).toLocaleString("en-US")} EUR
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Based on saved hours and recovered client opportunities. This is an estimate, not a guarantee.
              </p>

              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <div className="flex justify-between text-slate-300">
                    <span>Weekly time value</span>
                    <span>{Math.round(estimate.weeklyTimeValue).toLocaleString("en-US")} EUR</span>
                  </div>
                  <div className="mt-2 h-2 bg-white/10">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${Math.min(improvementPercent + 20, 90)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300">
                    <span>Recovered lead value/month</span>
                    <span>{Math.round(estimate.leadValue).toLocaleString("en-US")} EUR</span>
                  </div>
                  <div className="mt-2 h-2 bg-white/10">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${Math.min(improvementPercent + 10, 85)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleMiniSubmit} className="mt-5 border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-center text-sm font-semibold text-white">Receive a free consultation</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  value={miniForm.name}
                  onChange={handleMiniChange}
                  required
                  placeholder="Name"
                  className="border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                />
                <input
                  name="email"
                  type="email"
                  value={miniForm.email}
                  onChange={handleMiniChange}
                  required
                  placeholder="Email"
                  className="border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                />
                <input
                  name="company"
                  value={miniForm.company}
                  onChange={handleMiniChange}
                  required
                  placeholder="Company"
                  className="border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                />
                <input
                  name="phone"
                  value={miniForm.phone}
                  onChange={handleMiniChange}
                  placeholder="Phone"
                  className="border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>

              {status && <p className="mt-3 text-center text-xs text-slate-300">{status}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 flex w-full items-center justify-center gap-2 border border-blue-400 bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-violet-500 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Sending..." : "Contact us"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {statItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center border border-blue-200 bg-blue-50 text-blue-700">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-5xl font-semibold tracking-tight text-transparent">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
