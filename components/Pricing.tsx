"use client"

import { Check, Zap, Star, TrendingUp } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function Pricing() {
  const { t } = useLanguage()

  const plans = [
    {
      name: t.pricing.starter,
      price: "299",
      description: t.pricing.starterDesc,
      features: [
        t.pricing.onePage,
        t.pricing.responsive,
        t.pricing.contactForm,
        t.pricing.fastDelivery,
      ],
      popular: false,
      badge: null,
      icon: null,
    },
    {
      name: t.pricing.growth,
      price: "499",
      description: t.pricing.growthDesc,
      features: [
        t.pricing.multiPage,
        t.pricing.whatsapp,
        t.pricing.basicSeo,
        t.pricing.analytics,
        t.pricing.revisions,
      ],
      popular: true,
      badge: t.pricing.bestValue,
      icon: Star,
    },
    {
      name: t.pricing.pro,
      price: "899",
      description: t.pricing.proDesc,
      features: [
        t.pricing.advanced,
        t.pricing.booking,
        t.pricing.emailAuto,
        t.pricing.dashboard,
        t.pricing.prioritySupport,
      ],
      popular: false,
      badge: null,
      icon: TrendingUp,
    },
  ]

  const handleSelectPlan = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="pricing" className="py-28 bg-[#050810] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/3 blur-3xl rounded-full" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-white/40">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${plan.popular ? "md:-mt-6 md:mb-6" : ""}`}
            >
              {/* Badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                  <div className="relative">
                    {/* Glow behind badge */}
                    <div className="absolute inset-0 bg-blue-500/50 blur-lg rounded-full" />
                    <div className="relative flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/30">
                      <Zap className="w-4 h-4" />
                      <span>{plan.badge}</span>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`h-full rounded-2xl p-7 transition-all duration-500 ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-500/15 to-blue-500/5 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10"
                    : "bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]"
                } group-hover:scale-[1.02] group-hover:shadow-xl`}
              >
                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.icon && !plan.popular && (
                      <plan.icon className="w-5 h-5 text-white/40" />
                    )}
                    <h3 className={`text-xl font-bold ${plan.popular ? "text-white" : "text-white/90"}`}>
                      {plan.name}
                    </h3>
                  </div>
                  <p className={`text-sm ${plan.popular ? "text-white/60" : "text-white/40"}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Price - Enhanced with "from" psychology */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-sm ${plan.popular ? "text-white/50" : "text-white/40"}`}>
                      {t.pricing.from}
                    </span>
                  </div>
                  <div className="flex items-baseline mt-1">
                    <span className={`text-5xl font-bold tracking-tight ${plan.popular ? "text-white" : "text-white/90"}`}>
                      {plan.price}
                    </span>
                    <span className={`ml-2 text-lg ${plan.popular ? "text-white/50" : "text-white/40"}`}>
                      {t.pricing.currency}
                    </span>
                  </div>
                  {/* Value anchor - psychological pricing */}
                  {plan.popular && (
                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <span className="text-xs text-emerald-400 font-medium">Save 40% vs agencies</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular 
                          ? "bg-blue-500/20" 
                          : "bg-white/[0.06]"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? "text-blue-400" : "text-white/50"}`} />
                      </div>
                      <span className={`text-sm ${plan.popular ? "text-white/80" : "text-white/60"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - Enhanced */}
                <button
                  onClick={handleSelectPlan}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group/btn ${
                    plan.popular
                      ? "text-white hover:scale-[1.02]"
                      : "bg-white/[0.05] hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  {plan.popular && (
                    <>
                      {/* Gradient background for popular plan */}
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-[length:200%_100%] group-hover/btn:animate-shimmer" />
                      <span className="absolute inset-0 shadow-lg shadow-blue-500/30 group-hover/btn:shadow-blue-500/50 rounded-xl" />
                      <span className="absolute inset-[1px] rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-60" />
                    </>
                  )}
                  <span className="relative">{t.pricing.getStarted}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust element */}
        <div className="text-center mt-12">
          <p className="text-white/30 text-sm">
            {t.pricing.vatNote}
          </p>
          {/* Social proof hint */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-full">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-[#050810]" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-[#050810]" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-[#050810]" />
            </div>
            <span className="text-white/40 text-sm">50+ businesses trust us</span>
          </div>
        </div>
      </div>
    </section>
  )
}
