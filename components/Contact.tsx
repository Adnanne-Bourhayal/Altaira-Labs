"use client"

import type React from "react"
import { useState } from "react"
import { Send, MessageCircle, Calendar, CheckCircle, ArrowRight, X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

type ContactFormData = {
  name: string
  business: string
  email: string
  website: string
}

type ContactField = "name" | "business" | "email"
type ContactFieldErrors = Partial<Record<ContactField, string>>

type BackendErrorResponse = {
  error?: string
  message?: string
  fields?: Partial<Record<"fullName" | "businessName" | "email", string>>
}

const initialFormData: ContactFormData = {
  name: "",
  business: "",
  email: "",
  website: "",
}

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100
const BUSINESS_MIN_LENGTH = 2
const BUSINESS_MAX_LENGTH = 120
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)
  const [error, setError] = useState("")

  const validateForm = () => {
    const nextErrors: ContactFieldErrors = {}
    const name = formData.name.trim()
    const business = formData.business.trim()
    const email = formData.email.trim()

    if (name.length < NAME_MIN_LENGTH) {
      nextErrors.name = "Enter your full name using at least 2 characters."
    } else if (name.length > NAME_MAX_LENGTH) {
      nextErrors.name = "Full name must be at most 100 characters."
    }

    if (business.length < BUSINESS_MIN_LENGTH) {
      nextErrors.business = "Enter your business name using at least 2 characters."
    } else if (business.length > BUSINESS_MAX_LENGTH) {
      nextErrors.business = "Business name must be at most 120 characters."
    }

    if (!emailPattern.test(email)) {
      nextErrors.email = "Enter a valid email address."
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const inputClassName = (field: ContactField) =>
    `w-full px-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder-white/25 focus:outline-none focus:bg-white/[0.05] transition-all duration-300 disabled:opacity-50 ${
      fieldErrors[field]
        ? "border-red-500/50 focus:border-red-400"
        : "border-white/[0.08] focus:border-blue-500/50"
    }`

  const applyBackendFieldErrors = (fields: BackendErrorResponse["fields"]) => {
    if (!fields) {
      return
    }

    setFieldErrors({
      name: fields.fullName,
      business: fields.businessName,
      email: fields.email,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitted(false)

    if (formData.website.trim()) {
      setIsSubmitted(true)
      setFormData(initialFormData)
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    let timeoutId: number | undefined

    try {
      const controller = new AbortController()
      timeoutId = window.setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.name.trim(),
          businessName: formData.business.trim(),
          email: formData.email.trim(),
          industry: "Website Lead",
          goals: "Interested in growing the business with Altaira Labs",
          website: formData.website,
        }),
        signal: controller.signal,
      })

      const data = await response.json().catch(() => ({} as BackendErrorResponse))

      if (!response.ok) {
        applyBackendFieldErrors(data.fields)
        throw new Error(data.message || data.error || "Could not submit the form. Please try again.")
      }

      setIsSubmitted(true)
      setFieldErrors({})
      setFormData(initialFormData)

      setTimeout(() => {
        setIsSubmitted(false)
      }, 5000)
    } catch (err) {
      console.error(err)
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("The lead service took too long to respond. Please try again in a moment.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Could not submit the form. Please try again.")
      }
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === "name" || name === "business" || name === "email") {
      setFieldErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }))
      setError("")
    }
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi, I want to grow my business with a website")
    window.open(`https://wa.me/34694908262?text=${message}`, "_blank")
  }

  const handleCalendar = () => {
    setShowCalendly(true)
  }

  return (
    <>
      <section id="contact" className="py-28 bg-[#050810] relative">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-3xl rounded-full" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
              {t.contact.title}
            </h2>
            <p className="text-lg text-white/40">
              {t.contact.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 hover:border-white/[0.1] transition-all duration-300">
              {isSubmitted ? (
                <div className="text-center py-12" aria-live="polite">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{t.contact.sent}</h4>
                  <p className="text-white/50">{t.contact.sentMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSubmitting}>
                  <div>
                    <label htmlFor="lead-name" className="block text-white/60 text-sm font-medium mb-2">{t.contact.name}</label>
                    <input
                      id="lead-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      maxLength={NAME_MAX_LENGTH}
                      autoComplete="name"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "lead-name-error" : undefined}
                      className={inputClassName("name")}
                      placeholder={t.contact.namePlaceholder}
                    />
                    {fieldErrors.name && (
                      <p id="lead-name-error" className="mt-2 text-sm text-red-300">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lead-business" className="block text-white/60 text-sm font-medium mb-2">{t.contact.business}</label>
                    <input
                      id="lead-business"
                      type="text"
                      name="business"
                      value={formData.business}
                      onChange={handleChange}
                      required
                      maxLength={BUSINESS_MAX_LENGTH}
                      autoComplete="organization"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.business)}
                      aria-describedby={fieldErrors.business ? "lead-business-error" : undefined}
                      className={inputClassName("business")}
                      placeholder={t.contact.businessPlaceholder}
                    />
                    {fieldErrors.business && (
                      <p id="lead-business-error" className="mt-2 text-sm text-red-300">
                        {fieldErrors.business}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lead-email" className="block text-white/60 text-sm font-medium mb-2">{t.contact.email}</label>
                    <input
                      id="lead-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "lead-email-error" : undefined}
                      className={inputClassName("email")}
                      placeholder={t.contact.emailPlaceholder}
                    />
                    {fieldErrors.email && (
                      <p id="lead-email-error" className="mt-2 text-sm text-red-300">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full relative group py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-white disabled:opacity-50 mt-2 overflow-hidden hover:scale-[1.02]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-[length:200%_100%] group-hover:animate-shimmer" />
                    <span className="absolute inset-0 rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50" />
                    <span className="absolute -inset-1 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <span className="absolute inset-[1px] rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-60" />

                    {isSubmitting ? (
                      <>
                        <div className="relative w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="relative">{t.contact.sending}</span>
                      </>
                    ) : (
                      <>
                        <Send className="relative w-5 h-5" />
                        <span className="relative">{t.contact.send}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={handleWhatsApp}
                className="w-full group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.08] transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 group-hover:scale-110 transition-all duration-300">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{t.contact.whatsapp}</div>
                      <div className="text-white/40 text-sm">{t.contact.whatsappDesc}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={handleCalendar}
                className="w-full group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-blue-500/40 hover:bg-blue-500/[0.08] transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/25 group-hover:scale-110 transition-all duration-300">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{t.contact.schedule}</div>
                      <div className="text-white/40 text-sm">{t.contact.scheduleDesc}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-all duration-300">
                <h4 className="text-white font-semibold mb-3 text-sm">{t.contact.whatYouGet}</h4>
                <ul className="space-y-2">
                  {[
                    t.contact.analysis,
                    t.contact.customDesign,
                    t.contact.detailedQuote,
                    t.contact.estimatedDelivery,
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-2.5 text-white/50 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center mt-10 text-white/30 text-sm">
            <p>altairalabs@gmail.com | +34 694 908 262</p>
          </div>
        </div>
      </section>

      {showCalendly && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCalendly(false)}
          />

          <div className="relative w-full max-w-3xl h-[700px] bg-[#0a0f1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowCalendly(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <iframe
              src="https://calendly.com/altairalabs/30min"
              className="w-full h-full"
              frameBorder="0"
              title="Schedule a call"
            />
          </div>
        </div>
      )}
    </>
  )
}
