"use client"

import { ArrowRight, Play } from "lucide-react"

export default function Hero() {
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
        {/* Dark overlay with navy tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050810]/80 via-[#050810]/60 to-[#050810]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          {/* Small label */}
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5 mb-8">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-sm font-medium tracking-wide">Websites, booking systems & automation</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05] tracking-tight">
            <span className="text-white">Get more clients.</span>
            <br />
            <span className="text-gradient">Automatically.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            We build websites and smart systems that help your business grow 24/7.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetProposal}
              className="group relative px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-semibold transition-all duration-300 flex items-center space-x-2 shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105 text-lg"
            >
              <span>Get Free Proposal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleViewExamples}
              className="group px-10 py-4 bg-white/5 border border-white/20 hover:border-white/40 rounded-full text-white font-semibold transition-all duration-300 flex items-center space-x-2 hover:bg-white/10 text-lg"
            >
              <Play className="w-5 h-5" />
              <span>View Examples</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050810] to-transparent z-10" />
    </section>
  )
}
