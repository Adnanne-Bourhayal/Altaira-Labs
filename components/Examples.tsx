"use client"

import { useState } from "react"
import { Monitor, Calendar, BarChart3, Check } from "lucide-react"

const examples = [
  {
    title: "Professional Website",
    description: "Modern design that converts visitors into customers",
    icon: Monitor,
    features: ["Responsive on all devices", "SEO optimized", "Fast loading speed", "WhatsApp integration"],
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
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="flex items-center space-x-2 px-4 py-3 bg-black/40 border-b border-white/5">
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 w-fit">
            yoursite.com
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-white/20 rounded" />
          <div className="flex space-x-4">
            <div className="h-3 w-12 bg-white/10 rounded" />
            <div className="h-3 w-12 bg-white/10 rounded" />
            <div className="h-3 w-12 bg-white/10 rounded" />
          </div>
        </div>
        <div className="h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="h-6 w-48 bg-white/20 rounded mx-auto mb-3" />
            <div className="h-3 w-32 bg-white/10 rounded mx-auto" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-lg p-3">
              <div className="w-8 h-8 bg-blue-500/30 rounded-lg mb-2" />
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
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="p-6 space-y-5">
        <div className="text-center">
          <div className="text-white font-semibold mb-1">Select Date & Time</div>
          <div className="text-white/40 text-sm">Choose your preferred slot</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/40 text-sm">{"<"}</span>
            <span className="text-white/80 text-sm font-medium">January 2025</span>
            <span className="text-white/40 text-sm">{">"}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-white/30 py-1">{d}</div>
            ))}
            {[...Array(28)].map((_, i) => (
              <div
                key={i}
                className={`py-2 rounded-lg text-sm ${
                  i === 14 ? "bg-blue-500 text-white font-medium" : "text-white/50"
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
              className={`py-2.5 text-center text-sm rounded-lg font-medium ${
                i === 1 ? "bg-blue-500 text-white" : "bg-white/5 text-white/60"
              }`}
            >
              {time}
            </div>
          ))}
        </div>
        <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors">
          Confirm Booking
        </button>
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-semibold">Dashboard</div>
            <div className="text-white/40 text-xs">Last updated: now</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-white/40 text-xs mb-1">Bookings</div>
            <div className="text-white text-2xl font-bold">24</div>
            <div className="text-green-400 text-xs font-medium">+18%</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-white/40 text-xs mb-1">Revenue</div>
            <div className="text-white text-2xl font-bold">$1.2k</div>
            <div className="text-green-400 text-xs font-medium">+12%</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-white/40 text-xs mb-1">Clients</div>
            <div className="text-white text-2xl font-bold">156</div>
            <div className="text-green-400 text-xs font-medium">+8%</div>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 h-28 flex items-end space-x-1">
          {[35, 55, 40, 70, 50, 85, 60, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
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
    <section id="examples" className="py-24 bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            See it in action
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Real examples of what we build for businesses like yours
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white/5 rounded-full p-1.5 border border-white/10">
            {examples.map((example, index) => {
              const IconComponent = example.icon
              return (
                <button
                  key={index}
                  onClick={() => setActiveExample(index)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
                    activeExample === index
                      ? "bg-blue-600 text-white"
                      : "text-white/60 hover:text-white"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full -z-10" />
            {activeExample === 0 && <WebsiteMockup />}
            {activeExample === 1 && <BookingMockup />}
            {activeExample === 2 && <DashboardMockup />}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-3xl font-bold text-white mb-3">
              {examples[activeExample].title}
            </h3>
            <p className="text-white/60 text-lg mb-8">
              {examples[activeExample].description}
            </p>

            <div className="space-y-3 mb-8">
              {examples[activeExample].features.map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-white/70">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
            >
              I want this
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
