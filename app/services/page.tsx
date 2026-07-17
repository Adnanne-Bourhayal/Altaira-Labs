import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { publicServices } from "@/lib/public-site-data"

export const metadata = {
  title: "Services | Altaira Labs",
  description:
    "Practical websites, booking systems, dashboards, workflow automation and CRM systems for local businesses and small SMEs.",
}

export default function PublicServicesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <section className="border-b border-slate-200 px-5 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">Services</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">
            Practical systems for daily business work
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
            Altaira Labs builds clear digital systems for small businesses: websites, booking flows, dashboards,
            automations and client management tools that reduce manual work without making the operation heavier.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4">
          {publicServices.map((service, index) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className={`group grid border border-slate-200 bg-black transition hover:border-violet-500 md:grid-cols-2 ${
                index % 2 === 1 ? "md:[&_.service-image]:order-2" : ""
              }`}
            >
              <div className="service-image relative min-h-72 overflow-hidden bg-white">
                <Image
                  src={service.imageSrc}
                  alt={service.imageAlt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
              <article className="flex min-h-72 flex-col justify-center p-8 md:p-10">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-violet-500" />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{service.category}</p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">{service.title}</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{service.summary}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-violet-200">
                  Open service
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
