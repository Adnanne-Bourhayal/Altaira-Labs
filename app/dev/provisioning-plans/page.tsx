import Link from "next/link"
import { notFound } from "next/navigation"
import { provisioningDemoFixtures } from "@/lib/provisioning-demo-fixtures"

export const dynamic = "force-dynamic"

export default function ProvisioningDemoIndexPage() {
  if (process.env.NODE_ENV !== "development") notFound()

  return (
    <main className="min-h-screen bg-[#f4f4f4] p-6 text-[#161616] dark:bg-[#161616] dark:text-[#f4f4f4] lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="border-l-4 border-[#0f62fe] bg-[#090b16] p-6 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#78a9ff]">Local development only</p>
          <h1 className="mt-3 text-3xl font-semibold">Provisioning plan demos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Static fixtures only. No datasource, backend route or provider API is used.</p>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {provisioningDemoFixtures.map((fixture) => (
            <Link key={fixture.slug} href={`/dev/provisioning-plans/${fixture.slug}`} className="border border-[#c6c6c6] bg-white p-5 transition-colors hover:border-[#0f62fe] dark:border-[#525252] dark:bg-[#262626]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f62fe]">{fixture.sector}</p>
              <h2 className="mt-2 text-xl font-semibold">{fixture.name}</h2>
              <p className="mt-3 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">{fixture.expectedTracks.length} isolated tracks</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
