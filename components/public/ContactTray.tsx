"use client"

import type React from "react"
import { useState } from "react"
import { Mail, MessageSquare, Send } from "lucide-react"

type ContactTrayProps = {
  title?: string
  description?: string
  contextLabel?: string
  leadIndustry?: string
  serviceInterest?: string
  defaultMessage?: string
  compact?: boolean
  dark?: boolean
  showEmailLink?: boolean
  showWhatsApp?: boolean
}

type ContactFormState = {
  name: string
  business: string
  email: string
  phone: string
  message: string
  website: string
}

type LeadSubmissionResponse = {
  emailNotificationSent?: boolean
  emailNotificationMessage?: string
  message?: string
  error?: string
  fields?: Record<string, string>
}

const initialForm: ContactFormState = {
  name: "",
  business: "",
  email: "",
  phone: "",
  message: "",
  website: "",
}

const contactEmail = "altairalabs@gmail.com"
const whatsappNumber = "34694908262"

export default function ContactTray({
  title = "Contact Altaira Labs",
  description = "Send the context once and we will review the best next step manually.",
  contextLabel = "General contact",
  leadIndustry,
  serviceInterest,
  defaultMessage = "Hi Altaira Labs, I want to discuss an operational system for my business.",
  compact = false,
  dark = false,
  showEmailLink = true,
  showWhatsApp = false,
}: ContactTrayProps) {
  const [form, setForm] = useState<ContactFormState>({ ...initialForm, message: defaultMessage })
  const [status, setStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const updateField = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setStatus("")
  }

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus("")

    if (form.website.trim()) {
      setStatus("Sent.")
      setForm({ ...initialForm, message: defaultMessage })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.name.trim(),
          businessName: form.business.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          industry: leadIndustry || contextLabel,
          serviceInterest: serviceInterest || contextLabel,
          goals: form.message.trim(),
          website: form.website,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as LeadSubmissionResponse

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not send the request.")
      }

      if (data.emailNotificationSent === false) {
        setStatus(`Sent. Your request was stored. ${data.emailNotificationMessage || "Email notification needs configuration."}`)
      } else {
        setStatus("Sent. We will review it and contact you.")
      }
      setForm({ ...initialForm, message: defaultMessage })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send the request.")
    } finally {
      setSubmitting(false)
    }
  }

  const mailHref = `mailto:${contactEmail}?subject=${encodeURIComponent(contextLabel)}&body=${encodeURIComponent(form.message || defaultMessage)}`
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(form.message || defaultMessage)}`
  const frameClass = dark
    ? "border-white/15 bg-black/70 text-white"
    : "border-slate-200 bg-white text-slate-950"
  const inputClass = dark
    ? "border-white/15 bg-white/10 text-white placeholder:text-slate-400 focus:border-white"
    : "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-950"

  return (
    <section className={`border p-5 sm:p-6 ${frameClass}`}>
      <div className={compact ? "grid gap-5 lg:grid-cols-[0.8fr_1.2fr]" : "grid gap-7 lg:grid-cols-[0.85fr_1.15fr]"}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? "text-slate-300" : "text-slate-500"}`}>
            {contextLabel}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className={`mt-4 text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>{description}</p>

          {(showEmailLink || showWhatsApp) && (
            <div className="mt-6 grid gap-3">
              {showEmailLink && (
                <a
                  href={mailHref}
                  className={`flex items-center gap-3 border px-4 py-3 text-sm font-medium ${
                    dark ? "border-white/15 hover:bg-white/10" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email with prepared message
                </a>
              )}
              {showWhatsApp && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 border px-4 py-3 text-sm font-medium ${
                    dark ? "border-white/15 hover:bg-white/10" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp with prepared message
                </a>
              )}
            </div>
          )}
        </div>

        <form onSubmit={submitForm} className="grid gap-3" aria-busy={submitting}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              required
              placeholder="Name"
              className={`border px-4 py-3 text-sm outline-none ${inputClass}`}
            />
            <input
              name="business"
              value={form.business}
              onChange={updateField}
              required
              placeholder="Business"
              className={`border px-4 py-3 text-sm outline-none ${inputClass}`}
            />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
              placeholder="Email"
              className={`border px-4 py-3 text-sm outline-none ${inputClass}`}
            />
            <input
              name="phone"
              value={form.phone}
              onChange={updateField}
              placeholder="Phone"
              className={`border px-4 py-3 text-sm outline-none ${inputClass}`}
            />
          </div>
          <textarea
            name="message"
            value={form.message}
            onChange={updateField}
            required
            rows={compact ? 4 : 5}
            className={`border px-4 py-3 text-sm outline-none ${inputClass}`}
          />
          <input
            name="website"
            value={form.website}
            onChange={updateField}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {status && <p className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{status}</p>}

          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center gap-2 border px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
              dark ? "border-white bg-white text-black hover:bg-slate-200" : "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
            }`}
          >
            <Send className="h-4 w-4" />
            {submitting ? "Sending..." : "Send request"}
          </button>
        </form>
      </div>
    </section>
  )
}
