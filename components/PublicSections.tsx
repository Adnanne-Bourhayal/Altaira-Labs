import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { blogPosts, businessSectors } from "@/lib/public-site-data"

export function IndustriesSection() {
  return (
    <section id="sectors" className="border-t border-slate-200 bg-white py-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Built for local businesses and small SMEs</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Focused on Belgium and the Benelux, with a practical approach for local businesses and growing SMEs.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {businessSectors.map((sector) => (
            <Link
              key={sector.slug}
              href={`/business/${sector.slug}`}
              className="group relative min-h-[380px] overflow-hidden border border-slate-800/20 bg-[#11141d] text-white transition hover:border-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              <Image
                src={sector.imageSrc}
                alt={sector.imageAlt}
                fill
                className="object-cover opacity-75 transition duration-700 group-hover:scale-105 group-hover:opacity-0"
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 transition duration-500 group-hover:bg-[#11141d]" />
              <div className="relative z-10 flex min-h-[380px] flex-col p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">{sector.slug.slice(0, 2)}</div>
                <div className="mt-auto">
                  <h3 className="text-2xl font-semibold leading-tight text-white transition duration-300 group-hover:-translate-y-2">
                    {sector.title}
                  </h3>
                  <div className="grid max-h-0 gap-5 overflow-hidden opacity-0 transition-all duration-500 group-hover:mt-5 group-hover:max-h-72 group-hover:opacity-100">
                    <p className="text-sm leading-7 text-slate-300">{sector.summary}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{sector.primaryService}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-200">
                      Open sector
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutSection() {
  return (
    <section id="about" className="border-t border-slate-200 bg-white py-24 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <article className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">About Altaira Labs</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Practical technology for businesses that still run too much work by hand.
          </h2>
          <div className="mt-8 space-y-6 text-lg leading-9 text-slate-700">
            <p>
              Altaira Labs is built for local businesses and small SMEs that still manage daily work through WhatsApp,
              Excel, phone calls, scattered emails and manual follow-up. Digital transformation should not be reserved
              for large companies with large budgets.
            </p>
            <p>
              We build practical technology systems for SMEs that want more control, less manual work and a clearer way
              to manage clients, services and daily operations: professional websites, booking systems, management
              dashboards, workflow automation and CRM / lead management systems.
            </p>
            <p>
              The focus is Belgium and the Benelux, with Spain as a secondary market because of language and SME
              digitalisation opportunity. The ambition is simple: help small businesses reduce operational friction,
              understand their workflow and adopt technology they can actually use.
            </p>
          </div>
          <Link
            href="/contact"
            className="mt-10 inline-flex items-center gap-2 border border-slate-950 bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Talk to Altaira Labs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>

        <div className="relative min-h-[520px] overflow-hidden border border-slate-200 bg-slate-50">
          <Image
            src="/site-images/home-about-altaira-labs-workshop.jpg"
            alt="Altaira Labs team workshop for small business digital transformation"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 42vw, 100vw"
          />
        </div>
      </div>
    </section>
  )
}

export function BlogPreviewSection() {
  return (
    <section id="blog-preview" className="border-t border-slate-200 bg-white py-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">Blog</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Operational notes for local SMEs</h2>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-2 border border-slate-950 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white">
            View blog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6">
          {blogPosts.slice(0, 2).map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group grid overflow-hidden border border-slate-200 bg-black transition hover:border-violet-500 md:grid-cols-2"
            >
              <div className={`relative min-h-64 overflow-hidden bg-white ${index % 2 === 1 ? "md:order-2" : ""}`}>
                <Image
                  src={post.imageSrc}
                  alt={post.imageAlt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
              <article className="p-8">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-violet-500" />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{post.category}</p>
                <h3 className="mt-4 text-2xl font-semibold leading-snug text-white">{post.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-400">{post.excerpt}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-violet-200">
                  Read article
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
