"use client"

import { useState } from "react"
import { ArrowRight, Clock, TrendingUp, Zap, Target } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { blogArticles } from "@/lib/blog-data"

const articleIcons = {
  "how-to-get-clients-online": TrendingUp,
  "automation-saves-time": Zap,
  "website-converts-visitors": Target,
}

const articleGradients = {
  "how-to-get-clients-online": {
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconBg: "bg-blue-500/15 group-hover:bg-blue-500/25",
  },
  "automation-saves-time": {
    gradient: "from-amber-500/20 to-orange-500/20",
    iconBg: "bg-amber-500/15 group-hover:bg-amber-500/25",
  },
  "website-converts-visitors": {
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-emerald-500/15 group-hover:bg-emerald-500/25",
  },
}

export default function Insights() {
  const { t, language } = useLanguage()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <section id="insights" className="py-28 bg-[#050810] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-3xl rounded-full -translate-y-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            {t.insights.title}
          </h2>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            {t.insights.subtitle}
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {blogArticles.map((article) => {
            const IconComponent = articleIcons[article.slug as keyof typeof articleIcons] || TrendingUp
            const styles = articleGradients[article.slug as keyof typeof articleGradients] || articleGradients["how-to-get-clients-online"]
            const isHovered = hoveredCard === article.slug
            const translation = article.translations[language] || article.translations.en

            return (
              <Link
                key={article.slug}
                href={`/insights/${article.slug}`}
                onMouseEnter={() => setHoveredCard(article.slug)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group text-left"
              >
                <div
                  className={`relative h-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 transition-all duration-500 overflow-hidden hover:border-white/15 ${
                    isHovered ? "scale-[1.02] shadow-xl bg-white/[0.04]" : ""
                  }`}
                >
                  {/* Gradient overlay */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} transition-opacity duration-500 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <div className="relative z-10">
                    {/* Category & Read time */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${styles.iconBg} px-3 py-1.5 rounded-full transition-all duration-300`}>
                        <span className="text-xs font-medium text-white/80">{article.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{article.readTime} {t.insights.minRead}</span>
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center mb-4 transition-all duration-500 ${
                        isHovered ? "scale-110" : ""
                      }`}
                    >
                      <IconComponent className={`w-6 h-6 transition-colors duration-300 ${
                        isHovered ? "text-white" : "text-white/60"
                      }`} />
                    </div>

                    {/* Title */}
                    <h3 className={`text-lg font-semibold mb-3 leading-snug transition-colors duration-300 ${
                      isHovered ? "text-white" : "text-white/90"
                    }`}>
                      {translation.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-white/40 text-sm mb-4 line-clamp-2">
                      {translation.excerpt}
                    </p>

                    {/* Read more link */}
                    <div className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-300 ${
                      isHovered ? "text-white translate-x-1" : "text-white/40"
                    }`}>
                      <span>{t.insights.readMore}</span>
                      <ArrowRight className={`w-4 h-4 transition-all duration-300 ${
                        isHovered ? "translate-x-1" : ""
                      }`} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
