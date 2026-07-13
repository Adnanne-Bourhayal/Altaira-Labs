import { notFound } from "next/navigation"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { getLegalPageBySlug, legalPages } from "@/lib/legal-pages"

type LegalPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = await params
  const page = getLegalPageBySlug(slug)

  if (!page) {
    return {}
  }

  return {
    title: `${page.title} | Altaira Labs`,
    description: page.description,
  }
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params
  const page = getLegalPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <section className="border-b border-slate-200 px-5 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Legal</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl">{page.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{page.description}</p>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-px border border-slate-200 bg-slate-200">
          {page.sections.map((section) => (
            <article key={section.heading} className="bg-white p-7">
              <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
