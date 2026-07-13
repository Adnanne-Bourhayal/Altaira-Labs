import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2, ExternalLink, XCircle } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { businessSectors, getSectorBySlug, getServiceBySlug, type PublicService } from "@/lib/public-site-data"

type BusinessPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return businessSectors.map((sector) => ({ slug: sector.slug }))
}

export async function generateMetadata({ params }: BusinessPageProps) {
  const { slug } = await params
  const sector = getSectorBySlug(slug)

  if (!sector) {
    return {}
  }

  return {
    title: `${sector.title} Systems | Altaira Labs`,
    description: sector.summary,
  }
}

export default async function BusinessSectorPage({ params }: BusinessPageProps) {
  const { slug } = await params
  const sector = getSectorBySlug(slug)

  if (!sector) {
    notFound()
  }

  const recommendedServices = sector.recommendedServices
    .map(getServiceBySlug)
    .filter((service): service is PublicService => Boolean(service))

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <section className="border-b border-slate-200 px-5 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Business sector</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">{sector.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{sector.summary}</p>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">
            Best-fit system: {sector.primaryService}
          </p>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-80 overflow-hidden border border-slate-200 bg-white">
              <Image
                src={sector.imageSrc}
                alt={sector.imageAlt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
            </div>
            <article className="border border-slate-200 bg-black p-8 text-white">
              <div className="h-1 w-14 bg-gradient-to-r from-blue-500 to-violet-500" />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Sector insight</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">{sector.caseTitle}</h2>
              <p className="mt-5 text-base leading-8 text-slate-300">{sector.caseText}</p>
            </article>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="border border-slate-200 bg-slate-50 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Manual operation</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">Where time usually disappears</h2>
              <div className="mt-8 grid gap-px border border-slate-200 bg-slate-200">
                {sector.manualSnapshot.map((item) => (
                  <div key={item} className="flex gap-3 bg-white p-5">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="border border-slate-950 bg-slate-950 p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Digital workflow</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">What the system makes visible</h2>
              <div className="mt-8 grid gap-px border border-white/10 bg-white/10">
                {sector.digitalSnapshot.map((item) => (
                  <div key={item} className="flex gap-3 bg-[#11141d] p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                    <span className="text-sm leading-6 text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="mt-10 border border-slate-200 bg-white p-8">
            <div className="h-1 w-14 bg-gradient-to-r from-blue-500 to-violet-500" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Evidence signals</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">What the market already shows</h2>
            <div className="mt-8 grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-3">
              {sector.evidenceSignals.map((signal) => (
                <div key={`${signal.value}-${signal.label}`} className="bg-white p-6">
                  <p className="bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-3xl font-semibold text-transparent">
                    {signal.value}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{signal.label}</p>
                  {signal.sourceUrl ? (
                    <a
                      href={signal.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 hover:text-blue-700"
                    >
                      {signal.source}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{signal.source}</p>
                  )}
                </div>
              ))}
            </div>
          </article>

          <article className="mt-10 border border-slate-200 bg-slate-50 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Technology context</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">How technology fits this sector</h2>
            <div className="mt-6 grid gap-6 text-base leading-8 text-slate-700 lg:grid-cols-3">
              {sector.technologyContext.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Recommended services</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">Useful starting points for {sector.title}</h2>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              Discuss sector fit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-3">
            {recommendedServices.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`} className="group bg-white p-6 hover:bg-slate-50">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{service.category}</p>
                <h3 className="mt-6 text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{service.summary}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium">
                  Open service
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
