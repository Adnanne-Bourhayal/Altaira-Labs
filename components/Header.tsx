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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
              >
                {item.label}
              </button>
            ))}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1.5 text-white/70 hover:text-white transition-colors text-sm"
              >
                <Globe className="w-4 h-4" />
                <span>{languages.find(l => l.code === currentLang)?.code.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
              </button>

              {isLangOpen && (
                <div className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden min-w-[140px]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang.code)
                        setIsLangOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${
                        currentLang === lang.code ? "text-blue-400" : "text-white/70"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <button
              onClick={handleContactClick}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105"
            >
              Get Free Proposal
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10">
            <div className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-white/70 hover:text-white transition-colors text-left text-sm font-medium"
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile Language */}
              <div className="flex items-center space-x-2 text-white/50 text-sm">
                <Globe className="w-4 h-4" />
                <select
                  value={currentLang}
                  onChange={(e) => setCurrentLang(e.target.value)}
                  className="bg-transparent text-white/70 text-sm focus:outline-none"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-black">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleContactClick}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-full text-sm font-semibold w-fit text-white"
              >
                Get Free Proposal
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
