import Link from "next/link"
import { ArrowRight, HelpCircle, Mail } from "lucide-react"
import Logo from "@/components/Logo"

export const metadata = {
  title: "Client Area | Altaira Labs",
  description: "Prepared client workspace access page for Altaira Labs customers.",
}

export default function ClientAreaPage() {
  return (
    <main className="min-h-screen bg-[#050814] text-white">
      <section className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-slate-950 sm:px-10">
          <div className="w-full max-w-md">
            <Logo variant="blue" />
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Client Area</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Access your private workspace.</h1>

            <form className="mt-10 grid gap-4" aria-label="Client area preview login">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  placeholder="client@example.com"
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  placeholder="Password"
                  className="border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700"
                />
              </label>

              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <Link href="/contact" className="inline-flex items-center gap-2 hover:text-blue-700">
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
