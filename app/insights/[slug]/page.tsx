"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, Calendar, User, Share2, Linkedin, Twitter } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getArticleBySlug, blogArticles } from "@/lib/blog-data"
import Logo from "@/components/Logo"
import Link from "next/link"

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage()
  const slug = params.slug as string
  
  const article = getArticleBySlug(slug)
  
  if (!article) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Article Not Found</h1>
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const translation = article.translations[language] || article.translations.en
  const categoryColors: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-400",
    amber: "bg-amber-500/15 text-amber-400",
    emerald: "bg-emerald-500/15 text-emerald-400",
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = translation.title
    
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank")
    } else if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  // Render markdown-like content
  const renderContent = (content: string[]) => {
    return content.map((line, index) => {
      if (line.startsWith("# ")) {
        return null // Skip h1, we show it separately
      } else if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-bold text-white mt-12 mb-4">
            {line.replace("## ", "")}
          </h2>
        )
      } else if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={index} className="text-lg font-semibold text-white/90 mt-6 mb-2">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      } else if (line.startsWith("- ")) {
        return (
          <li key={index} className="text-white/70 ml-6 mb-2 list-disc">
            {line.replace("- ", "")}
          </li>
        )
      } else if (line.startsWith("**") && line.includes(":**")) {
        const [bold, rest] = line.split(":**")
        return (
          <p key={index} className="text-white/70 leading-relaxed mb-3">
            <strong className="text-white/90">{bold.replace("**", "")}:</strong>
            {rest?.replace(/\*\*/g, "")}
          </p>
        )
      } else if (line.trim() === "") {
        return <div key={index} className="h-4" />
      } else {
        return (
          <p key={index} className="text-white/70 leading-relaxed mb-4 text-lg">
            {line}
          </p>
        )
      }
    })
  }

  // Get related articles (exclude current)
  const relatedArticles = blogArticles
    .filter((a) => a.slug !== slug)
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-[#050810]">
      {/* Simple Header */}
      <header className="fixed top-0 w-full z-50 bg-[#050810]/95 backdrop-blur-2xl border-b border-white/[0.06]">
        <nav className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <Link href="/">
              <Logo />
            </Link>
            <button
              onClick={() => router.push("/#insights")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Insights
            </button>
          </div>
        </nav>
      </header>

      {/* Article Content */}
      <main className="pt-32 pb-20">
        <article className="container mx-auto px-6 lg:px-8 max-w-3xl">
          {/* Article Header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${categoryColors[article.categoryColor]}`}>
                {article.category}
              </span>
              <div className="flex items-center gap-4 text-white/40 text-sm">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {article.readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.publishedDate).toLocaleDateString(language, { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {translation.title}
            </h1>

            <p className="text-xl text-white/50 leading-relaxed mb-8">
              {translation.excerpt}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{article.author}</p>
                  <p className="text-white/40 text-xs">Digital Growth Agency</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare("twitter")}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={() => handleShare("linkedin")}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          </header>

          {/* Article Body */}
          <div className="prose prose-invert max-w-none">
            {renderContent(translation.content)}
          </div>

          {/* CTA Section */}
          <div className="mt-16 p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Ready to Grow Your Business?</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Get a free consultation and discover how we can help you get more clients online.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full text-white font-semibold hover:scale-105 transition-transform"
            >
              Get Free Proposal
            </Link>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-20">
              <h3 className="text-xl font-bold text-white mb-6">Related Articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedArticles.map((related) => {
                  const relatedTranslation = related.translations[language] || related.translations.en
                  return (
                    <Link
                      key={related.slug}
                      href={`/insights/${related.slug}`}
                      className="group p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
                    >
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${categoryColors[related.categoryColor]}`}>
                        {related.category}
                      </span>
                      <h4 className="text-white font-semibold group-hover:text-blue-400 transition-colors line-clamp-2">
                        {relatedTranslation.title}
                      </h4>
                      <p className="text-white/40 text-sm mt-2 line-clamp-2">
                        {relatedTranslation.excerpt}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </article>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Altaira Labs. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
