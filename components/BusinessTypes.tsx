"use client"

import { useState } from "react"
import { Car, Scissors, Bike, UtensilsCrossed, Stethoscope, ArrowRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function BusinessTypes() {
  const { t } = useLanguage()
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const businessTypes = [
    {
      icon: Car,
      title: t.businesses.carDealers,
      description: t.businesses.carDealersDesc,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconBg: "bg-blue-500/10 group-hover:bg-blue-500/25",
      borderHover: "hover:border-blue-500/40",
      glowColor: "bg-blue-500/15",
    },
    {
      icon: Scissors,
      title: t.businesses.hairSalons,
      description: t.businesses.hairSalonsDesc,
      gradient: "from-pink-500/20 to-rose-500/20",
      iconBg: "bg-pink-500/10 group-hover:bg-pink-500/25",
      borderHover: "hover:border-pink-500/40",
      glowColor: "bg-pink-500/15",
    },
    {
      icon: Bike,
      title: t.businesses.bikeShops,
      description: t.businesses.bikeShopsDesc,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconBg: "bg-emerald-500/10 group-hover:bg-emerald-500/25",
      borderHover: "hover:border-emerald-500/40",
      glowColor: "bg-emerald-500/15",
    },
    {
      icon: UtensilsCrossed,
      title: t.businesses.restaurants,
      description: t.businesses.restaurantsDesc,
      gradient: "from-orange-500/20 to-amber-500/20",
      iconBg: "bg-orange-500/10 group-hover:bg-orange-500/25",
      borderHover: "hover:border-orange-500/40",
      glowColor: "bg-orange-500/15",
    },
    {
      icon: Stethoscope,
      title: t.businesses.clinics,
      description: t.businesses.clinicsDesc,
      gradient: "from-sky-500/20 to-blue-500/20",
      iconBg: "bg-sky-500/10 group-hover:bg-sky-500/25",
      borderHover: "hover:border-sky-500/40",
      glowColor: "bg-sky-500/15",
    },
  ]

  const handleSeeExample = () => {
    document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="businesses" className="py-28 bg-[#050810] relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-3xl rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            {t.businesses.title}
          </h2>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            {t.businesses.subtitle}
          </p>
        </div>

        {/* Cards Grid - Enhanced */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {businessTypes.map((business, index) => {
            const IconComponent = business.icon
            const isHovered = hoveredCard === index

            return (
              <button
                key={index}
                onClick={handleSeeExample}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative text-left transition-all duration-500 ${isHovered ? "scale-105 z-10" : "scale-100"}`}
              >
                {/* Glow effect behind card */}
                <div 
                  className={`absolute -inset-2 rounded-3xl blur-xl transition-opacity duration-500 ${business.glowColor} ${isHovered ? "opacity-100" : "opacity-0"}`}
                />
                
                <div
                  className={`relative h-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 transition-all duration-500 overflow-hidden ${business.borderHover} ${
                    isHovered ? "bg-white/[0.04] border-opacity-100 shadow-2xl" : ""
                  }`}
                >
                  {/* Gradient overlay on hover */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${business.gradient} transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}`} 
                  />

                  {/* Animated particles/dots */}
                  {isHovered && (
                    <>
                      <div className="absolute top-3 right-3 w-1 h-1 bg-white/30 rounded-full animate-pulse" />
                      <div className="absolute bottom-4 right-6 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse delay-150" />
                      <div className="absolute top-1/2 right-4 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse delay-300" />
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon with enhanced animation */}
                    <div
                      className={`w-12 h-12 rounded-xl ${business.iconBg} flex items-center justify-center mb-4 transition-all duration-500 ${
                        isHovered ? "scale-110 rotate-3" : ""
                      }`}
                    >
                      <IconComponent 
                        className={`w-5 h-5 transition-all duration-500 ${
                          isHovered ? "text-white scale-110" : "text-white/70"
                        }`} 
                      />
                    </div>

                    {/* Title */}
                    <h3 
                      className={`text-base font-semibold mb-1.5 transition-colors duration-300 ${
                        isHovered ? "text-white" : "text-white/90"
                      }`}
                    >
                      {business.title}
                    </h3>
                    
                    {/* Description */}
                    <p 
                      className={`text-sm leading-relaxed mb-3 transition-colors duration-300 ${
                        isHovered ? "text-white/70" : "text-white/40"
                      }`}
                    >
                      {business.description}
                    </p>

                    {/* CTA with slide animation */}
                    <div 
                      className={`flex items-center space-x-1 text-sm font-medium transition-all duration-300 ${
                        isHovered ? "text-white translate-x-1" : "text-white/30"
                      }`}
                    >
                      <span>{t.businesses.seeExample}</span>
                      <ArrowRight 
                        className={`w-3.5 h-3.5 transition-all duration-300 ${
                          isHovered ? "translate-x-1 opacity-100" : "opacity-50"
                        }`} 
                      />
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
