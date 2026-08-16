import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { blogPosts, getBlogPostBySlug } from "@/lib/public-site-data"

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: BlogArticlePageProps) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return {}
  }

  return {
    title: `${post.title} | Altaira Labs`,
    description: post.excerpt,
  }
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <article className="px-5 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">{post.category}</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl">{post.title}</h1>
          <p className="mt-5 text-base text-slate-500">{post.readTime}</p>

          <div className="relative mt-10 aspect-[16/7] overflow-hidden border border-slate-200 bg-white">
            <Image
              src={post.imageSrc}
              alt={post.imageAlt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 896px, 100vw"
              priority
            />
          </div>

          <div className="mt-12 border border-slate-200 bg-black p-8 text-white">
            <div className="h-1 w-14 bg-gradient-to-r from-blue-500 to-violet-500" />
            <div className="mt-8 grid gap-8 text-base leading-8 text-slate-300">
              <p>{post.excerpt}</p>
              <p>
                A useful digital system starts with a clear operational problem. For small businesses, this usually means a lead
                arrives through a public channel, someone reviews it manually, and the context is then scattered across messages,
                notes or spreadsheets.
              </p>
              <p>
                Altaira Labs keeps the first version focused: capture the request, store it reliably, let the admin review it,
                connect it to a client and assign the relevant service. That structure is simple enough to demo and concrete
                enough to support real business execution.
              </p>
            </div>
          </div>
        </div>
      </article>

      <section className="px-5 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl border border-slate-200 bg-slate-50 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Next step</p>
          <h2 className="mt-3 text-2xl font-semibold">Use this article as a starting point.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            If this describes a current problem in your business, send the context through the contact page.
          </p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Go to contact
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  )
}
