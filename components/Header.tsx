"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDown, Globe2, Menu, X } from "lucide-react"
import { businessSectors, publicServices } from "@/lib/public-site-data"
import Logo from "./Logo"

const languages = ["ES", "FR", "NL", "EN"]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [language, setLanguage] = useState("EN")

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-blue-400/20 bg-[#050814]/95 text-white shadow-[0_1px_0_rgba(96,165,250,0.18)] backdrop-blur-xl">
      <div className="h-px w-full bg-blue-600" />
      <nav className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Altaira Labs home" onClick={closeMenu}>
            <Logo />
          </Link>

          <div className="ml-auto hidden items-center gap-1 lg:flex">
            <div className="group relative">
              <button type="button" className="flex items-center gap-1 px-4 py-7 text-sm font-medium text-slate-200 transition hover:text-blue-100">
                Services
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute right-0 top-full w-72 border-t-2 border-violet-500 bg-white text-slate-950 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {publicServices.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="block border-b border-slate-100 px-6 py-4 text-sm transition hover:bg-blue-50"
                  >
                    <span className="block font-semibold">{service.navLabel}</span>
                    <span className="mt-1 block text-xs text-slate-500">{service.category}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="group relative">
              <button type="button" className="flex items-center gap-1 px-4 py-7 text-sm font-medium text-slate-200 transition hover:text-blue-100">
                Business
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute right-0 top-full w-72 border-t-2 border-violet-500 bg-white text-slate-950 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {businessSectors.map((sector) => (
                  <Link
                    key={sector.slug}
                    href={`/business/${sector.slug}`}
                    className="block border-b border-slate-100 px-6 py-4 text-sm transition hover:bg-blue-50"
                  >
                    <span className="block font-semibold">{sector.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{sector.summary}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/#about" className="px-4 py-3 text-sm font-medium text-slate-200 transition hover:text-blue-100">
              About
            </Link>
            <Link href="/calculator" className="px-4 py-3 text-sm font-medium text-slate-200 transition hover:text-blue-100">
              Calculator
            </Link>
            <Link href="/blog" className="px-4 py-3 text-sm font-medium text-slate-200 transition hover:text-blue-100">
              Blog
            </Link>

            <div className="ml-2 flex items-center gap-2 border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
              <Globe2 className="h-4 w-4" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="bg-transparent text-sm font-medium text-slate-100 outline-none"
                aria-label="Language"
              >
                {languages.map((item) => (
                  <option key={item} value={item} className="bg-slate-950 text-white">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <Link href="/contact" className="ml-2 border border-blue-400 bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-violet-500">
              Contact
            </Link>
            <Link href="/client/login" className="border border-violet-300/35 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500/15">
              Client Area
            </Link>
          </div>

          <button
            className="ml-auto border border-white/15 p-2 text-slate-100 transition-colors hover:bg-white/10 lg:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-white/10 py-4 lg:hidden">
            <div className="grid gap-5">
              <div>
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Services</p>
                <div className="mt-2 grid gap-1">
                  {publicServices.map((service) => (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      onClick={closeMenu}
                      className="border border-white/10 px-3 py-3 text-sm text-slate-200"
                    >
                      {service.navLabel}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Business</p>
                <div className="mt-2 grid gap-1">
                  {businessSectors.map((sector) => (
                    <Link
                      key={sector.slug}
                      href={`/business/${sector.slug}`}
                      onClick={closeMenu}
                      className="border border-white/10 px-3 py-3 text-sm text-slate-200"
                    >
                      {sector.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-1">
                <Link href="/#about" onClick={closeMenu} className="border border-white/10 px-3 py-3 text-sm text-slate-200">
                  About
                </Link>
                <Link href="/calculator" onClick={closeMenu} className="border border-white/10 px-3 py-3 text-sm text-slate-200">
                  Calculator
                </Link>
                <Link href="/blog" onClick={closeMenu} className="border border-white/10 px-3 py-3 text-sm text-slate-200">
                  Blog
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {languages.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLanguage(item)}
                    className={`border px-3 py-2 text-sm font-medium ${
                      language === item ? "border-white bg-white text-black" : "border-white/10 text-slate-300"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/contact" onClick={closeMenu} className="border border-white bg-white px-5 py-3 text-center text-sm font-semibold text-black">
                  Contact
                </Link>
                <Link href="/client/login" onClick={closeMenu} className="border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white">
                  Client Area
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
