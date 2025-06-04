"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Brain, Menu, X, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import GlassmorphismButton from "@/components/glassmorphism-button"

export default function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll events for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Determine if navbar should be visible based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      // Determine if navbar should have scrolled styles
      if (currentScrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out",
        isScrolled ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b shadow-sm py-2" : "bg-transparent py-4",
        isVisible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span
            className={cn(
              "font-bold text-xl transition-colors duration-300",
              isScrolled ? "text-slate-900 dark:text-white" : theme === "dark" ? "text-white" : "text-white",
            )}
          >
            Altaira Labs
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="/" label="Home" isScrolled={isScrolled} theme={theme} />
          <NavLink href="/our-solutions" label="Our Solutions" isScrolled={isScrolled} theme={theme} />
          <NavLink href="#featured-services" label="Services" isScrolled={isScrolled} theme={theme} />
          <NavLink href="#contact" label="Contact" isScrolled={isScrolled} theme={theme} />
        </nav>

        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={cn(
                "rounded-full transition-colors duration-300 hover:scale-105",
                !isScrolled && theme !== "dark" && "text-white hover:bg-white/20",
                "relative overflow-hidden",
              )}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="sr-only">{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</span>
              {theme === "dark" ? (
                <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
              )}
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100"></span>
            </Button>
          )}

          <GlassmorphismButton
            href="#contact"
            variant={isScrolled ? "primary" : "outline"}
            size="sm"
            className={cn(
              "hidden md:flex transition-all duration-300 hover:scale-105",
              !isScrolled && theme !== "dark" && "text-white border-white hover:bg-white/20",
            )}
          >
            Get Started
          </GlassmorphismButton>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden transition-colors",
              !isScrolled && theme !== "dark" && "text-white hover:bg-white/20",
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "fixed inset-0 top-16 bg-white dark:bg-slate-900 z-40 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="flex flex-col p-6 space-y-6">
          <MobileNavLink href="/" label="Home" onClick={() => setIsMobileMenuOpen(false)} />
          <MobileNavLink href="/our-solutions" label="Our Solutions" onClick={() => setIsMobileMenuOpen(false)} />
          <MobileNavLink href="#featured-services" label="Services" onClick={() => setIsMobileMenuOpen(false)} />
          <MobileNavLink href="#contact" label="Contact" onClick={() => setIsMobileMenuOpen(false)} />

          <GlassmorphismButton
            href="#contact"
            variant="primary"
            className="w-full mt-4"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get Started
          </GlassmorphismButton>
        </nav>
      </div>
    </header>
  )
}

function NavLink({
  href,
  label,
  isScrolled,
  theme,
}: {
  href: string
  label: string
  isScrolled: boolean
  theme?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium relative transition-colors duration-300 hover:text-blue-600 dark:hover:text-blue-400",
        "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 dark:after:bg-blue-400",
        "after:transition-all after:duration-300 hover:after:w-full",
        isScrolled ? "text-slate-900 dark:text-white" : theme === "dark" ? "text-white" : "text-white",
      )}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      className="text-lg font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      onClick={onClick}
    >
      {label}
    </Link>
  )
}

