"use client"

import { useState } from "react"
import { Monitor, Calendar, BarChart3, Check } from "lucide-react"

const examples = [
  {
    title: "Professional Website",
    description: "Modern design that converts visitors into customers",
    icon: Monitor,
    features: ["Responsive on all devices", "SEO optimized", "Fast loading", "WhatsApp integration"],
  },
  {
    title: "Booking System",
    description: "Let clients book 24/7 without phone calls",
    icon: Calendar,
    features: ["Online appointments", "Automated reminders", "Calendar sync", "No-show reduction"],
  },
  {
    title: "Management Dashboard",
    description: "Track your business from anywhere",
    icon: BarChart3,
    features: ["Real-time analytics", "Client management", "Revenue tracking", "Performance insights"],
  },
]

function WebsiteMockup() {
  return (
    <div className="bg-gradient-to-br from-[#0a1020] to-[#0d1528] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
      <div className="flex items-center space-x-2 px-4 py-3 bg-black/30 border-b border-white/5">
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded-full bg-white/20" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white/10 rounded-full px-4 py-1.5 text-xs text-white/50 w-fit">
            yoursite.com
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-white/10 rounded" />
          <div className="flex space-x-4">
            <div className="h-3 w-10 bg-white/5 rounded" />
            <div className="h-3 w-10 bg-white/5 rounded" />
            <div className="h-3 w-10 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-36 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl flex items-center justify-center border border-blue-500/10">
          <div className="text-center">
            <div className="h-5 w-40 bg-white/15 rounded mx-auto mb-3" />
            <div className="h-3 w-28 bg-white/10 rounded mx-auto mb-4" />
            <div className="h-8 w-24 bg-blue-500/30 rounded-full mx-auto" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <div className="w-7 h-7 bg-blue-500/20 rounded-lg mb-2" />
              <div className="h-2 w-full bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BookingMockup() {
  return (
    <div className="bg-gradient-to-br from-[#0a1020] to-[#0d1528] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
      <div className="p-6 space-y-5">
        <div className="text-center">
          <div className="text-white font-semibold mb-1">Select Date & Time</div>
          <div className="text-white/30 text-sm">Choose your preferred slot</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/30 text-sm">{"<"}</span>
            <span className="text-white/70 text-sm font-medium">January 2026</span>
            <span className="text-white/30 text-sm">{">"}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-white/20 py-1">{d}</div>
            ))}
            {[...Array(28)].map((_, i) => (
              <div
                key={i}
                className={`py-2 rounded-lg text-sm ${
                  i === 14 ? "bg-blue-500 text-white font-medium" : "text-white/40 hover:bg-white/5"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["09:00", "10:30", "14:00", "16:00"].map((time, i) => (
            <div
              key={time}
              className={`py-2.5 text-center text-sm rounded-lg font-medium transition-colors ${
                i === 1 ? "bg-blue-500 text-white" : "bg-white/[0.03] text-white/50 border border-white/5"
              }`}
            >
              {time}
            </div>
          ))}
        </div>
        <button className="w-full py-3 bg-blue-600 rounded-xl text-white font-medium">
          Confirm Booking
        </button>
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="bg-gradient-to-br from-[#0a1020] to-[#0d1528] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-semibold">Dashboard</div>
            <div className="text-white/30 text-xs">Last updated: now</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="text-white/30 text-xs mb-1">Bookings</div>
            <div className="text-white text-xl font-bold">24</div>
            <div className="text-emerald-400 text-xs font-medium">+18%</div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="text-white/30 text-xs mb-1">Revenue</div>
            <div className="text-white text-xl font-bold">$1.2k</div>
            <div className="text-emerald-400 text-xs font-medium">+12%</div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="text-white/30 text-xs mb-1">Clients</div>
            <div className="text-white text-xl font-bold">156</div>
            <div className="text-emerald-400 text-xs font-medium">+8%</div>
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 h-24 flex items-end space-x-1 border border-white/5">
          {[35, 55, 40, 70, 50, 85, 60, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Examples() {
  const [activeExample, setActiveExample] = useState(0)

  return (
    <section id="examples" className="py-28 bg-[#050810] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-3xl rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            See it in action
          </h2>
          <p className="text-lg text-white/40">
            Real examples of what we build
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white/[0.03] rounded-full p-1.5 border border-white/[0.06]">
            {examples.map((example, index) => {
              const IconComponent = example.icon
              return (
                <button
                  key={index}
                  onClick={() => setActiveExample(index)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
                    activeExample === index
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium text-sm hidden sm:inline">{example.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full -z-10 scale-75" />
            {activeExample === 0 && <WebsiteMockup />}
            {activeExample === 1 && <BookingMockup />}
            {activeExample === 2 && <DashboardMockup />}
          </div>

          {/* Description */}
          <div className="order-1 lg:order-2">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              {examples[activeExample].title}
            </h3>
            <p className="text-white/50 text-lg mb-8 leading-relaxed">
              {examples[activeExample].description}
            </p>

            <div className="space-y-3 mb-10">
              {examples[activeExample].features.map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-white/60">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
            >
              I want this
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
