import Header from "@/components/Header"
import Footer from "@/components/Footer"
import SavingsCalculator from "@/components/SavingsCalculator"

export const metadata = {
  title: "Savings Calculator | Altaira Labs",
  description: "Estimate operational savings from better lead, booking, CRM and dashboard workflows.",
}

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <div className="border-b border-slate-200 pt-32">
        <div className="mx-auto max-w-7xl px-5 pb-8 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Calculator</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">Operational savings estimate</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            A practical estimate for time saved, lead recovery and annual value. The result is a planning reference, not a guarantee.
          </p>
        </div>
      </div>
      <SavingsCalculator />
      <Footer />
    </main>
  )
}
