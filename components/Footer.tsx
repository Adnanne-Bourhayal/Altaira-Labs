"use client"

import type React from "react"
import Link from "next/link"
import { Linkedin, Send } from "lucide-react"
import { useState } from "react"
import { businessSectors, publicServices } from "@/lib/public-site-data"
import { legalPages } from "@/lib/legal-pages"
import Logo from "./Logo"

const companyLinks = [
  { href: "/#about", label: "About" },
  { href: "/#sectors", label: "Sectors" },
  { href: "/blog", label: "Blog" },
  { href: "/calculator", label: "Calculator" },
  { href: "/contact", label: "Contact" },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Footer consultation request",
          businessName: "Unknown business",
          email: email.trim(),
          industry: "Footer consultation",
          serviceInterest: "Free consultation",
          goals: "Visitor requested a free consultation from the footer email field.",
          website: "",
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        emailNotificationSent?: boolean
        emailNotificationMessage?: string
        message?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not send the request.")
      }

      if (data.emailNotificationSent === false) {
        setMessage(`Saved. ${data.emailNotificationMessage || "Email notification needs configuration."}`)
      } else {
        setMessage("Sent. We will contact you.")
      }
      setEmail("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="border-t border-slate-200 bg-white py-16 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr_0.8fr]">
          <div>
            <Logo size="small" variant="blue" />
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              Altaira Labs helps small businesses replace manual work with clear digital systems: websites, booking
              flows, dashboards, automations and client management tools.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label htmlFor="footer-email" className="text-sm font-semibold text-slate-950">
                Receive a free consultation
              </label>
              <div className="mt-3 flex max-w-md gap-3">
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setMessage("")
                  }}
                  required
                  placeholder="Your email"
                  className="min-w-0 flex-1 border border-slate-300 bg-white px-5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>
              {message && <p className="mt-3 text-sm text-slate-500">{message}</p>}
            </form>

            <div
              aria-label="LinkedIn"
              title="LinkedIn profile coming soon"
              className="mt-8 flex h-11 w-11 items-center justify-center border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Linkedin className="h-5 w-5" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Company</h2>
            <nav className="mt-6 flex flex-col gap-4 text-slate-600">
              {companyLinks.map((link) => (
                <Link key={link.label} href={link.href} className="transition-colors hover:text-slate-950">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Services</h2>
            <nav className="mt-6 flex flex-col gap-4 text-slate-600">
              {publicServices.map((service) => (
                <Link key={service.slug} href={`/services/${service.slug}`} className="transition-colors hover:text-slate-950">
                  {service.navLabel}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Sectors</h2>
            <nav className="mt-6 flex flex-col gap-4 text-slate-600">
              {businessSectors.map((sector) => (
                <Link key={sector.slug} href={`/business/${sector.slug}`} className="transition-colors hover:text-slate-950">
                  {sector.title}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Legal</h2>
            <nav className="mt-6 flex flex-col gap-4 text-slate-600">
              {legalPages.map((page) => (
                <Link key={page.slug} href={`/legal/${page.slug}`} className="transition-colors hover:text-slate-950">
                  {page.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-14 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>&copy; {currentYear} Altaira Labs. Focused on Belgium and the Benelux, with Spain as a secondary market.</p>
        </div>
      </div>
    </footer>
  )
}
