"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"
import { LeadAssessmentFields } from "@/components/admin/LeadAssessmentFields"
import { AdminShell } from "@/components/admin/AdminShell"
import {
  LEAD_FORM_DEFINITIONS,
  leadFormDefinition,
  serviceLabel,
  type LeadFormKey,
} from "@/lib/lead-intake"
import { cn } from "@/lib/utils"

type IntakeResult = {
  lead: {
    id: string
    fullName: string
    businessName: string
    status: string
  }
  assessment: {
    recommendedServiceKeys: string[]
    qualificationSummary: string
  }
}

export function AdminLeadIntake() {
  const router = useRouter()
  const [stage, setStage] = useState<"select" | "form" | "success">("select")
  const [formKey, setFormKey] = useState<LeadFormKey>("general")
  const [contact, setContact] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    industry: "",
    goals: "",
  })
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<IntakeResult | null>(null)

  const definition = useMemo(() => leadFormDefinition(formKey)!, [formKey])

  const chooseForm = (key: LeadFormKey) => {
    setFormKey(key)
    setResponses({})
    setError("")
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch("/api/internal/leads/admin-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          formKey,
          schemaVersion: 2,
          responses,
        }),
      })
      const data = await response.json().catch(() => ({ error: "Unexpected intake service response" }))
      if (response.status === 401) {
        router.replace("/admin/login")
        return
      }
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not create lead intake")
      }
      setResult(data)
      setStage("success")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create lead intake")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminShell>
      <main className="px-4 py-10 md:px-8 md:py-12 xl:px-12">
        <div className="mx-auto max-w-[1180px]">
          <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-[#525252] hover:text-[#0f62fe] dark:text-[#c6c6c6]">
            <ArrowLeft className="h-4 w-4" />
            Lead inbox
          </Link>

          <header className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">Lead intake</p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              {stage === "select" ? "Choose the right intake" : stage === "form" ? definition.title : "Intake recorded"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
              {stage === "select"
                ? "Start broad only when the business is unsure. Otherwise collect the information needed by the selected service."
                : stage === "form"
                  ? definition.summary
                  : "The lead and its structured assessment now exist as real records."}
            </p>
          </header>

          {stage === "select" && (
            <>
              <section className="mt-9 grid border-l border-t border-[#c6c6c6] dark:border-[#525252] md:grid-cols-2 xl:grid-cols-3">
                {LEAD_FORM_DEFINITIONS.map((item) => {
                  const selected = item.key === formKey
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => chooseForm(item.key)}
                      className={cn(
                        "min-h-[190px] border-b border-r border-[#c6c6c6] p-6 text-left transition dark:border-[#525252]",
                        selected
                          ? "bg-[#090b16] text-white"
                          : "bg-white hover:bg-[#f4f4f4] dark:bg-[#262626] dark:hover:bg-[#393939]"
                      )}
                    >
                      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", selected ? "text-blue-300" : "text-[#0f62fe]")}>
                        {item.key === "general" ? "Diagnostic" : "Service"}
                      </p>
                      <h2 className="mt-5 text-lg font-semibold">{item.shortTitle}</h2>
                      <p className={cn("mt-3 text-sm leading-6", selected ? "text-white/60" : "text-[#6f6f6f] dark:text-[#a8a8a8]")}>
                        {item.summary}
                      </p>
                    </button>
                  )
                })}
              </section>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStage("form")}
                  className="inline-flex h-11 items-center gap-2 bg-[#0f62fe] px-5 text-sm font-semibold text-white hover:bg-[#0353e9]"
                >
                  Continue with {definition.shortTitle}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {stage === "form" && (
            <form onSubmit={submit} className="mt-9 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <section className="border border-[#c6c6c6] bg-white p-6 dark:border-[#525252] dark:bg-[#262626]">
                <SectionHeading eyebrow="Contact" title="Business identity" />
                <div className="mt-6 space-y-5">
                  <InputField label="Full name" required value={contact.fullName} onChange={(value) => setContact({ ...contact, fullName: value })} />
                  <InputField label="Business name" required value={contact.businessName} onChange={(value) => setContact({ ...contact, businessName: value })} />
                  <InputField label="Email" type="email" required value={contact.email} onChange={(value) => setContact({ ...contact, email: value })} />
                  <InputField label="Phone" value={contact.phone} onChange={(value) => setContact({ ...contact, phone: value })} />
                  <InputField label="Sector / industry" value={contact.industry} onChange={(value) => setContact({ ...contact, industry: value })} />
                  <label className="block">
                    <FieldLabel label="Initial goals or context" />
                    <textarea
                      rows={4}
                      value={contact.goals}
                      onChange={(event) => setContact({ ...contact, goals: event.target.value })}
                      className={inputClass}
                    />
                  </label>
                </div>
              </section>

              <section className="border border-[#c6c6c6] bg-white p-6 dark:border-[#525252] dark:bg-[#262626]">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e0e0e0] pb-6 dark:border-[#393939] sm:flex-row sm:items-start">
                  <SectionHeading eyebrow="Assessment" title={definition.shortTitle} />
                  <button
                    type="button"
                    onClick={() => setStage("select")}
                    className="w-fit text-sm font-medium text-[#0f62fe] hover:underline"
                  >
                    Change intake
                  </button>
                </div>

                <div className="mt-6">
                  <LeadAssessmentFields
                    definition={definition}
                    responses={responses}
                    onChange={(key, value) => setResponses((current) => ({ ...current, [key]: value }))}
                  />
                </div>

                {error && (
                  <div role="alert" className="mt-6 border-l-2 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/25 dark:text-red-200">
                    {error}
                  </div>
                )}

                <div className="mt-8 flex flex-col justify-between gap-4 border-t border-[#e0e0e0] pt-6 dark:border-[#393939] sm:flex-row sm:items-center">
                  <p className="max-w-lg text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">
                    Admin-created intakes do not send a public contact notification. No client, workspace or external tool is created at this step.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-[#0f62fe] px-5 text-sm font-semibold text-white hover:bg-[#0353e9] disabled:opacity-50"
                  >
                    <ClipboardList className="h-4 w-4" />
                    {submitting ? "Saving..." : "Save intake"}
                  </button>
                </div>
              </section>
            </form>
          )}

          {stage === "success" && result && (
            <section className="mt-9 border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
              <div className="bg-[#090b16] p-7 text-white">
                <CheckCircle2 className="h-7 w-7 text-blue-300" />
                <h2 className="mt-5 text-2xl font-semibold">{result.lead.businessName}</h2>
                <p className="mt-2 text-sm text-white/55">Lead status: {result.lead.status}</p>
              </div>
              <div className="p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f6f6f]">Rule-based recommendation</p>
                {result.assessment.recommendedServiceKeys.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.assessment.recommendedServiceKeys.map((key) => (
                      <span key={key} className="border border-[#0f62fe] px-3 py-2 text-sm font-medium text-[#0f62fe]">
                        {serviceLabel(key)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-medium">Discovery review required</p>
                )}
                <p className="mt-4 max-w-3xl text-sm leading-6 text-[#525252] dark:text-[#c6c6c6]">
                  {result.assessment.qualificationSummary}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={`/leads/${result.lead.id}`} className="inline-flex h-11 items-center gap-2 bg-[#0f62fe] px-5 text-sm font-semibold text-white">
                    Review lead
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/leads" className="inline-flex h-11 items-center border border-[#c6c6c6] px-5 text-sm font-semibold dark:border-[#525252]">
                    Return to inbox
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </AdminShell>
  )
}

function InputField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  )
}

function FieldLabel({ label, required = false, help }: { label: string; required?: boolean; help?: string }) {
  return (
    <span className="mb-2 block">
      <span className="text-sm font-medium">{label}{required ? " *" : ""}</span>
      {help && <span className="mt-1 block text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{help}</span>}
    </span>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
    </div>
  )
}

const inputClass = "h-11 w-full border border-[#c6c6c6] bg-white px-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
