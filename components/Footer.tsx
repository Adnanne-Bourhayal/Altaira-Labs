"use client"

import Logo from "./Logo"
import { Instagram, Linkedin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function Footer() {
  const { t } = useLanguage()
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
              {t.nav.businesses}
            </button>
            <button
              onClick={() => document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              {t.nav.examples}
            </button>
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              {t.nav.pricing}
            </button>
            <button
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              {t.nav.contact}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="https://instagram.com/altairalabs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-300 border border-white/[0.04] hover:border-white/[0.1] hover:scale-110"
            >
              <Instagram className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </a>
            <a
              href="https://linkedin.com/company/altairalabs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-300 border border-white/[0.04] hover:border-white/[0.1] hover:scale-110"
            >
              <Linkedin className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.04] text-center text-sm text-white/20">
          <p>&copy; {currentYear} Altaira Labs. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  )
}
