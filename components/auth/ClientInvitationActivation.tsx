"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react"
import Logo from "@/components/Logo"

export default function ClientInvitationActivation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token") || "", [searchParams])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const activateInvitation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!token) {
      setError("Invitation token is missing. Open the link from your invitation email.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/client/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await response.json().catch(() => ({ error: "Could not activate invitation" }))

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Could not activate invitation")
      }

      setSuccess("Workspace activated. Redirecting...")
      router.replace("/client/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not activate invitation.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050814] text-white">
      <section className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-slate-950 sm:px-10">
          <div className="w-full max-w-md">
            <Logo variant="blue" />
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Client Area</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Activate your workspace.</h1>

            {!token && (
              <div className="mt-8 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This page needs a secure invitation token. Open it from the invitation email or ask Altaira Labs for a new link.
              </div>
            )}

            <form onSubmit={activateInvitation} className="mt-10 grid gap-4" aria-label="Client invitation activation">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading || !token}
                  placeholder="Create a secure password"
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading || !token}
                  placeholder="Repeat password"
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {error && (
                <div role="alert" className="flex gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div role="status" className="flex gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="mt-2 inline-flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Activating..." : "Activate workspace"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-sm text-slate-600">
              Already activated?{" "}
              <Link href="/client/login" className="font-semibold text-blue-700 hover:text-blue-900">
                Sign in
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
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl px-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Private workspace</p>
            <h2 className="mt-5 text-5xl font-semibold tracking-tight">Your business system, always in one place.</h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300">
              Activate your account, complete onboarding and access the modules assigned to your business.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
