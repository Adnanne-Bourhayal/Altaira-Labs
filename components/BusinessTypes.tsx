"use client"

import { useState } from "react"
import { Car, Scissors, Bike, UtensilsCrossed, Stethoscope, ArrowRight } from "lucide-react"

const businessTypes = [
  {
    icon: Car,
    title: "Car Dealers",
    description: "Showcase inventory and capture leads",
  },
  {
    icon: Scissors,
    title: "Hair Salons",
    description: "Online booking and reminders",
  },
  {
    icon: Bike,
    title: "Bike Shops",
    description: "Catalog and service scheduling",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants",
    description: "Menu and table reservations",
  },
  {
    icon: Stethoscope,
    title: "Clinics",
    description: "Patient booking system",
  },
]

export default function BusinessTypes() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const handleSeeExample = () => {
    document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="businesses" className="py-28 bg-[#050810] relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-3xl rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            Built for your business
          </h2>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            Tailored solutions for every industry
          </p>
        </div>

        {/* Cards Grid */}
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
                className="group relative text-left"
              >
                <div
                  className={`relative h-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 transition-all duration-300 ${
                    isHovered ? "border-blue-500/30 bg-blue-500/5 -translate-y-1" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 transition-all duration-300 ${
                      isHovered ? "bg-blue-500/20 scale-110" : ""
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 transition-colors duration-300 ${isHovered ? "text-blue-400" : "text-blue-400/70"}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-semibold text-white mb-1.5">{business.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-3">{business.description}</p>

                  {/* CTA */}
                  <div className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-300 ${isHovered ? "text-blue-400" : "text-white/30"}`}>
                    <span>See Example</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isHovered ? "translate-x-0.5" : ""}`} />
                  </div>
                </div>

                {/* Glow effect */}
                {isHovered && (
                  <div className="absolute inset-0 -z-10 bg-blue-500/10 blur-2xl rounded-2xl" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
