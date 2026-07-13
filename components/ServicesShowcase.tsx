"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { publicServices } from "@/lib/public-site-data"

export default function ServicesShowcase() {
  const [activeSlug, setActiveSlug] = useState(publicServices[0]?.slug ?? "")
  const activeService = publicServices.find((service) => service.slug === activeSlug) ?? publicServices[0]

  if (!activeService) {
    return null
  }

  return (
    <section id="services" className="border-t border-slate-200 bg-white py-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Services</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Technology systems for daily operations</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Launch services for SMEs that need a clear website, booking flow, dashboard, automation or client
            management system before moving into larger integrations.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-2 border border-slate-200 bg-[#11141d] p-2">
          {publicServices.map((service) => (
            <button
              key={service.slug}
              type="button"
              onMouseEnter={() => setActiveSlug(service.slug)}
              onFocus={() => setActiveSlug(service.slug)}
              onClick={() => setActiveSlug(service.slug)}
              className={`px-5 py-3 text-sm font-semibold transition ${
                activeService.slug === service.slug
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {service.navLabel}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-10 border border-slate-200 bg-[#11141d] p-5 text-white lg:grid-cols-[1fr_0.9fr] lg:p-8">
          <div className="relative overflow-hidden border border-blue-400/20 bg-black">
            <Image
              src={activeService.imageSrc}
              alt={activeService.imageAlt}
              fill
              className="object-cover opacity-55 transition duration-500"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={activeService.slug === publicServices[0]?.slug}
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,8,16,0.88),rgba(5,8,16,0.42)),radial-gradient(circle_at_75%_60%,rgba(124,58,237,0.35),transparent_34%)]" />
            <div className="relative flex min-h-[430px] flex-col justify-between p-8">
              <div className="flex items-center justify-between">
                <span className="border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
                  {activeService.category}
                </span>
                <span className="text-xs text-slate-400">{activeService.imageLabel}</span>
              </div>
              <div className="flex flex-1 items-center justify-center" aria-hidden="true" />
              <div className="grid gap-3 sm:grid-cols-3">
                {activeService.benefits.slice(0, 3).map((benefit) => (
                  <div key={benefit} className="border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <article className="flex flex-col justify-center py-4 lg:py-0">
            <h3 className="text-4xl font-semibold tracking-tight md:text-5xl">{activeService.title}</h3>
            <p className="mt-5 text-lg leading-8 text-slate-300">{activeService.valueProposition}</p>

            <div className="mt-8 grid gap-4">
              {activeService.deliverables.map((deliverable) => (
                <div key={deliverable} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                  {deliverable}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={`/services/${activeService.slug}`}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-violet-500"
              >
                Open service
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Contact
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
