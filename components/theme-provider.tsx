"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { Moon, Sun } from "lucide-react"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = props.defaultTheme
    ? { theme: props.defaultTheme, setTheme: () => {} }
    : { theme: undefined, setTheme: () => {} }

  // After mounting, we can show the theme toggle
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (typeof setTheme === "function") {
      setTheme(theme === "dark" ? "light" : "dark")
    }
  }

  return (
    <NextThemesProvider {...props}>
      {children}
      {mounted && (
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-6 w-6 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="h-6 w-6 transition-transform duration-300 hover:rotate-12" />
          )}
        </button>
      )}
    </NextThemesProvider>
  )
}

