"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react"
import Logo from "@/components/Logo"

export default function AdminLoginPanel() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (active && response.ok) {
          router.replace("/leads")
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [router])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json().catch(() => ({ error: "Could not sign in" }))

      if (!response.ok) {
        throw new Error(data?.error || "Invalid credentials")
      }

      router.replace("/leads")
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050814] text-white">
      <section className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-slate-950 sm:px-10">
          <div className="w-full max-w-md">
            <Logo variant="blue" />
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Admin Access</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Internal workspace login.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              This area is restricted to Altaira Labs operators who manage leads, clients, services and internal notes.
            </p>

            <form onSubmit={handleLogin} className="mt-10 grid gap-4" aria-label="Admin login">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Username or email</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={loading}
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
                  placeholder="Internal username"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error && (
                <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in securely"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 grid gap-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-700" />
                Backend-verified session with HTTP-only cookie.
              </div>
              <Link href="/" className="inline-flex items-center gap-2 hover:text-blue-700">
                <LockKeyhole className="h-4 w-4" />
                Return to public website
              </Link>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-screen items-center justify-center overflow-hidden lg:flex">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
            style={{ backgroundImage: "url('/brand/header_background.png')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[#020617]/60" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl px-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Altaira Workspace</p>
            <h2 className="mt-5 text-5xl font-semibold tracking-tight">Lead, client and service management.</h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300">
              Review new requests, convert qualified leads and keep the operational flow under control.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
