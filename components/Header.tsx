"use client"

import { useState, useEffect } from "react"
import { Menu, X, ChevronDown, Globe } from "lucide-react"
import Logo from "./Logo"

const languages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "es", label: "Espanol" },
  { code: "fr", label: "Francais" },
  { code: "de", label: "Deutsch" },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState("en")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "#businesses", label: "Businesses" },
    { href: "#examples", label: "Examples" },
    { href: "#pricing", label: "Pricing" },
    { href: "#contact", label: "Contact" },
  ]

  const handleNavClick = (href: string) => {
    document.getElementById(href.substring(1))?.scrollIntoView({ behavior: "smooth" })
    setIsMenuOpen(false)
  }

  const handleContactClick = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
    setIsMenuOpen(false)
  }

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-[#050810]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/10" 
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo - visually stronger with more emphasis */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Navigation - improved spacing and hover effects */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="relative px-4 py-2 text-white/50 hover:text-white transition-all duration-300 text-sm font-medium group"
              >
                {item.label}
                {/* Subtle underline on hover */}
                <span className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-blue-500/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </button>
            ))}
          </div>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher - cleaner design */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-white/50 hover:text-white/80 transition-all duration-300 text-sm rounded-lg hover:bg-white/[0.04]"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{languages.find(l => l.code === currentLang)?.code.toUpperCase()}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`} />
              </button>

              {isLangOpen && (
                <div className="absolute top-full right-0 mt-2 bg-[#0a0f1a]/98 backdrop-blur-2xl border border-white/[0.08] rounded-xl overflow-hidden min-w-[150px] shadow-2xl shadow-black/40">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang.code)
                        setIsLangOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-all duration-200 hover:bg-white/[0.06] ${
                        currentLang === lang.code 
                          ? "text-blue-400 bg-blue-500/[0.08]" 
                          : "text-white/60 hover:text-white/90"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary CTA - premium gradient button */}
            <button
              onClick={handleContactClick}
              className="relative group px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 overflow-hidden"
            >
              {/* Gradient background */}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-[length:200%_100%] group-hover:animate-shimmer" />
              {/* Glow effect */}
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-blue-500/20 blur-xl" />
              {/* Border gradient overlay */}
              <span className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-50" />
              {/* Text */}
              <span className="relative text-white">Get Free Proposal</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/[0.04] transition-all duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation - improved design */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/[0.06]">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-white/60 hover:text-white hover:bg-white/[0.04] transition-all duration-200 text-left text-sm font-medium py-3 px-3 rounded-lg"
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile Language */}
              <div className="flex items-center gap-2 text-white/50 text-sm py-3 px-3">
                <Globe className="w-4 h-4" />
                <select
                  value={currentLang}
                  onChange={(e) => setCurrentLang(e.target.value)}
                  className="bg-transparent text-white/70 text-sm focus:outline-none font-medium"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#0a1020]">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleContactClick}
                className="mt-2 relative group px-6 py-3 rounded-full text-sm font-semibold w-full overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600" />
                <span className="relative text-white">Get Free Proposal</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
