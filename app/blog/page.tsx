import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { blogPosts } from "@/lib/public-site-data"

export const metadata = {
  title: "Blog | Altaira Labs",
  description: "Practical notes about lead flow, booking systems, client management and operational software for SMEs.",
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <section className="border-b border-slate-200 px-5 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">Blog</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">Practical operations notes</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Short articles around lead management, booking workflows, CRM basics and practical automation for small businesses.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {blogPosts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={`group border border-slate-200 bg-black transition hover:border-violet-500 ${
                index === 0 ? "md:col-span-2 md:grid md:grid-cols-2" : ""
              }`}
            >
              {index === 0 && (
                <div className="relative min-h-64 overflow-hidden bg-white">
                  <Image
                    src={post.imageSrc}
                    alt={post.imageAlt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>
              )}
              <article className="p-7">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-violet-500" />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{post.category}</p>
                <h2 className="mt-4 text-2xl font-semibold leading-snug text-white">{post.title}</h2>
                <p className="mt-4 text-sm leading-6 text-slate-300">{post.excerpt}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-violet-200">
                  Read article
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </article>
              {index !== 0 && (
                <div className="relative min-h-52 overflow-hidden bg-white">
                  <Image
                    src={post.imageSrc}
                    alt={post.imageAlt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
