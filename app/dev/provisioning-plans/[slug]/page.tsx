import Link from "next/link"
import { notFound } from "next/navigation"
import { ProvisioningPlanPanel } from "@/components/admin/ProvisioningPlanPanel"
import { getProvisioningDemoFixture, provisioningDemoFixtures } from "@/lib/provisioning-demo-fixtures"
import { provisioningTrackLabel } from "@/lib/provisioning-plan"

export const dynamic = "force-dynamic"

export default async function ProvisioningDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound()
  const { slug } = await params
  const fixture = getProvisioningDemoFixture(slug)
  if (!fixture) notFound()

  return (
    <main className="min-h-screen bg-[#f4f4f4] p-4 text-[#161616] dark:bg-[#161616] dark:text-[#f4f4f4] lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5 bg-[#090b16] p-5 text-white">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-[#78a9ff] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#78a9ff]">Local fixture</span>
                <span className="text-xs text-white/45">No database · No provider APIs</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold">{fixture.name}</h1>
              <p className="mt-2 text-sm text-white/65">{fixture.sector} · {fixture.expectedTracks.map(provisioningTrackLabel).join(" · ")}</p>
            </div>
            <Link href="/dev/provisioning-plans" className="inline-flex h-10 items-center justify-center border border-white/25 px-4 text-sm font-semibold hover:bg-white/10">All demos</Link>
          </div>
        </header>

        <nav aria-label="Provisioning demos" className="mb-5 flex flex-wrap border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626]">
          {provisioningDemoFixtures.map((item) => (
            <Link key={item.slug} href={`/dev/provisioning-plans/${item.slug}`} className={`border-r border-[#c6c6c6] px-4 py-3 text-sm font-semibold dark:border-[#525252] ${item.slug === fixture.slug ? "bg-[#0f62fe] text-white" : "hover:bg-[#e8e8e8] dark:hover:bg-[#393939]"}`}>{item.name}</Link>
          ))}
        </nav>

        <ProvisioningPlanPanel leadId={fixture.plan.leadId} assessmentId={fixture.plan.assessmentId} previewPlan={fixture.plan} />
      </div>
    </main>
  )
}
