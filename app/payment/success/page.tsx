import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function PaymentSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#090b16] p-6 text-white">
      <section className="w-full max-w-xl border border-white/15 bg-[#11131f] p-8">
        <CheckCircle2 className="h-8 w-8 text-[#78a9ff]" />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78a9ff]">Altaira Labs</p>
        <h1 className="mt-2 text-3xl font-semibold">Payment received</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          We are confirming the payment securely. Your workspace invitation will arrive by email once activation is complete.
        </p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center bg-[#0f62fe] px-5 text-sm font-semibold">Return to Altaira Labs</Link>
      </section>
    </main>
  )
}
