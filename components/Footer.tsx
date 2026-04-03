"use client"

import Logo from "./Logo"
import { Instagram, Linkedin } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-10 bg-[#030508] border-t border-white/[0.04]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <Logo size="small" />

          <div className="flex items-center space-x-8 text-sm">
            <button
              onClick={() => document.getElementById("businesses")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              Businesses
            </button>
            <button
              onClick={() => document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              Examples
            </button>
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              Contact
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="https://instagram.com/altairalabs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center transition-colors border border-white/[0.04]"
            >
              <Instagram className="w-4 h-4 text-white/40" />
            </a>
            <a
              href="https://linkedin.com/company/altairalabs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center transition-colors border border-white/[0.04]"
            >
              <Linkedin className="w-4 h-4 text-white/40" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.04] text-center text-sm text-white/20">
          <p>&copy; {currentYear} Altaira Labs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
