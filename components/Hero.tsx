"use client"

import { ArrowRight, Play } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function Hero() {
  const { t } = useLanguage()

  const handleViewExamples = () => {
    document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleGetProposal = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/v2_watermarked-10cdfd72-3427-4b83-9013-07e2593a3222-qgEWK6iAdfGsKYX0ifXyluq7pyFhUa.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050810]/80 via-[#050810]/60 to-[#050810]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          {/* Small label */}
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5 mb-8">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-sm font-medium tracking-wide">{t.hero.badge}</span>
          </div>

          {/* Main Heading - Updated messaging */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05] tracking-tight">
            <span className="text-white">{t.hero.title1}</span>
            <br />
            <span className="text-gradient">{t.hero.title2}</span>
          </h1>

          {/* Subtitle - Updated for growth/leads messaging */}
          <p className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons - Enhanced with glow */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetProposal}
              className="group relative px-10 py-4 rounded-full text-white font-semibold transition-all duration-300 flex items-center space-x-2 hover:scale-105 text-lg overflow-hidden"
            >
              {/* Gradient background */}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-[length:200%_100%] group-hover:animate-shimmer" />
              {/* Glow effect */}
              <span className="absolute inset-0 rounded-full shadow-xl shadow-blue-500/40 group-hover:shadow-blue-500/60" />
              <span className="absolute -inset-1 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              {/* Top highlight */}
              <span className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white/15 to-transparent opacity-60" />
              {/* Content */}
              <span className="relative">{t.hero.cta}</span>
              <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleViewExamples}
              className="group px-10 py-4 bg-white/5 border border-white/20 hover:border-white/40 rounded-full text-white font-semibold transition-all duration-300 flex items-center space-x-2 hover:bg-white/10 text-lg hover:shadow-lg hover:shadow-white/5"
            >
              <Play className="w-5 h-5" />
              <span>{t.hero.viewExamples}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050810] to-transparent z-10" />
    </section>
  )
}
