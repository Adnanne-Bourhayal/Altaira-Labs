import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { getServiceBySlug, publicServices } from "@/lib/public-site-data"

type ServicePageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return publicServices.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: ServicePageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) {
    return {}
  }

  return {
    title: `${service.title} | Altaira Labs`,
    description: service.summary,
  }
}

export default async function PublicServicePage({ params }: ServicePageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <section className="border-b border-slate-200 px-5 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">{service.category}</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">{service.title}</h1>
          <div className="mt-8 max-w-4xl border-l-4 border-violet-600 pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Value proposition</p>
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-700">{service.detailIntro}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/contact?service=${service.slug}`} className="inline-flex items-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Contact about this service
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/calculator" className="border border-slate-300 px-5 py-3 text-sm font-semibold hover:border-violet-600 hover:text-violet-700">
              Estimate savings
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="border border-slate-200 bg-black p-8 text-white">
              <div className="h-1 w-14 bg-gradient-to-r from-blue-500 to-violet-500" />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Benefits</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">What improves first</h2>
              <div className="mt-8 grid gap-px border border-white/10 bg-white/10">
              {service.benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 bg-[#11141d] p-5">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                  <span className="text-sm leading-6 text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
            </article>

            <article className="border border-slate-200 bg-white p-8">
              <div className="h-1 w-14 bg-gradient-to-r from-blue-500 to-violet-500" />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Typical deliverables</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">What the business receives</h2>
              <div className="mt-8 grid gap-px border border-slate-200 bg-slate-200">
              {service.deliverables.map((deliverable) => (
                <div key={deliverable} className="bg-white p-5 transition hover:bg-violet-50">
                  <span className="text-sm leading-6 text-slate-700">{deliverable}</span>
                </div>
              ))}
            </div>
            </article>
          </div>

          <div className="mt-10 border border-slate-200 bg-slate-50 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">Next step</p>
            <h2 className="mt-3 text-2xl font-semibold">Discuss this service with the right context.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Use the contact page when you are ready. Mention the service, the current manual process and the first result
              you want to improve.
            </p>
            <Link href={`/contact?service=${service.slug}`} className="mt-6 inline-flex items-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Go to contact
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
