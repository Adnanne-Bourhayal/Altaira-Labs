"use client"

import { Check, Zap } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "300",
    description: "Perfect to get started",
    features: [
      "One-page website",
      "Responsive design",
      "Contact form",
      "Fast delivery",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "500",
    description: "For growing businesses",
    features: [
      "Multi-page website",
      "WhatsApp integration",
      "Basic SEO",
      "Google Analytics",
      "3 revisions",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "900",
    description: "Complete solution",
    features: [
      "Advanced website",
      "Booking system",
      "Email automation",
      "Dashboard",
      "Priority support",
    ],
    popular: false,
  },
]

export default function Pricing() {
  const handleSelectPlan = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="pricing" className="py-28 bg-[#050810] relative">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-3xl rounded-full" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            Simple pricing
          </h2>
          <p className="text-lg text-white/40">
            No hidden fees. One-time payment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${plan.popular ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center space-x-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/30">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div
                className={`h-full rounded-2xl p-7 transition-all duration-300 ${
                  plan.popular
                    ? "bg-blue-500/10 border-2 border-blue-500/30"
                    : "bg-white/[0.02] border border-white/[0.06] hover:border-white/10"
                }`}
              >
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-white/40 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-white/40 text-sm">from</span>
                    <span className="text-4xl font-bold text-white ml-2">{plan.price}</span>
                    <span className="text-white/40 ml-1">EUR</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-7">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-blue-400" />
                      </div>
                      <span className="text-white/60 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleSelectPlan}
                  className={`w-full py-3 rounded-full font-semibold transition-all duration-300 ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                      : "bg-white/[0.05] hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-white/30 text-sm">
            All prices include VAT. One-time payment, no subscriptions.
          </p>
        </div>
      </div>
    </section>
  )
}
