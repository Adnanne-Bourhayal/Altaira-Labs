import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/brand/header_background.png')" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-5 pt-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.75)] sm:text-5xl lg:whitespace-nowrap lg:text-7xl">
            From the revolution to the future
          </h1>

          <p className="mt-5 text-xl font-medium text-slate-200 drop-shadow-[0_4px_18px_rgba(0,0,0,0.8)] sm:text-2xl lg:whitespace-nowrap">
            Save your money, save your business
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-300 drop-shadow-[0_4px_18px_rgba(0,0,0,0.8)]">
            Altaira Labs helps small businesses replace manual work with clear digital systems: websites, booking
            flows, dashboards, automations and client management tools.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-white bg-white px-7 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-slate-200"
            >
              Free Consult
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#services"
              className="inline-flex items-center justify-center border border-white/25 bg-black/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              View services
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
