"use client"

import { useState } from "react"
import { ArrowRight, Clock, TrendingUp, Zap, Target } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const articles = [
  {
    id: 1,
    icon: TrendingUp,
    category: "Growth",
    titleKey: "seo" as const,
    readTime: 5,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconBg: "bg-blue-500/15 group-hover:bg-blue-500/25",
  },
  {
    id: 2,
    icon: Zap,
    category: "Automation",
    titleKey: "automation" as const,
    readTime: 4,
    gradient: "from-amber-500/20 to-orange-500/20",
    iconBg: "bg-amber-500/15 group-hover:bg-amber-500/25",
  },
  {
    id: 3,
    icon: Target,
    category: "Leads",
    titleKey: "leads" as const,
    readTime: 6,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-emerald-500/15 group-hover:bg-emerald-500/25",
  },
]

// Article titles by language
const articleTitles: Record<string, Record<string, string>> = {
  en: {
    seo: "5 Ways to Rank Higher on Google in 2024",
    automation: "How Automation Saves 10+ Hours Per Week",
    leads: "Turn Website Visitors into Paying Customers",
  },
  es: {
    seo: "5 Formas de Posicionarte en Google en 2024",
    automation: "Como la Automatizacion Ahorra 10+ Horas por Semana",
    leads: "Convierte Visitantes Web en Clientes",
  },
  nl: {
    seo: "5 Manieren om Hoger te Ranken in Google in 2024",
    automation: "Hoe Automatisering 10+ Uur per Week Bespaart",
    leads: "Verander Website Bezoekers in Betalende Klanten",
  },
  fr: {
    seo: "5 Facons de Mieux Ranker sur Google en 2024",
    automation: "Comment l'Automatisation Economise 10+ Heures par Semaine",
    leads: "Transformez les Visiteurs en Clients Payants",
  },
  de: {
    seo: "5 Wege um 2024 bei Google höher zu ranken",
    automation: "Wie Automatisierung 10+ Stunden pro Woche spart",
    leads: "Verwandeln Sie Website-Besucher in Kunden",
  },
}

export default function Insights() {
  const { t, language } = useLanguage()
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const handleReadMore = () => {
    // Could link to individual blog posts
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
  }

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
          {articles.map((article) => {
            const IconComponent = article.icon
            const isHovered = hoveredCard === article.id

            return (
              <button
                key={article.id}
                onClick={handleReadMore}
                onMouseEnter={() => setHoveredCard(article.id)}
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
                    className={`absolute inset-0 bg-gradient-to-br ${article.gradient} transition-opacity duration-500 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <div className="relative z-10">
                    {/* Category & Read time */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${article.iconBg} px-3 py-1.5 rounded-full transition-all duration-300`}>
                        <span className="text-xs font-medium text-white/80">{article.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{article.readTime} {t.insights.minRead}</span>
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl ${article.iconBg} flex items-center justify-center mb-4 transition-all duration-500 ${
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
                      {articleTitles[language]?.[article.titleKey] || articleTitles.en[article.titleKey]}
                    </h3>

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
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
