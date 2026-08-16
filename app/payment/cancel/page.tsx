import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PaymentCancelPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#090b16] p-6 text-white">
      <section className="w-full max-w-xl border border-white/15 bg-[#11131f] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78a9ff]">Altaira Labs</p>
        <h1 className="mt-2 text-3xl font-semibold">Payment not completed</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          No client workspace was activated. You can reopen the secure payment link or contact Altaira Labs for help.
        </p>
        <Link href="/contact" className="mt-7 inline-flex h-11 items-center gap-2 border border-white/25 px-5 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Contact Altaira Labs</Link>
      </section>
    </main>
  )
}
