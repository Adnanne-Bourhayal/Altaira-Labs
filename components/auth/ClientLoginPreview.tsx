"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, HelpCircle, Mail } from "lucide-react"
import Logo from "@/components/Logo"

type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
}

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
        auto_select?: boolean
        cancel_on_tap_outside?: boolean
      }) => void
      renderButton: (parent: HTMLElement, options: {
        theme?: "outline" | "filled_blue" | "filled_black"
        size?: "large" | "medium" | "small"
        text?: "signin_with" | "signup_with" | "continue_with" | "signin"
        shape?: "rectangular" | "pill" | "circle" | "square"
        width?: number | string
      }) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityServices
  }
}

export default function ClientLoginPreview() {
  const router = useRouter()
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    let active = true

    fetch("/api/client/auth/me", { cache: "no-store" })
      .then((response) => {
        if (active && response.ok) {
          router.replace("/client/dashboard")
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [router])

  const handleGoogleCredential = useCallback(async (credentialResponse: GoogleCredentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Google did not return a sign-in credential.")
      return
    }

    setGoogleLoading(true)
    setError("")

    try {
      const response = await fetch("/api/client/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      const data = await response.json().catch(() => ({ error: "Could not sign in with Google" }))

      if (!response.ok) {
        throw new Error(data?.error || "Google account is not invited to a client workspace")
      }

      router.replace("/client/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in with Google")
    } finally {
      setGoogleLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return
    }

    let cancelled = false

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) {
        return
      }

      googleButtonRef.current.innerHTML = ""
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: googleButtonRef.current.offsetWidth || 384,
      })
      setGoogleReady(true)
    }

    const existingScript = document.getElementById("google-identity-services")
    if (window.google) {
      renderGoogleButton()
    } else if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton, { once: true })
    } else {
      const script = document.createElement("script")
      script.id = "google-identity-services"
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = renderGoogleButton
      script.onerror = () => {
        if (!cancelled) {
          setError("Google sign-in could not be loaded.")
        }
      }
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      existingScript?.removeEventListener("load", renderGoogleButton)
    }
  }, [googleClientId, handleGoogleCredential])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/client/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json().catch(() => ({ error: "Could not sign in" }))

      if (!response.ok) {
        throw new Error(data?.error || "Invalid client credentials")
      }

      router.replace("/client/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid client credentials")
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
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Access your private workspace.</h1>

            <form onSubmit={handleLogin} className="mt-10 grid gap-4" aria-label="Client area login">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  placeholder="client@example.com"
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
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
                  placeholder="Password"
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
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
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>

              {googleClientId ? (
                <div className="grid gap-2">
                  <div
                    ref={googleButtonRef}
                    className={googleLoading ? "pointer-events-none opacity-60" : ""}
                    aria-label="Continue with Google"
                  />
                  <p id="client-google-login-note" className="text-xs leading-5 text-slate-500">
                    Google access is restricted to invited client emails with an active workspace.
                  </p>
                  {!googleReady && (
                    <p className="text-xs leading-5 text-slate-400">Loading Google sign-in...</p>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center gap-3 border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500"
                    aria-describedby="client-google-login-note"
                  >
                    <span className="grid h-5 w-5 place-items-center border border-slate-300 bg-white text-xs font-bold text-slate-900">G</span>
                    Continue with Google
                  </button>
                  <p id="client-google-login-note" className="text-xs leading-5 text-slate-500">
                    Google login needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID` before it can be enabled.
                  </p>
                </>
              )}
            </form>

            <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <Link href="/client/activate" className="inline-flex items-center gap-2 hover:text-blue-700">
                <Mail className="h-4 w-4" />
                Invitation received?
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 hover:text-blue-700">
                <HelpCircle className="h-4 w-4" />
                Need help?
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
              Access your dashboard, services, onboarding notes and project updates from a private client workspace.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
