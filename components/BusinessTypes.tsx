"use client"

import { useState } from "react"
import { Car, Scissors, Bike, UtensilsCrossed, Stethoscope, ArrowRight } from "lucide-react"

const businessTypes = [
  {
    icon: Car,
    title: "Car Dealers",
    description: "Showcase inventory and capture leads automatically",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Scissors,
    title: "Hair Salons",
    description: "Online booking and automated reminders",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Bike,
    title: "Bike Shops",
    description: "Product catalog and service scheduling",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants",
    description: "Digital menu and table reservations",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Stethoscope,
    title: "Clinics",
    description: "Patient booking and communication",
    color: "from-purple-500 to-violet-500",
  },
]

export default function BusinessTypes() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const handleSeeExample = () => {
    document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="businesses" className="py-24 bg-[#0A0A0A] relative">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Built for your business
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Tailored solutions for every industry
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
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
                  className={`relative h-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 transition-all duration-300 ${
                    isHovered ? "border-white/20 bg-white/[0.05] -translate-y-1" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${business.color} flex items-center justify-center mb-4 transition-transform duration-300 ${
                      isHovered ? "scale-110" : ""
                    }`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2">{business.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{business.description}</p>

                  {/* CTA */}
                  <div className="flex items-center space-x-1 text-blue-400 text-sm font-medium">
                    <span>See Example</span>
                    <ArrowRight className={`w-4 h-4 transition-transform ${isHovered ? "translate-x-1" : ""}`} />
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
